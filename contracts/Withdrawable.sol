pragma solidity ^0.4.0;


contract Withdrawable {

    mapping (address => uint) pendingWithdrawals;

    event Withdrawal(address indexed drawer, uint256 weiAmount);
    event Withdraw(address indexed drawer, uint256 weiAmount);

    function withdrawal(address drawer, uint256 weiAmount) internal {
        if ((drawer != address(0)) && (weiAmount > 0)) {
            uint256 oldBalance = pendingWithdrawals[drawer];
            uint256 newBalance = oldBalance + weiAmount;
            if (newBalance > oldBalance) {
                pendingWithdrawals[drawer] = newBalance;
                Withdrawal(drawer, weiAmount);
            }
        }
    }

    function withdraw() public returns (bool) {
        uint256 weiAmount = pendingWithdrawals[msg.sender];
        require(weiAmount > 0);

        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(weiAmount);
        Withdraw(msg.sender, weiAmount);
        return true;
    }

}
