module.exports = function(deployer) {
  "use strict";

  const UmuToken = artifacts.require('./UmuToken.sol');
  const timeNow = parseInt(new Date() / 1000);

  const threeMinutes = 180;
  const preIcoOpeningTime = timeNow + threeMinutes;

  deployer.deploy(UmuToken, preIcoOpeningTime);
};
