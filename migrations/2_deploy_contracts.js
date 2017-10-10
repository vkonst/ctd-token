/*global module*/
module.exports = function(deployer, network) {
    "use strict";

    console.warn('2_deploy_contract.js called');

    if (network = "ropsten") {

        const timeNow = parseInt(new Date() / 1000);
        const twoDays = 48 * 3600;
        const preIcoOpeningTime = timeNow + twoDays;

        const CtdToken = artifacts.require('./CtdToken.sol');
        console.warn("*** CtdToken    .binary.length :" + CtdToken.binary.length);
        deployer.deploy(CtdToken, preIcoOpeningTime);

    } else {

        // const timeNow = parseInt(new Date() / 1000);
        // const threeMinutes = 180;
        // const preIcoOpeningTime = timeNow + threeMinutes;

        // const CtdToken = artifacts.require('./CtdToken.sol');
        // console.warn("*** CtdToken    .binary.length :" + CtdToken.binary.length);
        // deployer.deploy(CtdToken, preIcoOpeningTime);

        // const CtdTokenMock = artifacts.require('../test/helpers/CtdTokenMock.sol');
        // console.warn("*** CtdTokenMock.binary.length :" + CtdTokenMock.binary.length);
        // deployer.deploy(CtdTokenMock, preIcoOpeningTime);

    }

};
