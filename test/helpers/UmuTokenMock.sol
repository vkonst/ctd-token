pragma solidity 0.4.15;

import '../../contracts/UmuToken.sol';


contract UmuTokenMock is UmuToken {

    function UmuTokenMock(uint64 _preIcoOpeningTime) payable UmuToken (_preIcoOpeningTime) { }

    function getBalance() public constant returns (uint256 weiAmount) {
        return this.balance;
    }

    function getBalanceAt(address addr) public constant returns (uint256 weiAmount) {
        return addr.balance;
    }

    function testModifierOnlyOwner() onlyOwner public constant returns (bool) {
        return true;
    }

    function testModifierWhenNotPaused() whenNotPaused constant public returns(bool) {
        return true;
    }

    function testFnWithdrawal(address drawer, uint256 weiAmount) public returns (bool success) {
        return withdrawal(drawer, weiAmount);
    }

    function testPendingWithdrawalAmount() public constant returns (uint256 weiAmount) {
        return(pendingWithdrawals[msg.sender]);
    }

}
