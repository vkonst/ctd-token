module.exports = function(deployer) {
  "use strict";

  const UmuToken = artifacts.require('./UmuToken.sol');
  const unixTimeNow = parseInt(new Date() / 1000);

  const threeMinutes = 180;
  const openingTime = unixTimeNow + threeMinutes;
  const shiftTime = openingTime + threeMinutes;
  const closingTime = shiftTime + threeMinutes;
  const freezePeriod = threeMinutes;

  deployer.deploy(UmuToken, openingTime, shiftTime, closingTime, freezePeriod);
};
