module.exports = function(deployer) {
  "use strict";

  const UmuToken = artifacts.require('./UmuToken.sol');
  const unixTimeNow = parseInt(new Date() / 1000);

  const threeMinutes = 180;
  const preIcoOpeningTime = unixTimeNow + threeMinutes;
  const icoOpeningTime = preIcoOpeningTime + threeMinutes;
  const closingTime = icoOpeningTime + threeMinutes;

  deployer.deploy(UmuToken, preIcoOpeningTime, icoOpeningTime, closingTime);
};
