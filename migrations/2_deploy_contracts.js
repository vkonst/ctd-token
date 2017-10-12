/*global module*/
module.exports = function(deployer, network) {
    "use strict";

    console.warn('2_deploy_contract.js called');

    const CtdToken = artifacts.require('./CtdToken.sol');
    console.warn("*** CtdToken    .binary.length :" + CtdToken.binary.length);

    const timeNow = parseInt(new Date() / 1000);
    let preIcoOpeningTime;

    if (network = "ropsten") {
        const twoDays = 48 * 3600;
        preIcoOpeningTime = timeNow + twoDays;

    } else if (network = "development") {
        const threeMinutes = 180;
        preIcoOpeningTime = timeNow + threeMinutes;
    }

    deployer.deploy(CtdToken, preIcoOpeningTime);
};
