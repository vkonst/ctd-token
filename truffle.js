require('babel-register');
require('babel-polyfill');

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
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
