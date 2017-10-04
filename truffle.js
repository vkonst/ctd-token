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
  mocha: {
      useColors: true,
      slow: 30000,
      bail: true,
      grep: "UmuTokenMock", // "test",
      invert: true
  }
};
