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

    uint constant internal PAUSE_DURATION = 14 days;
    uint64 public pauseEnd = 0;

    event Paused();

    /**
     * @dev Set the pauseMaster (callable by the owner only).
     * @param _pauseMaster The address of the pauseMaster
     */
    function setPauseMaster(address _pauseMaster) onlyOwner external returns (bool success) {
        require(_pauseMaster != address(0));
        pauseMaster = _pauseMaster;
        return true;
    }

    /**
     * @dev Start the pause (by the pauseMaster, ONCE only).
     */
    function pause() onlyPauseMaster external returns (bool success) {
        require(pauseEnd == 0);
        pauseEnd = uint64(now + PAUSE_DURATION);
        Paused();
        return true;
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
