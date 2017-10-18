pragma solidity 0.4.15;


/**
 * @title Withdrawable
 * @dev The Withdrawable contract provides a mechanism of withdrawal(s).
 * "Withdrawals" are permissions for specified addresses to pull (withdraw) payments from the contract balance.
 */

contract Withdrawable {

    mapping (address => uint) pendingWithdrawals;

    /*
     * @dev Logged upon a granted allowance to the specified drawer on withdrawal.
     * @param drawer The address of the drawer.
     * @param weiAmount The value in Wei which may be withdrawn.
     */
    event Withdrawal(address indexed drawer, uint256 weiAmount);

    /*
     * @dev Logged upon a withdrawn value.
     * @param drawer The address of the drawer.
     * @param weiAmount The value in Wei which has been withdrawn.
     */
    event Withdrawn(address indexed drawer, uint256 weiAmount);

    /*
     * @dev Allow the specified drawer to withdraw the specified value from the contract balance.
     * @param drawer The address of the drawer.
     * @param weiAmount The value in Wei allowed to withdraw.
     * @return success
     */
    function withdrawal(address drawer, uint256 weiAmount) internal returns (bool success) {
        if ((drawer != address(0)) && (weiAmount > 0)) {
            uint256 oldBalance = pendingWithdrawals[drawer];
            uint256 newBalance = oldBalance + weiAmount;
            if (newBalance > oldBalance) {
                pendingWithdrawals[drawer] = newBalance;
                Withdrawal(drawer, weiAmount);
                return true;
            }
        }
        return false;
    }

    /*
     * @dev Withdraw the allowed value from the contract balance.
     * @return success
     */
    function withdraw() public returns (bool success) {
        uint256 weiAmount = pendingWithdrawals[msg.sender];
        require(weiAmount > 0);

        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(weiAmount);
        Withdrawn(msg.sender, weiAmount);
        return true;
    }

}
