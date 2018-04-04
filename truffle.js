/**
 * Truffle configuration
 *
 * @see https://github.com/trufflesuite/truffle-config/blob/master/index.js
 * @see https://github.com/trufflesuite/truffle/releases
 */
const cnf = require('./cnf.json');

require('babel-register');
require('babel-polyfill');

const path      = require('path');
const basePath  = process.cwd();

const buildDir          = path.join(basePath, 'build');
const buildDirContracts = path.join(basePath, 'build/contracts');
const srcDir            = path.join(basePath, 'src/contracts');
const testDir           = path.join(basePath, 'test/contracts');
const migrationsDir     = path.join(basePath, 'migrations/contracts');

module.exports = {
    mocha: {
        useColors: true
    },
    solc: {
        optimizer: {
            enabled:    true,
            runs:       200
        }
    },
    networks: {
        develop: {
            host:       cnf.networks.develop.host,
            port:       cnf.networks.develop.port,
            network_id: cnf.networks.develop.chainId,
            gas:        cnf.networks.develop.gas,
            gasPrice:   cnf.networks.develop.gasPrice
        },
        coverage: {
            host:       cnf.networks.coverage.host,
            network_id: cnf.networks.coverage.chainId,
            port:       cnf.networks.coverage.port,
            gas:        cnf.networks.coverage.gas,
            gasPrice:   cnf.networks.coverage.gasPrice
        }
    },
    build_directory:            buildDir,
    contracts_build_directory:  buildDirContracts,
    migrations_directory:       migrationsDir,
    contracts_directory:        srcDir,
    test_directory:             testDir
};
