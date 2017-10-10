require('babel-register');
require('babel-polyfill');

module.exports = {
    networks: {

        development: {
            host: "localhost",
            port: 8545,
            network_id: "*"
        },

        /*
            settings assume the node runs as follow:
            $ geth --fast --cache=1048 --testnet --unlock "0xmyaddress" \
                --rpc --rpcapi "eth,net,web3" --rpccorsdomain '*' --rpcaddr localhost --rpcport 8546
        */
        ropsten: {
            host: "localhost",
            port: 8546,
            network_id: "3"
        }

    },

    gasPrice: 100e9,

    mocha: {
        useColors: false,
        slow: 30000,
        // bail: true,
        grep: "CtdTokenMock",
        invert: true
    },

    version: "0.0.2",
    package_name: "ctd-ico",
    description: "Smart-contracts for Cointed Token and Token Sale",
    license: "MIT"
};
