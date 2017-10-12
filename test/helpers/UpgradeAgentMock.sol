pragma solidity ^0.4.0;

import '../../contracts/InterfaceUpgradeAgent.sol';
import '../../contracts/lib/zeppelin-solidity/math/SafeMath.sol';

contract UpgradeAgentMock is InterfaceUpgradeAgent {

    using SafeMath for uint256;

    mapping(address => uint256) balances;

    function UpgradeAgentMock(uint32 _revision, uint256 _supply) public {
        revision = _revision;
        originalSupply = _supply;
    }

    function upgradeFrom(address holder, uint256 tokenQty) public {
        balances[holder] = balances[holder].add(tokenQty);
    }

    function balanceOf(address who) public constant returns (uint256) {
        return balances[who];
    }

}
