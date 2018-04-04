/**
 * Migration script for the ICO
 *
 * @see https://github.com/trufflesuite/truffle/issues/501#issuecomment-332589663
 */

const cnf           = require('../../cnf.json');
const CakToken      = artifacts.require('./ico/CakToken.sol');
const CakCrowdsale  = artifacts.require('./ico/CakCrowdsale.sol');

module.exports = function (deployer, network, accounts) { // eslint-disable-line
    deployer.deploy(CakToken);
    deployer.deploy(CakCrowdsale, cnf.startTime, cnf.endTime, cnf.rateWeiPerCak, cnf.fundReceiveWallet);
};
