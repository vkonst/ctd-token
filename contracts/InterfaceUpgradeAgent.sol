pragma solidity ^0.4.0;


/**
* @title Upgrade agent interface
*/
contract InterfaceUpgradeAgent {

    uint32 public revision;
    uint256 public originalSupply;

    /**
     * @dev Reissue the tokens onto the new contract revision.
     * @param holder Holder (owner) of the tokens
     * @param tokenQty How many tokens to be issued
     */
    function upgradeFrom(address holder, uint256 tokenQty) public;
}
