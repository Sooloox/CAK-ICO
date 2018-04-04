/**
 * Test for CakToken
 *
 * @author Validity Labs AG <info@validitylabs.org>
 */

import {getEvents, BigNumber} from './helpers/tools';

const CakToken = artifacts.require('./CakToken');

const should = require('chai') // eslint-disable-line
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

/**
 * CakToken contract
 */
contract('CakToken', (accounts) => {
    const owner                 = accounts[0];

    const tokenHolder1          = accounts[2];
    const tokenHolder2          = accounts[3];
    const tokenHolder3          = accounts[4];

    // Provide cakTokenInstance for every test case
    let cakTokenInstance;
    beforeEach(async () => {
        cakTokenInstance = await CakToken.deployed();
    });

    it('should instantiate the ICO token correctly', async () => {
        const isOwnerAccountZero    = await cakTokenInstance.owner() === owner;
        const name      = await cakTokenInstance.name();
        const symbol    = await cakTokenInstance.symbol();
        const decimals  = await cakTokenInstance.decimals();

        assert.isTrue(isOwnerAccountZero, 'Owner is not the first account: ' + cakTokenInstance.owner());
        assert.equal(name, 'Cash Account Key', 'Name does not match');
        assert.equal(symbol, 'CAK', 'Symbol does not match');
        assert.equal(decimals, 0, 'Decimals does not match');
    });

    it('should mint 5 tokens for each token holder', async () => {
        let balanceTokenHolder1 = await cakTokenInstance.balanceOf(tokenHolder1);
        let balanceTokenHolder2 = await cakTokenInstance.balanceOf(tokenHolder2);
        let balanceTokenHolder3 = await cakTokenInstance.balanceOf(tokenHolder3);
        let totalSupply         = await cakTokenInstance.totalSupply();

        assert.equal(balanceTokenHolder1, 0, 'Wrong token balance of tokenHolder1 (is not 0): ' + balanceTokenHolder1);
        assert.equal(balanceTokenHolder2, 0, 'Wrong token balance of tokenHolder2 (is not 0): ' + balanceTokenHolder2);
        assert.equal(balanceTokenHolder3, 0, 'Wrong token balance of tokenHolder3 (is not 0): ' + balanceTokenHolder3);
        assert.equal(totalSupply, 0, 'Wrong total supply (is not 0): ' + totalSupply);

        const tx1 = await cakTokenInstance.mint(tokenHolder1, 5);
        const tx2 = await cakTokenInstance.mint(tokenHolder2, 5);
        const tx3 = await cakTokenInstance.mint(tokenHolder3, 5);

        balanceTokenHolder1 = await cakTokenInstance.balanceOf(tokenHolder1);
        balanceTokenHolder2 = await cakTokenInstance.balanceOf(tokenHolder2);
        balanceTokenHolder3 = await cakTokenInstance.balanceOf(tokenHolder3);
        totalSupply         = await cakTokenInstance.totalSupply();

        assert.equal(balanceTokenHolder1, 5, 'Wrong token balance of tokenHolder1 (is not 5): ' + balanceTokenHolder1);
        assert.equal(balanceTokenHolder2, 5, 'Wrong token balance of tokenHolder2 (is not 5): ' + balanceTokenHolder2);
        assert.equal(balanceTokenHolder3, 5, 'Wrong token balance of tokenHolder3 (is not 5): ' + balanceTokenHolder3);
        assert.equal(totalSupply, 15, 'Wrong total supply (is not 15): ' + totalSupply);

        // Testing events
        const events1 = getEvents(tx1);
        const events2 = getEvents(tx2);
        const events3 = getEvents(tx3);

        events1.Mint[0].amount.should.be.bignumber.equal(5);
        events2.Mint[0].amount.should.be.bignumber.equal(5);
        events3.Mint[0].amount.should.be.bignumber.equal(5);

        assert.equal(events1.Mint[0].to, tokenHolder1, 'Mint event to address doesn\'t match against tokenHolder1 address');
        assert.equal(events2.Mint[0].to, tokenHolder2, 'Mint event to address doesn\'t match against tokenHolder2 address');
        assert.equal(events3.Mint[0].to, tokenHolder3, 'Mint event to address doesn\'t match against tokenHolder3 address');

        events1.Transfer[0].value.should.be.bignumber.equal(5);
        events2.Transfer[0].value.should.be.bignumber.equal(5);
        events3.Transfer[0].value.should.be.bignumber.equal(5);
    });

    it('should transfer token of tokenHolder1 to tokenHolder2 using the transfer method', async () => {
        const tokenHolder1Balance1                  = await cakTokenInstance.balanceOf(tokenHolder1);
        const tokenHolder2Balance1                  = await cakTokenInstance.balanceOf(tokenHolder2);

        const tx = await cakTokenInstance.transfer(tokenHolder2, 5, {from: tokenHolder1});

        const tokenHolder2Balance2                  = await cakTokenInstance.balanceOf(tokenHolder2);

        tokenHolder2Balance1.plus(tokenHolder1Balance1).should.be.bignumber.equal(tokenHolder2Balance2);

        // Testing events
        const transferEvents = getEvents(tx, 'Transfer');

        assert.equal(transferEvents[0].from, tokenHolder1, 'Transfer event from address doesn\'t match against tokenHolder1 address');
        assert.equal(transferEvents[0].to, tokenHolder2, 'Transfer event to address doesn\'t match against tokenHolder2 address');
        transferEvents[0].value.should.be.bignumber.equal(5);
    });

    it('should transfer token of tokenHolder2 back to tokenHolder1 using the transferFrom method', async () => {
        const tokenHolder2Balance1  = await cakTokenInstance.balanceOf(tokenHolder2);
        const tokenHolder3Balance1  = await cakTokenInstance.balanceOf(tokenHolder3);

        const allow1 = await cakTokenInstance.allowance(tokenHolder2, tokenHolder1);
        allow1.should.be.bignumber.equal(0);

        await cakTokenInstance.approve(tokenHolder1, 5, {from: tokenHolder2});

        const allow2 = await cakTokenInstance.allowance(tokenHolder2, tokenHolder1);
        allow2.should.be.bignumber.equal(5);

        const tx = await cakTokenInstance.transferFrom(tokenHolder2, tokenHolder1, 5, {from: tokenHolder1});

        const tokenHolder1Balance2  = await cakTokenInstance.balanceOf(tokenHolder1);
        const tokenHolder2Balance2  = await cakTokenInstance.balanceOf(tokenHolder2);
        const tokenHolder3Balance2  = await cakTokenInstance.balanceOf(tokenHolder3);

        tokenHolder3Balance1.should.be.bignumber.equal(tokenHolder3Balance2);
        tokenHolder1Balance2.should.be.bignumber.equal(allow2);
        tokenHolder2Balance2.should.be.bignumber.equal(tokenHolder2Balance1.minus(allow2));

        // Testing events
        const transferEvents = getEvents(tx, 'Transfer');

        assert.equal(transferEvents[0].from, tokenHolder2, 'Transfer event from address doesn\'t match against tokenHolder2 address');
        assert.equal(transferEvents[0].to, tokenHolder1, 'Transfer event to address doesn\'t match against tokenHolder1 address');
        transferEvents[0].value.should.be.bignumber.equal(5);
    });
});
