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
        },

        /*
            settings assume the TCP port 8549 on the host running 'truffle' is forwarded via ssh
            to the host running the Ethereum node (client) with the RPC port 8545:
            localUser@nodeHost:~$ ssh remoteUser@truffleRunningHost -L 8049:localhost:8545
        */
        main: {
            host: "localhost",
            port: 8549,
            network_id: "1"
        }

    },

    // gasPrice: 100e9,

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
