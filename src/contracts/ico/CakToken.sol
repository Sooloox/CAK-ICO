/**
 * @title CAK - Cash Account Key Token
 * @version 1.0
 * @author Validity Labs AG <info@validitylabs.org>
 */
pragma solidity ^0.4.18;

import "../../../node_modules/zeppelin-solidity/contracts/token/MintableToken.sol";

contract CakToken is MintableToken {
    string public constant name = "Cash Account Key";
    string public constant symbol = "CAK";
    uint8 public constant decimals = 0;
}
