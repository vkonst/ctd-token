pragma solidity 0.4.15;

import '../../contracts/CtdToken.sol';


contract CtdTokenMock is CtdToken {

    function CtdTokenMock(uint64 _preIcoOpeningTime) payable CtdToken(_preIcoOpeningTime) { }

    function getBalance() public constant returns (uint256 weiAmount) {
        return this.balance;
    }

    function getBalanceAt(address addr) public constant returns (uint256 weiAmount) {
        return addr.balance;
    }

    function simulateNewTokens(address _to, uint256 tokens) public returns (bool) {
        totalSupply = totalSupply.add(tokens);
        balances[_to] = balances[_to].add(tokens);
    }

    function getTokenBalanceOf(address _owner) public constant returns (uint256 tokens) {
        return balances[_owner];
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
