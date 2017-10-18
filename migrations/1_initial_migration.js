module.exports = function(deployer, network) {
    'use strict';

    console.warn('1_initial_migration.js called');

    if (network !== "main") {
        const Migrations = artifacts.require("./lib/truffle/Migrations");
        deployer.deploy(Migrations);
    }

};
