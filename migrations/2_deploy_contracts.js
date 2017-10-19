/*global module*/
module.exports = function(deployer, network) {
    "use strict";

    console.warn('2_deploy_contract.js called');

    const CtdToken = artifacts.require('./CtdToken.sol');
    console.warn("*** CtdToken    .binary.length :" + CtdToken.binary.length);

    const pointNineEther = 9e+17;

    let preIcoOpeningTime;

    if ((network === "main") || (network === "ropsten")) {
        const Oct19thMidnightCest = 1508450400;
        preIcoOpeningTime = Oct19thMidnightCest;

    } else if (network === "development") {
        const timeNow = parseInt(new Date() / 1000);
        const threeMinutes = 180;
        preIcoOpeningTime = timeNow + threeMinutes;
    }

    deployer.deploy(CtdToken, preIcoOpeningTime, {value: pointNineEther, gas: 2600000});
};
