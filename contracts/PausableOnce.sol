pragma solidity 0.4.15;

import './lib/zeppelin-solidity/ownership/Ownable.sol';


/**
 * @title PausableOnce
 * @dev The PausableOnce contract provides an option for the "pauseMaster"
 * to pause once the transactions for two weeks.
 *
 */

contract PausableOnce is Ownable {

    /** Address that can start the pause */
    address public pauseMaster;

    uint constant internal FOURTEEN_DAYS = 3600 * 24 * 14;
    uint public pauseEnd = 0;

    event Paused();

    /**
     * @dev Set the pauseMaster (callable by the owner only).
     * @param _pauseMaster The address of the pauseMaster
     */
    function setPauseMaster(address _pauseMaster) onlyOwner external returns (bool) {
        require(_pauseMaster != address(0));
        pauseMaster = _pauseMaster;
        return true;
    }

    /**
     * @dev Start the pause (by the pauseMaster, ONCE only).
     */
    function pause() onlyPauseMaster external returns (bool) {
        require(pauseEnd != 0);
        pauseEnd = now + FOURTEEN_DAYS;
        Paused();
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(now > pauseEnd);
        _;
    }

    /**
     * @dev Throws if called by any account other than the pauseMaster.
    */
    modifier onlyPauseMaster() {
        require(msg.sender == pauseMaster);
        _;
    }

}
