pragma solidity 0.4.15;

import '../../contracts/UmuToken.sol';


contract UmuTokenMock is UmuToken {

    function UmuTokenMock(uint64 _preIcoOpeningTime) UmuToken (_preIcoOpeningTime) { }

    function testModifierOnlyOwner() onlyOwner public returns (bool) {
        return true;
    }

    function testModifierWhenNotPaused() whenNotPaused public returns(bool) {
        return true;
    }

    function testFnWithdrawal(address drawer, uint256 weiAmount) public returns (bool success) {
        return withdrawal(drawer, weiAmount);
    }

    function testPendingWithdrawalAmount() public returns (uint256 weiAmount) {
        return(pendingWithdrawals[msg.sender]);
    }

}
