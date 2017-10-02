module.exports = function(deployer) {
    'use strict';

    console.warn('1_initial_migration.js called');

    const Migrations = artifacts.require("./lib/truffle/Migrations");
    deployer.deploy(Migrations);
};
