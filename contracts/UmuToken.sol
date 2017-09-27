pragma solidity 0.4.15;

import './lib/zeppelin-solidity/math/SafeMath.sol';
import './lib/zeppelin-solidity/ownership/Ownable.sol';
import './lib/zeppelin-solidity/token/StandardToken.sol';

contract UmuToken is StandardToken, Ownable {

  using SafeMath for uint256;

  event NewTokens(address indexed to, uint256 amount);  // FIXME: consider if 'to' shall be indexed
  event Opened();
  event Bonused();
  event Shifted();
  event Closed(uint64 time);
  event Released();

  string public constant symbol = "UMU";
  string public constant name = "UMU Token";
  uint8 public constant decimals = 18;

  // 1 Mio UMU x10^18 units
  uint256 internal constant totalLimit = 1000000 * (10 ** uint256(decimals));

  // 1 ETH = 1 x10^18 Wei = 1000 UMU = 1000 x10^18 units
  uint32 internal constant RATE = 1000;
  // Phase One premium rate
  uint32 internal constant PREMIUM_RATE = 1150;
  // Phase Bonus: bonus rate
  uint32 internal constant BONUS_RATE = 1100;

  // seconds since unix epoch when the Phase One gets started
  uint64 internal openingTime;
  // seconds since unix epoch when the Phase Two gets started
  uint64 internal shiftTime;
  // seconds since unix epoch when the Phase Two gets finished
  uint64 internal closingTime;
  // period in seconds when token transfers are not yet allowed
  uint64 internal freezePeriod;

  bool internal phaseOne = false;
  bool internal phaseBonus = false;
  bool internal phaseTwo = false;
  bool internal closed = false;
  bool internal frozen = true;

  // fallback function allows sending ETH to token address directly
  function () payable external {
    createTokens();
    // FIXME: check gas usage
  }

  function UmuToken(uint64 _openingTime, uint64 _shiftTime, uint64 _closingTime, uint64 _freezePeriod) onlyOwner {
    owner = msg.sender;
    openingTime = _openingTime;
    shiftTime = _shiftTime;
    closingTime = _closingTime;
    freezePeriod = _freezePeriod;
    // FIXME: add creation of Bounty tokens
  }


  function open() whenNotOpened public returns (bool) {
    require(now >= openingTime);

    phaseOne = true;
    Opened();
    // FIXME: shall the msg.sender be awarded with some bounty tokens?
    return true;
  }

  function shift() whenPhaseOne whenIcoActive public returns (bool) {
    require(now >= shiftTime);

    phaseOne = false;
    // TODO: if ( now < shiftTime )
    //         phaseBonus = true;
    //         Bonused();
    //       else
    phaseTwo = true;
    Shifted();
    // FIXME: shall the msg.sender be awarded with some bounty tokens?
    return true;
  }

  function close() whenIcoActive public returns (bool) {
    require( (now >= shiftTime) || (totalSupply >= totalLimit) );

    phaseOne = false;
    phaseTwo = false;
    closed = true;
    closingTime = uint64(now);
    Closed(closingTime);
    // FIXME: shall the msg.sender be awarded with some bounty tokens?
    return true;
  }

  function release() public returns (bool) {
    require(closed && frozen);
    require(now >= closingTime + freezePeriod);

    frozen = false;
    Released();
    // FIXME: shall the msg.sender be awarded with some bounty tokens?
    return true;
  }

  function createTokens() payable whenIcoActive public returns (bool) {
    require(msg.value > 0);
    require(totalSupply + msg.value <= totalLimit);

    uint256 rate;
    if (phaseOne) {
      rate = uint256(PREMIUM_RATE);
    } else {
      rate = uint256(RATE);
    }
    uint256 tokens = rate.mul(msg.value);

    totalSupply = totalSupply.add(tokens);
    balances[msg.sender] = balances[msg.sender].add(tokens);
    owner.transfer(msg.value);
    NewTokens(msg.sender, tokens);
    Transfer(msg.sender, 0x0, msg.value);     // FIXME: check if inherited event suits ('from' is indexed)
    return true;
  }

  function transfer(address _to, uint256 _value) public whenNotFrozen returns (bool) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public whenNotFrozen returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  function approve(address _spender, uint256 _value) public whenNotFrozen returns (bool) {
    return super.approve(_spender, _value);
  }

  function increaseApproval(address _spender, uint _addedValue) public whenNotFrozen returns (bool success) {
    return super.increaseApproval(_spender, _addedValue);
  }

  function decreaseApproval(address _spender, uint _subtractedValue) public whenNotFrozen returns (bool success) {
    return super.decreaseApproval(_spender, _subtractedValue);
  }

  modifier whenNotOpened() {
    require(!closed && !phaseOne && !phaseTwo);
    _;
  }

  modifier whenPhaseOne() {
    require(phaseOne && !phaseBonus && !phaseTwo);
    _;
  }

  modifier whenPhaseBonus() {
    require(phaseBonus && !phaseOne && !phaseTwo);
    _;
  }

  modifier whenPhaseTwo() {
    require(phaseTwo && !phaseOne && !phaseBonus);
    _;
  }

  modifier whenIcoActive() {
    require( (phaseOne || phaseTwo) && !closed );
    _;
  }

  modifier whenNotFrozen() {
    require(!frozen);
    _;
  }

}
