/**
 * Test for CakCrowdsale
 *
 * @author Validity Labs AG <info@validitylabs.org>
 */

import {getEvents, BigNumber, cnf, increaseTimeTo} from './helpers/tools';
import expectThrow from './helpers/expectThrow';

const CakCrowdsale  = artifacts.require('./CakCrowdsale');
const CakToken      = artifacts.require('./CakToken');

const saleStages = ['Crowdsale', 'Finalized'];

const should = require('chai') // eslint-disable-line
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const zero      = new BigNumber(0);

/**
 * CakToken contract
 */
contract('CakCrowdsale', (accounts) => {
    const owner             = accounts[0];
    const activeManager     = accounts[1];
    const inactiveManager   = accounts[2];
    const activeInvestor1   = accounts[3];
    const activeInvestor2   = accounts[4];
    const inactiveInvestor1 = accounts[5];
    const wallet            = cnf.fundReceiveWallet;

    // Provide cakTokenInstance for every test case
    let cakCrowdsaleInstance;
    let cakTokenInstance;

    beforeEach(async () => {
        cakCrowdsaleInstance    = await CakCrowdsale.deployed();
        const CakTokenAddress   = await cakCrowdsaleInstance.token();
        cakTokenInstance        = await CakToken.at(CakTokenAddress);
    });

    /**
     * [ Pre crowdsale period ]
     */

    it('should instantiate the ICO crowdsale correctly', async () => {
        console.log('[ Pre crowdsale period ]'.yellow);

        // Set DTS to Thursday, May 3, 2018 11:26:40 PM
        await increaseTimeTo(1525390000);

        const _startTime = await cakCrowdsaleInstance.startTime();
        const _endTime = await cakCrowdsaleInstance.endTime();
        const _wallet = await cakCrowdsaleInstance.wallet();
        const _weiCakRate = await cakCrowdsaleInstance.rate();
        const _cap = await cakCrowdsaleInstance.TOKEN_CAP(); // eslint-disable-line no-use-before-define
        const bigCap = new BigNumber(cnf.cap);

        assert.equal(_startTime.toNumber(), cnf.startTime);
        assert.equal(_endTime.toNumber(), cnf.endTime);
        assert.equal(_weiCakRate.toNumber(), cnf.rateWeiPerCak);
        assert.equal(_wallet, wallet);
        assert.equal(_cap.toNumber(), bigCap);
        assert.equal(saleStages[await await cakCrowdsaleInstance.currentStage.call()], 'Crowdsale');
    });

    it('should verify, the calcCakAmount function calculates correctly', async () => {
        const cakTokenAmount = (await cakCrowdsaleInstance.calcCakAmount.call(web3.toWei(2, 'ether'))).toNumber();

        assert.equal(cakTokenAmount, 222);
    });

    it('should verify, the owner is added properly to manager accounts', async () => {
        const manager = await cakCrowdsaleInstance.isManagers(owner);

        assert.isTrue(manager, 'Owner should be a manager too');
    });

    it('should set manager accounts', async () => {
        const tx1 = await cakCrowdsaleInstance.setManager(activeManager, true, {from: owner, gas: 1000000});
        const tx2 = await cakCrowdsaleInstance.setManager(inactiveManager, false, {from: owner, gas: 1000000});
        const manager1 = await cakCrowdsaleInstance.isManagers(activeManager);
        const manager2 = await cakCrowdsaleInstance.isManagers(inactiveManager);

        assert.isTrue(manager1, 'Manager 1 should be active');
        assert.isFalse(manager2, 'Manager 2 should be inactive');

        // Testing events
        const events1 = getEvents(tx1, 'ChangedManager');
        const events2 = getEvents(tx2, 'ChangedManager');

        assert.equal(events1[0].manager, activeManager, 'activeManager address does not match');
        assert.isTrue(events1[0].active, 'activeManager expected to be active');
        assert.equal(events2[0].manager, inactiveManager, 'inactiveManager address does not match');
        assert.isFalse(events2[0].active, 'inactiveManager expected to be inactive');
    });

    it('should alter manager accounts', async () => {
        const tx1 = await cakCrowdsaleInstance.setManager(activeManager, false, {from: owner, gas: 1000000});
        const tx2 = await cakCrowdsaleInstance.setManager(inactiveManager, true, {from: owner, gas: 1000000});
        const manager1 = await cakCrowdsaleInstance.isManagers(activeManager);
        const manager2 = await cakCrowdsaleInstance.isManagers(inactiveManager);

        assert.isFalse(manager1, 'Manager 1 should be inactive');
        assert.isTrue(manager2, 'Manager 2 should be active');

        // Testing events
        const events1 = getEvents(tx1, 'ChangedManager');
        const events2 = getEvents(tx2, 'ChangedManager');

        assert.isFalse(events1[0].active, 'activeManager expected to be inactive');
        assert.isTrue(events2[0].active, 'inactiveManager expected to be active');

        // Roll back to origin values
        const tx3 = await cakCrowdsaleInstance.setManager(activeManager, true, {from: owner, gas: 1000000});
        const tx4 = await cakCrowdsaleInstance.setManager(inactiveManager, false, {from: owner, gas: 1000000});
        const manager3 = await cakCrowdsaleInstance.isManagers(activeManager);
        const manager4 = await cakCrowdsaleInstance.isManagers(inactiveManager);

        assert.isTrue(manager3, 'Manager 1 should be active');
        assert.isFalse(manager4, 'Manager 2 should be inactive');

        const events3 = getEvents(tx3, 'ChangedManager');
        const events4 = getEvents(tx4, 'ChangedManager');

        assert.isTrue(events3[0].active, 'activeManager expected to be active');
        assert.isFalse(events4[0].active, 'inactiveManager expected to be inactive');
    });

    it('should fail, because we try to set manager from unauthorized account', async () => {
        await expectThrow(cakCrowdsaleInstance.setManager(activeManager, false, {from: activeInvestor1, gas: 1000000}));
    });

    it('should whitelist investor accounts', async () => {
        const tx1 = await cakCrowdsaleInstance.whiteListInvestor(activeInvestor1, {from: owner, gas: 1000000});
        const tx2 = await cakCrowdsaleInstance.whiteListInvestor(activeInvestor2, {from: activeManager, gas: 1000000});
        const whitelisted1 = await cakCrowdsaleInstance.isWhitelisted(activeInvestor1);
        const whitelisted2 = await cakCrowdsaleInstance.isWhitelisted(activeInvestor2);

        assert.isTrue(whitelisted1, 'Investor1 should be whitelisted');
        assert.isTrue(whitelisted2, 'Investor2 should be whitelisted');

        // Testing events
        const events1 = getEvents(tx1, 'ChangedInvestorWhitelisting');
        const events2 = getEvents(tx2, 'ChangedInvestorWhitelisting');

        assert.equal(events1[0].investor, activeInvestor1, 'Investor1 address doesn\'t match');
        assert.isTrue(events1[0].whitelisted, 'Investor1 should be whitelisted');
        assert.equal(events2[0].investor, activeInvestor2, 'Investor2 address doesn\'t match');
        assert.isTrue(events2[0].whitelisted, 'Investor2 should be whitelisted');
    });

    it('should unwhitelist investor account', async () => {
        const tx            = await cakCrowdsaleInstance.unWhiteListInvestor(inactiveInvestor1, {from: owner, gas: 1000000});
        const whitelisted   = await cakCrowdsaleInstance.isWhitelisted(inactiveInvestor1);

        assert.isFalse(whitelisted, 'inactiveInvestor1 should be unwhitelisted');

        // Testing events
        const events = getEvents(tx, 'ChangedInvestorWhitelisting');

        assert.equal(events[0].investor, inactiveInvestor1, 'inactiveInvestor1 address doesn\'t match');
        assert.isFalse(events[0].whitelisted, 'inactiveInvestor1 should be unwhitelisted');
    });

    it('should fail, because we try to whitelist investor from unauthorized account', async () => {
        await expectThrow(cakCrowdsaleInstance.whiteListInvestor(inactiveInvestor1, {from: activeInvestor2, gas: 1000000}));
    });

    it('should fail, because we try to unwhitelist investor from unauthorized account', async () => {
        await expectThrow(cakCrowdsaleInstance.whiteListInvestor(activeInvestor1, {from: activeInvestor2, gas: 1000000}));
    });

    it('should fail, because we try to run batchWhiteListInvestors with a non manager account', async () => {
        await expectThrow(cakCrowdsaleInstance.batchWhiteListInvestors([activeInvestor1, activeInvestor2], {from: activeInvestor2, gas: 1000000}));
    });

    it('should fail, because we try to run unWhiteListInvestor with a non manager account', async () => {
        await expectThrow(cakCrowdsaleInstance.unWhiteListInvestor(activeInvestor1, {from: activeInvestor2, gas: 1000000}));
    });

    it('should whitelist 2 investors by batch function', async () => {
        await cakCrowdsaleInstance.unWhiteListInvestor(activeInvestor1, {from: owner, gas: 1000000});
        await cakCrowdsaleInstance.unWhiteListInvestor(activeInvestor2, {from: owner, gas: 1000000});
        const tx = await cakCrowdsaleInstance.batchWhiteListInvestors([activeInvestor1, activeInvestor2], {from: owner, gas: 1000000});
        const whitelisted1  = await cakCrowdsaleInstance.isWhitelisted(activeInvestor1);
        const whitelisted2  = await cakCrowdsaleInstance.isWhitelisted(activeInvestor2);

        assert.isTrue(whitelisted1, 'activeInvestor1 should be whitelisted');
        assert.isTrue(whitelisted2, 'activeInvestor2 should be whitelisted');

        // Testing events
        const events = getEvents(tx, 'ChangedInvestorWhitelisting');

        assert.equal(events[0].investor, activeInvestor1, 'Investor1 address doesn\'t match');
        assert.isTrue(events[0].whitelisted, 'Investor1 should be whitelisted');
        assert.equal(events[1].investor, activeInvestor2, 'Investor2 address doesn\'t match');
        assert.isTrue(events[1].whitelisted, 'Investor2 should be whitelisted');
    });

    it('should verify the investor account states succesfully', async () => {
        const whitelisted1  = await cakCrowdsaleInstance.isWhitelisted(activeInvestor1);
        const whitelisted2  = await cakCrowdsaleInstance.isWhitelisted(activeInvestor2);
        const whitelisted3  = await cakCrowdsaleInstance.isWhitelisted(inactiveInvestor1);

        assert.isTrue(whitelisted1, 'activeInvestor1 should be whitelisted');
        assert.isTrue(whitelisted2, 'activeInvestor2 should be whitelisted');
        assert.isFalse(whitelisted3, 'inactiveInvestor1 should be unwhitelisted');
    });

    it('should fail, because we try to mint tokens for presale with a non owner account', async () => {
        await expectThrow(cakCrowdsaleInstance.mintPresaleTokens(activeInvestor1, 1, {from: activeManager, gas: 1000000}));
    });

    it('should fail, because we try to mint tokens more as cap limit allows', async () => {
        await expectThrow(cakCrowdsaleInstance.mintPresaleTokens(activeInvestor1, (cnf.cap + 1)));
    });

    it('should fail, because we try to trigger buyTokens in before contribution time is started', async () => {
        await expectThrow(cakCrowdsaleInstance.buyTokens(activeInvestor1, {from: activeInvestor2, gas: 1000000}));
    });

    it('should fail, because we try to trigger the fallback function before contribution time is started', async () => {
        await expectThrow(cakCrowdsaleInstance.sendTransaction({
            from:   owner,
            value:  web3.toWei(1, 'ether'),
            gas:    700000
        }));
    });

    it('should mint tokens for presale', async () => {
        const activeInvestor1Balance1   = await cakTokenInstance.balanceOf(activeInvestor1);
        const activeInvestor2Balance1   = await cakTokenInstance.balanceOf(activeInvestor2);
        const tenB                       = new BigNumber(10);
        const fiveB                      = new BigNumber(5);

        activeInvestor1Balance1.should.be.bignumber.equal(zero);
        activeInvestor2Balance1.should.be.bignumber.equal(zero);

        const tx1 = await cakCrowdsaleInstance.mintPresaleTokens(activeInvestor1, 10);
        const tx2 = await cakCrowdsaleInstance.mintPresaleTokens(activeInvestor2, 5);
        const activeInvestor1Balance2 = await cakTokenInstance.balanceOf(activeInvestor1);
        const activeInvestor2Balance2 = await cakTokenInstance.balanceOf(activeInvestor2);

        activeInvestor1Balance2.should.be.bignumber.equal(tenB);
        activeInvestor2Balance2.should.be.bignumber.equal(fiveB);

        // Testing events
        const events1 = getEvents(tx1, 'PresaleMinted');
        const events2 = getEvents(tx2, 'PresaleMinted');

        assert.equal(events1[0].beneficiary, activeInvestor1, '');
        assert.equal(events2[0].beneficiary, activeInvestor2, '');

        events1[0].tokenAmount.should.be.bignumber.equal(tenB);
        events2[0].tokenAmount.should.be.bignumber.equal(fiveB);

        // Test total supply
        const totalSupply = await cakTokenInstance.totalSupply.call();
        assert.equal(totalSupply, 15);

        // Test totalTokensMinted
        const totalMinted = await cakCrowdsaleInstance.totalTokensMinted.call();
        assert.equal(totalMinted.toNumber(), 15);
    });

    /**
     * [ Crowdsale period ]
     */

    it('should turn the time forward to crowdsale startTime', async () => {
        console.log('[ Crowdsale period ]'.yellow);
        await increaseTimeTo(cnf.startTime);
    });

    it('should fail, because we try to trigger buyTokens as unwhitelisted investor', async () => {
        await expectThrow(cakCrowdsaleInstance.buyTokens(activeInvestor1, {from: inactiveInvestor1, gas: 1000000, value: web3.toWei(2, 'ether')}));
    });

    it('should fail, because we try to trigger buyTokens with a too low investment', async () => {
        await expectThrow(cakCrowdsaleInstance.buyTokens(
            activeInvestor1,
            {from: activeInvestor1, gas: 1000000, value: web3.toWei(0.0089, 'ether')}
        ));
    });

    it('should fail, because we try to trigger buyTokens for beneficiary 0x0', async () => {
        await expectThrow(cakCrowdsaleInstance.buyTokens(
            '0x0',
            {from: activeInvestor1, gas: 1000000, value: web3.toWei(1, 'ether')}
        ));
    });

    // *** Need Account with enough ether!!!  ***

    // it('should fail, because we try to buy tokens more as cap limit allows', async () => {

    //     const capInWei = new BigNumber(cnf.rateWeiPerCak * cnf.cap);

    //     await expectThrow(cakCrowdsaleInstance.buyTokens(
    //         activeInvestor1,
    //         {from: activeInvestor1, gas: 1000000, value: capInWei}
    //     ));
    // });

    it('should buyTokens properly', async () => {
        const tx    = await cakCrowdsaleInstance.buyTokens(
            activeInvestor1,
            {from: activeInvestor2, gas: 1000000, value: web3.toWei(2, 'ether')}
        );

        // Testing events
        const events = getEvents(tx, 'TokenPurchase');
        const events2 = getEvents(tx, 'RefundAmount');

        assert.equal(events[0].purchaser, activeInvestor2, 'activeInvestor2 does not match purchaser');
        assert.equal(events[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        // Check the Refund amount and to whom it was sent to
        assert.equal(events2[0].beneficiary, activeInvestor2, 'activeInvestor2 does not match beneficiary');
        assert.equal((events2[0].refundAmount).toNumber(), web3.toWei(0.002, 'ether'), 'does not match refund amount in wei');

        events[0].value.should.be.bignumber.equal(web3.toWei(2, 'ether'));
        events[0].amount.should.be.bignumber.equal(222);

        // Test total supply
        const totalSupply = await cakTokenInstance.totalSupply.call();
        assert.equal(totalSupply.toNumber(), 237);

        // Test totalTokensMinted
        const totalMinted = await cakCrowdsaleInstance.totalTokensMinted.call();
        assert.equal(totalMinted.toNumber(), 237);
    });

    it('should call the fallback function successfully', async () => {
        const tx1   = await cakCrowdsaleInstance.sendTransaction({
            from:   activeInvestor1,
            value:  web3.toWei(3, 'ether'),
            gas:    1000000
        });

        // Testing events
        const events = getEvents(tx1, 'TokenPurchase');
        const events2 = getEvents(tx1, 'RefundAmount');

        assert.equal(events[0].purchaser, activeInvestor1, 'activeInvestor1 does not match purchaser');
        assert.equal(events[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events[0].value.should.be.bignumber.equal(web3.toWei(3, 'ether'));
        events[0].amount.should.be.bignumber.equal(333);

        // Check the Refund amount and to whom it was sent to
        assert.equal(events2[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');
        assert.equal((events2[0].refundAmount).toNumber(), web3.toWei(0.003, 'ether'), 'does not match refund amount in wei');

        const tx2   = await cakCrowdsaleInstance.sendTransaction({
            from:   activeInvestor1,
            value:  web3.toWei(4, 'ether'),
            gas:    1000000
        });

        // Testing events
        const events3 = getEvents(tx2, 'TokenPurchase');
        const events7 = getEvents(tx2, 'RefundAmount');

        assert.equal(events3[0].purchaser, activeInvestor1, 'activeInvestor1 does not match purchaser');
        assert.equal(events3[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events3[0].value.should.be.bignumber.equal(web3.toWei(4, 'ether'));
        events3[0].amount.should.be.bignumber.equal(444);

        // Check the Refund amount and to whom it was sent to
        assert.equal(events7[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');
        assert.equal((events7[0].refundAmount).toNumber(), web3.toWei(0.004, 'ether'), 'does not match refund amount in wei');

        const tx3   = await cakCrowdsaleInstance.sendTransaction({
            from:   activeInvestor2,
            value:  web3.toWei(5, 'ether'),
            gas:    1000000
        });

        // Testing events
        const events4 = getEvents(tx3, 'TokenPurchase');
        const events8 = getEvents(tx3, 'RefundAmount');

        assert.equal(events4[0].purchaser, activeInvestor2, 'activeInvestor2 does not match purchaser');
        assert.equal(events4[0].beneficiary, activeInvestor2, 'activeInvestor2 does not match beneficiary');

        events4[0].value.should.be.bignumber.equal(web3.toWei(5, 'ether'));
        events4[0].amount.should.be.bignumber.equal(555);

        // Check the Refund amount and to whom it was sent to
        assert.equal(events8[0].beneficiary, activeInvestor2, 'activeInvestor2 does not match beneficiary');
        assert.equal((events8[0].refundAmount).toNumber(), web3.toWei(0.005, 'ether'), 'does not match refund amount in wei');

        const tx4   = await cakCrowdsaleInstance.sendTransaction({
            from:   activeInvestor1,
            value:  web3.toWei(6, 'ether'),
            gas:    1000000
        });

        // Testing events
        const events5 = getEvents(tx4, 'TokenPurchase');
        const events9 = getEvents(tx4, 'RefundAmount');

        assert.equal(events5[0].purchaser, activeInvestor1, 'activeInvestor1 does not match purchaser');
        assert.equal(events5[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events5[0].value.should.be.bignumber.equal(web3.toWei(6, 'ether'));
        events5[0].amount.should.be.bignumber.equal(666);

        // Check the Refund amount and to whom it was sent to
        assert.equal(events9[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');
        assert.equal((events9[0].refundAmount).toNumber(), web3.toWei(0.006, 'ether'), 'does not match refund amount in wei');

        // Test total supply
        const totalSupply = await cakTokenInstance.totalSupply.call();
        assert.equal(totalSupply.toNumber(), 2235);

        // Test totalTokensMinted
        const totalMinted = await cakCrowdsaleInstance.totalTokensMinted.call();
        assert.equal(totalMinted.toNumber(), 2235);
    });

    /**
    * [ End Contribution period ]
    */

    it('should turn the time forward passed endTime', async () => {
        console.log('[ End Contribution period ]'.yellow);
        await increaseTimeTo(cnf.endTime + 1);
    });

    it('should fail, because we try to trigger buyTokens after ICO endTime', async () => {
        await expectThrow(cakCrowdsaleInstance.buyTokens(
            activeInvestor1,
            {from: activeInvestor1, gas: 1000000, value: web3.toWei(1, 'ether')}
        ));
    });

    it('should call finalize successfully', async () => {
        await cakCrowdsaleInstance.token();
        await cakTokenInstance.owner();
        await cakCrowdsaleInstance.finalizeSale();
    });

    it('should not mint more tokens after finalize()', async () => {
        await expectThrow(cakTokenInstance.mint(owner, 1, {from: owner, gas: 1000000}));
    });
});
