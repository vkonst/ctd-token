module.exports = function(deployer) {
  'use strict';

  const Migrations = artifacts.require("./lib/truffle/Migrations");
  deployer.deploy(Migrations);
};
