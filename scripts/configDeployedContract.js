/*
 * This script helps configure the CtdToken contract after the deployment.
 * The script is supposed to be loaded into geth console (geth attach http://localhost:8545).
 * 1. Update addresses in the end of this file.
 * 2. In geth console run the command:
 * > loadScript('scripts/configDeployedContract.js');
 * 3. In geth console run (manually) the commands which 'console.log' printed to test these commands.
 * 4. After testing run same commands with '.call' replaced by '.sendTransaction' to make changes.
 */

var abi = [
                {
                    "constant": true,
                    "inputs": [],
                    "name": "name",
                    "outputs": [
                        {
                            "name": "",
                            "type": "string"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_spender",
                            "type": "address"
                        },
                        {
                            "name": "_value",
                            "type": "uint256"
                        }
                    ],
                    "name": "approve",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_pauseMaster",
                            "type": "address"
                        }
                    ],
                    "name": "setPauseMaster",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "totalSupply",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_from",
                            "type": "address"
                        },
                        {
                            "name": "_to",
                            "type": "address"
                        },
                        {
                            "name": "_value",
                            "type": "uint256"
                        }
                    ],
                    "name": "transferFrom",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "icoOpeningTime",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint64"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint8"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [],
                    "name": "withdraw",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [],
                    "name": "returnWei",
                    "outputs": [],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "value",
                            "type": "uint256"
                        }
                    ],
                    "name": "upgrade",
                    "outputs": [],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "closingTime",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint64"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "upgradeAgent",
                    "outputs": [
                        {
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "upgradeMaster",
                    "outputs": [
                        {
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_spender",
                            "type": "address"
                        },
                        {
                            "name": "_subtractedValue",
                            "type": "uint256"
                        }
                    ],
                    "name": "decreaseApproval",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [
                        {
                            "name": "_owner",
                            "type": "address"
                        }
                    ],
                    "name": "balanceOf",
                    "outputs": [
                        {
                            "name": "balance",
                            "type": "uint256"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [],
                    "name": "pause",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "owner",
                    "outputs": [
                        {
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "bounty",
                    "outputs": [
                        {
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "symbol",
                    "outputs": [
                        {
                            "name": "",
                            "type": "string"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_to",
                            "type": "address"
                        },
                        {
                            "name": "_value",
                            "type": "uint256"
                        }
                    ],
                    "name": "transfer",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_upgradeAgent",
                            "type": "address"
                        },
                        {
                            "name": "_revision",
                            "type": "uint32"
                        }
                    ],
                    "name": "setUpgradeAgent",
                    "outputs": [],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "phase",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint8"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_bounty",
                            "type": "address"
                        }
                    ],
                    "name": "setBounty",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "pauseMaster",
                    "outputs": [
                        {
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "totalUpgraded",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_spender",
                            "type": "address"
                        },
                        {
                            "name": "_addedValue",
                            "type": "uint256"
                        }
                    ],
                    "name": "increaseApproval",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "pauseEnd",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint64"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [
                        {
                            "name": "_owner",
                            "type": "address"
                        },
                        {
                            "name": "_spender",
                            "type": "address"
                        }
                    ],
                    "name": "allowance",
                    "outputs": [
                        {
                            "name": "remaining",
                            "type": "uint256"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "REVISION",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint32"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [],
                    "name": "create",
                    "outputs": [
                        {
                            "name": "success",
                            "type": "bool"
                        }
                    ],
                    "payable": true,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "totalProceeds",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "newOwner",
                            "type": "address"
                        }
                    ],
                    "name": "transferOwnership",
                    "outputs": [],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "preIcoOpeningTime",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint64"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "returnAllowedTime",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint64"
                        }
                    ],
                    "payable": false,
                    "type": "function"
                },
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_upgradeMaster",
                            "type": "address"
                        }
                    ],
                    "name": "setUpgradeMaster",
                    "outputs": [],
                    "payable": false,
                    "type": "function"
                },
                {
                    "inputs": [
                        {
                            "name": "_preIcoOpeningTime",
                            "type": "uint64"
                        }
                    ],
                    "payable": true,
                    "type": "constructor"
                },
                {
                    "payable": true,
                    "type": "fallback"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": false,
                            "name": "amount",
                            "type": "uint256"
                        }
                    ],
                    "name": "NewTokens",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": false,
                            "name": "funder",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "name": "value",
                            "type": "uint256"
                        }
                    ],
                    "name": "NewFunds",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": false,
                            "name": "phase",
                            "type": "uint8"
                        }
                    ],
                    "name": "NewPhase",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "name": "drawer",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "name": "weiAmount",
                            "type": "uint256"
                        }
                    ],
                    "name": "Withdrawal",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "name": "drawer",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "name": "weiAmount",
                            "type": "uint256"
                        }
                    ],
                    "name": "Withdrawn",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [],
                    "name": "Paused",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "name": "_from",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "name": "_value",
                            "type": "uint256"
                        }
                    ],
                    "name": "Upgrade",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": false,
                            "name": "agent",
                            "type": "address"
                        }
                    ],
                    "name": "UpgradeEnabled",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "name": "previousOwner",
                            "type": "address"
                        },
                        {
                            "indexed": true,
                            "name": "newOwner",
                            "type": "address"
                        }
                    ],
                    "name": "OwnershipTransferred",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "name": "owner",
                            "type": "address"
                        },
                        {
                            "indexed": true,
                            "name": "spender",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "name": "value",
                            "type": "uint256"
                        }
                    ],
                    "name": "Approval",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "name": "from",
                            "type": "address"
                        },
                        {
                            "indexed": true,
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "name": "value",
                            "type": "uint256"
                        }
                    ],
                    "name": "Transfer",
                    "type": "event"
                }
            ];

var contract = web3.eth.contract(abi).at('0x1A95c3863b28917b463FB2EBcE49F8Aba3b20f80');

console.log("contract.setBounty.call(\"0xf1E8ACC0E973670599327c4105CB3587B8582a86\", {from: eth.accounts[0]});");
console.log("contract.setPauseMaster.call(\"0x66Ed34D11380107724944602B2D8C246e9113fBD\", {from: eth.accounts[0]});");
console.log("contract.setUpgradeMaster.call(\"0xbe5d1Cf484cb611b4feB96CDE6926Bbce75C6804\", {from: eth.accounts[0]});");
console.log("contract.transferOwnership.call(\"0xf90bfC49e3FA519b28Fcb55141Be23429cA196CE\", {from: eth.accounts[0]});");
