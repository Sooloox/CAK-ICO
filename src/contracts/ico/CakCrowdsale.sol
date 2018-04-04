/**
 * @title CAK - Cash Account Key Crowdsale
 *
 * 2 Stage Crowdsale with the following features:
 * mintPresaleTokens() function for onlyOwner to call to mint tokens for the presale (presale not handled in this contract)
 * regular crowdsale for the CAK token with a token cap of 30,000,000 (including presale tokens)
 * whitelist for KYC/AML for during the crowdsale
 * manager mapping for manage the whitelist
 *
 * @version 1.0
 * @author Validity Labs AG <info@validitylabs.org>
 */
pragma solidity ^0.4.18;

import "../../../node_modules/zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./CakToken.sol";

contract CakCrowdsale is Ownable, Crowdsale {
    using SafeMath for uint256;

    enum SaleStages { Crowdsale, Finalized }
    SaleStages public currentStage;

    uint256 public constant TOKEN_CAP = 3e7;
    uint256 public totalTokensMinted;

    // allow managers to whitelist and confirm contributions by manager accounts
    // (managers can be set and altered by owner, multiple manager accounts are possible
    mapping(address => bool) public isManagers;

    // true if address is allowed to invest
    mapping(address => bool) public isWhitelisted;

    // list of events
    event ChangedInvestorWhitelisting(address indexed investor, bool whitelisted);
    event ChangedManager(address indexed manager, bool active);
    event PresaleMinted(address indexed beneficiary, uint256 tokenAmount);
    event CakCalcAmount(uint256 tokenAmount, uint256 weiReceived, uint256 rate);
    event RefundAmount(address indexed beneficiary, uint256 refundAmount);

    // list of modifers
    modifier onlyManager(){
        require(isManagers[msg.sender]);
        _;
    }

    modifier onlyCrowdsaleStage() {
        require(currentStage == SaleStages.Crowdsale);
        _;
    }

    /**
     * @dev Constructor
     * @param _startTime uint256
     * @param _endTime unit256
     * @param _rate uint256
     * @param _wallet address
     */
    function CakCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet)
        Crowdsale(_startTime, _endTime, _rate, _wallet)
        public
    {
        setManager(msg.sender, true);
        currentStage = SaleStages.Crowdsale;
    }

    /**
     * @dev mint tokens for presale beneficaries
     * @param _beneficiary address address of the presale buyer
     * @param _amount unit256 amount of CAK tokens they will receieve
     */
    function mintPresaleTokens(address _beneficiary, uint256 _amount) public onlyOwner onlyCrowdsaleStage {
        require(_beneficiary != address(0));
        require(_amount > 0);
        require(totalTokensMinted.add(_amount) <= TOKEN_CAP);
        require(now < startTime);

        token.mint(_beneficiary, _amount);
        totalTokensMinted = totalTokensMinted.add(_amount);
        PresaleMinted(_beneficiary, _amount);
    }

     /**
     * @dev entry point for the buying of CAK tokens. overriding open zeppelins buyTokens()
     * @param _beneficiary address address of the investor, must be whitelested first
     */
    function buyTokens(address _beneficiary) public payable onlyCrowdsaleStage {
        require(_beneficiary != address(0));
        require(isWhitelisted[msg.sender]);
        require(validPurchase());
        require(msg.value >= rate);  //rate == minimum amount in WEI to purchase 1 CAK token

        uint256 weiAmount = msg.value;
        weiRaised = weiRaised.add(weiAmount);

        // Calculate the amount of tokens
        uint256 tokens = calcCakAmount(weiAmount);
        CakCalcAmount(tokens, weiAmount, rate);
        require(totalTokensMinted.add(tokens) <= TOKEN_CAP);

        token.mint(_beneficiary, tokens);
        totalTokensMinted = totalTokensMinted.add(tokens);
        TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);

        uint256 refundAmount = refundLeftOverWei(weiAmount, tokens);
        if (refundAmount > 0) {
            weiRaised = weiRaised.sub(refundAmount);
            msg.sender.transfer(refundAmount);
            RefundAmount(msg.sender, refundAmount);
        }

        forwardEther(refundAmount);
    }

     /**
     * @dev set manager to true/false to enable/disable manager rights
     * @param _manager address address of the manager to create/alter
     * @param _active bool flag that shows if the manager account is active
     */
    function setManager(address _manager, bool _active) public onlyOwner {
        require(_manager != address(0));
        isManagers[_manager] = _active;
        ChangedManager(_manager, _active);
    }

    /**
     * @dev whitelister "account". This can be done from managers only
     * @param _investor address address of the investor's wallet
     */
    function whiteListInvestor(address _investor) external onlyManager {
        require(_investor != address(0));
        isWhitelisted[_investor] = true;
        ChangedInvestorWhitelisting(_investor, true);
    }

    /**
     * @dev whitelister "accounts". This can be done from managers only
     * @param _investors address[] addresses of the investors' wallet
     */
    function batchWhiteListInvestors(address[] _investors) external onlyManager {
        address investor;

        for (uint256 c; c < _investors.length; c = c.add(1)) {
            investor = _investors[c]; // gas optimization
            isWhitelisted[investor] = true;
            ChangedInvestorWhitelisting(investor, true);
        }
    }

    /**
     * @dev un-whitelister "account". This can be done from managers only
     * @param _investor address address of the investor's wallet
     */
    function unWhiteListInvestor(address _investor) external onlyManager {
        require(_investor != address(0));
        isWhitelisted[_investor] = false;
        ChangedInvestorWhitelisting(_investor, false);
    }

    /**
     * @dev ends the crowdsale, callable only by contract owner
     */
    function finalizeSale() public onlyOwner {
         currentStage = SaleStages.Finalized;
         token.finishMinting();
    }

    /**
     * @dev calculate WEI to CAK tokens to mint
     * @param weiReceived uint256 wei received from the investor
     */
    function calcCakAmount(uint256 weiReceived) public view returns (uint256) {
        uint256 tokenAmount = weiReceived.div(rate);
        return tokenAmount;
    }

    /**
     * @dev calculate WEI refund to investor, if any. This handles rounding errors
     * which are important here due to the 0 decimals
     * @param weiReceived uint256 wei received from the investor
     * @param tokenAmount uint256 CAK tokens minted for investor
     */
    function refundLeftOverWei(uint256 weiReceived, uint256 tokenAmount) internal view returns (uint256) {
        uint256 refundAmount = 0;
        uint256 weiInvested = tokenAmount.mul(rate);
        if (weiInvested < weiReceived)
            refundAmount = weiReceived.sub(weiInvested);
        return refundAmount;
    }

    /**
     * Overrides the Crowdsale.createTokenContract to create a CAK token
     * instead of a default MintableToken.
     */
    function createTokenContract() internal returns (MintableToken) {
        return new CakToken();
    }

    /**
     * @dev forward Ether to wallet with proper amount subtracting refund, if refund exists
     * @param refund unint256 the amount refunded to the investor, if > 0 
     */
    function forwardEther(uint256 refund) internal {
        wallet.transfer(msg.value.sub(refund));
    }
}
