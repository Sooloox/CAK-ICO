# ICO - Cash Acccount Key - CAK Crowdsale
 - 2 Stages: Presale to be handled manually through a function call to mint tokens. Regular capped & timed crowdsale.
   - Mintable token capped at 30 Million CAK tokens.
   - Crowdsale only allows whitelisted (through KYC/AML) addresses to invest during the crowdsale.

## Start Time:
- Epoch timestamp: 1525392000
- Human time (GMT): Friday, May 4, 2018 12:00:00 AM

## End Time:
- Epoch timestamp: 1561852800
- Human time (GMT): Sunday, June 30, 2019 12:00:00 AM

## Rate: Needs to be defined as part of the constructor (when deploying the contract)
- Planned Rate: 9.00 USD per CAK
- XXXX.00 USD per ETH  - use the CAK Rate Calc excel spread sheet
-   XX.XX USD per WEI
-  XXXeXX WEI per CAK - the spreadsheet calculates this number

## Cap
 - Total cap: 30 Million CAK tokens
 - Decimals: 0

## Beneficiary Wallet
0x25413e3bB6Eed34d8018C042Bd29d426638d3A3D

## Requirements
The server side scripts requires NodeJS 8.
Go to [NVM](https://github.com/creationix/nvm) and follow the installation description.
By running `source ./tools/initShell.sh`, the correct NodeJs version will be activated.

Yarn is required to be installed globally to minimize the risk of dependency issues.
Go to [Yarn](https://yarnpkg.com/en/docs/install) and choose the right installer for your system.

Depending on your system the following components might be already available or have to be provided manually:
* Python 2.7
* make (on Ubuntu this is part of the commonly installed `sudo apt-get install build-essential`)
* On OSX the build tools included in XCode are required

## General
Before running the provided scripts, you have to initialize your current terminal via `source ./initShell.sh`. This will add the current directory to the system PATH variables and must be repeated for time you start a new terminal window from project base directory.
```
cd <project base directory>
source ./initShell.sh
```

__Every command must be executed from within the projects base directory!__

## Setup
Open your terminal and change into your project base directory. From here, install all needed dependencies.
```
cd <project base directory>
source ./initShell.sh
yarn install
```
This will install all required dependecies in the directory _node_modules_.

## Compile, migrate and run unit tests
To deploy the ICO smart contracts, go into the projects root directory, and change into the truffle development console.
```
cd <project base directory>
source ./initShell.sh
yarn run dev
```

Now you can compile, migrate and run tests.
```
# Compile contract
compile

# Migrate contract
migrate

# Test the contract
test
```
__The development console will automatically start it's own TestRPC server for you!__

__Because the test consumes a lot of ETH, please restart the development console between each test!__

## Run the coverage test
To run the coverage tests, go into the projects root directory and run the coverage test like that.
```
cd <project base directory>
source ./initShell.sh
yarn run coverage
```
__The coverage test will automatically start it's own TestRPC server for you!__


## Deploying via MyEtherWallet.com & MetaMask

Navigate to myetherwallet.com


Go to 'Contracts'


Click on 'Deploy Contract'


Open a new tab, navigate to remix.ethereum.org.
Generate the 'bytecode' and 'abi' by pasting the solidity code


For 'CakCrowdsale.sol'; replace the import statements with these below:

```
import "https://github.com/OpenZeppelin/zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "https://github.com/OpenZeppelin/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./CakToken.sol";
```

For 'CakToken.sol'; replace the import statement with this below:

```
import "https://github.com/OpenZeppelin/zeppelin-solidity/contracts/token/MintableToken.sol";
```

With MetaMask installed. Open the JS Console using F12.  MetaMask injects a geth instance into the session.
Replace 'abi_provided_by_remix' & 'byte_code_provided_by_remix'

```
var abi = abi_provided_by_remix;
var rowByteCode = "byte_code_provided_by_remix";
var myContract = web3.eth.contract(abi);
var byteCodeWithParam = myContract.new.getData(1525392000, 1561852800, 9000000000000000, "0x25413e3bB6Eed34d8018C042Bd29d426638d3A3D", {data: rowByteCode});
```

Note: param list in order: startTime, endTime, cakPerWeiRate, wallet

Copy and paste. Press enter.


Type and press enter: 'byteCodeWithParam'
This will updated the new bytecode to be copied and deployed.
