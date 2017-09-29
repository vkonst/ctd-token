pragma solidity 0.4.15;

import './lib/zeppelin-solidity/math/SafeMath.sol';
import './lib/zeppelin-solidity/ownership/Ownable.sol';
import './lib/zeppelin-solidity/token/StandardToken.sol';
import './InterfaceUpgradeAgent.sol';


contract UpgradableToken is StandardToken, Ownable {

    using SafeMath for uint256;

    uint32 public REVISION;

    /** Address that can set the upgrade agent thus enabling the upgrade. */
    address public upgradeMaster = address(0);

    /** Address of the contract that issues the new revision tokens. */
    address public upgradeAgent = address(0);

    /** How many tokens are upgraded. */
    uint256 public totalUpgraded;

    event Upgrade(address indexed _from, uint256 _value);
    event UpgradeEnabled(address agent);

    /**
     * @dev Set the upgrade master.
     * parameter _upgradeMaster Upgrade master
     */
    function setUpgradeMaster(address _upgradeMaster) onlyOwner public {
        require(_upgradeMaster != address(0));
        upgradeMaster = _upgradeMaster;
    }

    /**
     * @dev Set the upgrade agent (once only) thus enabling the upgrade.
     * @param _upgradeAgent Upgrade agent contract address
     * @param _revision Unique ID that agent contract must return on ".revision()"
     */
    function setUpgradeAgent(address _upgradeAgent, uint32 _revision)
        onlyUpgradeMaster whenUpgradeDisabled external
    {
        require((_upgradeAgent != address(0)) && (_revision != 0));

        InterfaceUpgradeAgent agent = InterfaceUpgradeAgent(_upgradeAgent);

        require(agent.revision() == _revision);
        require(agent.originalSupply() == totalSupply);

        upgradeAgent = _upgradeAgent;
        UpgradeEnabled(_upgradeAgent);
    }

    /**
     * @dev Upgrade tokens to the new revision.
     * @param value How many tokens to be upgraded
     */
    function upgrade(uint256 value) whenUpgradeEnabled public {
        require(value > 0);

        uint256 balance = balances[msg.sender];
        assert(balance > 0);

        // Take tokens out from the old contract
        balances[msg.sender] = balance.sub(value);
        totalSupply = totalSupply.sub(value);
        totalUpgraded = totalUpgraded.add(value);
        // Issue the new revision tokens
        InterfaceUpgradeAgent agent = InterfaceUpgradeAgent(upgradeAgent);
        agent.upgradeFrom(msg.sender, value);

        Upgrade(msg.sender, value);
    }

    /**
    * @dev Modifier to make a function callable only when the upgrade is enabled.
    */
    modifier whenUpgradeEnabled() {
        require(upgradeAgent != address(0));
        _;
    }

    /**
    * @dev Modifier to make a function callable only when the upgrade is impossible.
    */
    modifier whenUpgradeDisabled() {
        require(upgradeAgent == address(0));
        _;
    }

    /**
    * @dev Throws if called by any account other than the upgradeMaster.
    */
    modifier onlyUpgradeMaster() {
        require(msg.sender == upgradeMaster);
        _;
    }

}
