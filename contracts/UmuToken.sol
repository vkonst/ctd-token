pragma solidity 0.4.15;

import './lib/zeppelin-solidity/math/SafeMath.sol';
import './lib/zeppelin-solidity/ownership/Ownable.sol';
import './lib/zeppelin-solidity/token/StandardToken.sol';


contract UmuToken is StandardToken, Ownable {

    using SafeMath for uint256;

    string public constant name = "UMU Token";
    string public constant symbol = "UMU";
    // 1 UMU = 1x10^decimals Atom(s)
    uint8  public constant decimals = 18;

    // Holder of bounty tokens
    address public bounty;

    mapping (address => uint) pendingWithdrawals;

    // Limit on Atom(s) issued, inclusive owner's and bounty shares
    uint256 constant internal TOTAL_LIMIT = 496000000 * (10 ** uint256(decimals));
    // ... of which, limit for pre-ICO Phase A
    uint256 constant internal PRE_ICO_LIMIT = 99200000 * (10 ** uint256(decimals));

    /**
   * ICO Phases.
   *
   * - PreStart: tokens are not yet sold/issued
   * - PreIcoA:  new tokens sold/issued at the premium price
   * - PreIcoB:  new tokens sold/issued at the discounted price
   * - MainIco   new tokens sold/issued at the regular price
   * - AfterIco: new tokens can not be not be sold/issued any longer
   */
    enum Phases {PreStart, PreIcoA, PreIcoB, MainIco, AfterIco}

    // Main ICO rate in UMU(s) per 1 ETH:
    uint32 constant internal TO_SENDER_RATE   = 1000;
    uint32 constant internal TO_OWNER_RATE    =  200;
    uint32 constant internal TO_BOUNTY_RATE   =   40;
    // Pre-ICO Phase A rate
    uint32 constant internal TO_SENDER_RATE_A = 1150;
    uint32 constant internal TO_OWNER_RATE_A  =  230;
    uint32 constant internal TO_BOUNTY_RATE_A =   46;
    // Pre-ICO Phase B rate
    uint32 constant internal TO_SENDER_RATE_B = 1100;
    uint32 constant internal TO_OWNER_RATE_B  =  220;
    uint32 constant internal TO_BOUNTY_RATE_B =   44;

    // Award in Wei(s) to a successful initiator of a phase shift
    uint256 constant internal PRE_OPENING_AWARD = 100 * (10 ** uint256(15));
    uint256 constant internal ICO_OPENING_AWARD = 200 * (10 ** uint256(15));
    uint256 constant internal ICO_CLOSING_AWARD = 500 * (10 ** uint256(15));

    struct Tokens {
        uint256 forSender;
        uint256 forOwner;
        uint256 forBounty;
        uint256 total;
        uint256 newTotalSupply;
    }

    struct Rates {
        uint32 toSender;
        uint32 toOwner;
        uint32 toBounty;
        uint32 total;
    }

    event NewTokens(uint256 amount);
    event Shifted(Phases phase);

    Phases internal phase;                // current Phase

    // Timestamps in seconds since Unix epoch:
    uint64 internal preIcoOpeningTime;    // when Pre-ICO Phase A starts
    uint64 internal icoOpeningTime;       // when Main ICO starts (if not sold out before)
    uint64 internal closingTime;          // by when the ICO campaign finishes in any way

    // msg.value MUST be at least the sum of AWARD(s)
    function UmuToken(
        uint64 _preIcoOpeningTime,
        uint64 _icoOpeningTime,
        uint64 _closingTime
    ) onlyOwner
    {
        owner = msg.sender;
        preIcoOpeningTime = _preIcoOpeningTime;
        icoOpeningTime = _icoOpeningTime;
        closingTime = _closingTime;
    }

    // fallback function allows sending ETH to token address directly
    function () payable external {
        create();
        // FIXME: check gas limit
    }

    function setBounty(address _bounty) onlyOwner whenNotOpened returns (bool) {
        require(_bounty != address(0));
        bounty = _bounty;
        return true;
    }

    function create() payable whenIcoActive public returns (bool) {
        require(msg.value > 0);

        uint256 weis = msg.value;
        Phases expectedPhase = phase;

        uint256 extraWeis = 0;
        uint256 extraTokens = 0;
        uint256 shiftAward = 0;

        Rates memory rates = getRates();
        Tokens memory tokens = getTokens(msg.value, rates);

        if (tokens.newTotalSupply >= TOTAL_LIMIT) {
            extraTokens = tokens.newTotalSupply.sub(TOTAL_LIMIT);
            expectedPhase = Phases.AfterIco;
            shiftAward = ICO_CLOSING_AWARD;

        } else if ((phase == Phases.PreIcoA) && (tokens.newTotalSupply >= PRE_ICO_LIMIT)) {
            extraTokens = tokens.newTotalSupply.sub(PRE_ICO_LIMIT);
            expectedPhase = (now >= icoOpeningTime) ? Phases.PreIcoB : Phases.AfterIco;
            shiftAward = (now >= icoOpeningTime) ? ICO_OPENING_AWARD : ICO_CLOSING_AWARD;
        }

        if (extraTokens > 0) {
            extraWeis = extraTokens.div(rates.total);
            weis = msg.value.sub(extraWeis);
            tokens = getTokens(weis, rates);
        }

        totalSupply = tokens.newTotalSupply;
        balances[msg.sender] = balances[msg.sender].add(tokens.forSender);
        balances[owner] = balances[owner].add(tokens.forOwner);
        balances[bounty] = balances[bounty].add(tokens.forBounty);

        if (extraWeis > 0) {
            pendingWithdrawals[msg.sender] = pendingWithdrawals[msg.sender].add(extraWeis);
        }
        owner.transfer(weis);
        NewTokens(tokens.total);
        if (expectedPhase != phase) {
            shiftTo(expectedPhase, shiftAward);
        }
        return true;
    }

    function getTokens(uint256 weis, Rates rates) internal returns (Tokens tokens) {
        tokens.forSender = weis.mul(uint256(rates.toSender));
        tokens.forOwner = weis.mul(uint256(rates.toOwner));
        tokens.forBounty = weis.mul(uint256(rates.toBounty));
        tokens.total = tokens.forSender.add(tokens.forOwner).add(tokens.forBounty);
        tokens.newTotalSupply = totalSupply.add(tokens.total);
        return(tokens);
    }

    function getRates() internal returns (Rates rates) {
        if (phase == Phases.PreIcoA) {
            rates.toSender = TO_SENDER_RATE_A;
            rates.toOwner = TO_OWNER_RATE_A;
            rates.toBounty = TO_BOUNTY_RATE_A;
            rates.total = TO_SENDER_RATE_A + TO_OWNER_RATE_A + TO_BOUNTY_RATE_A;
        } else if (phase == Phases.PreIcoB) {
            rates.toSender = TO_SENDER_RATE_B;
            rates.toOwner = TO_OWNER_RATE_B;
            rates.toBounty = TO_BOUNTY_RATE_B;
            rates.total = TO_SENDER_RATE_B + TO_OWNER_RATE_B + TO_BOUNTY_RATE_B;
        } else {
            rates.toSender = TO_SENDER_RATE;
            rates.toOwner = TO_OWNER_RATE;
            rates.toBounty = TO_BOUNTY_RATE;
            rates.total = TO_SENDER_RATE + TO_OWNER_RATE + TO_BOUNTY_RATE;
        }
        return rates;
    }

    function openPreIco() whenNotOpened public returns (bool) {
        require(now >= preIcoOpeningTime);
        shiftTo(Phases.PreIcoA, ICO_OPENING_AWARD);
        return true;
    }

    function openMainIco() whenPreIco public returns (bool) {
        require((now >= icoOpeningTime) && (totalSupply < TOTAL_LIMIT));
        shiftTo(Phases.MainIco, ICO_OPENING_AWARD);
        return true;
    }

    function closeIco() whenIcoActive public returns (bool) {
        require((now >= closingTime) || (totalSupply >= TOTAL_LIMIT));
        shiftTo(Phases.AfterIco, ICO_CLOSING_AWARD);
        return true;
    }

    function shiftTo(Phases _phase, uint256 award) internal {
        phase = _phase;
        pendingWithdrawals[msg.sender] = pendingWithdrawals[msg.sender].add(award);
        Shifted(phase);
    }

    function withdraw() public returns (bool) {
        uint amount = pendingWithdrawals[msg.sender];
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amount);
        return true;
    }

    function returnWeis() onlyOwner whenClosed {
        owner.transfer(this.balance);
    }

    function transfer(address _to, uint256 _value) public limitForOwner returns (bool) {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public limitForOwner returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public limitForOwner returns (bool) {
        return super.approve(_spender, _value);
    }

    function increaseApproval(address _spender, uint _addedValue) public limitForOwner returns (bool success) {
        return super.increaseApproval(_spender, _addedValue);
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public limitForOwner returns (bool success) {
        return super.decreaseApproval(_spender, _subtractedValue);
    }

    modifier whenNotOpened() {
        require(phase == Phases.PreStart);
        _;
    }

    modifier whenClosed() {
        require(phase >= Phases.AfterIco);
        _;
    }

    modifier whenPreIco() {
        require((phase == Phases.PreIcoA) || (phase == Phases.PreIcoB));
        _;
    }

    modifier whenPreIcoA() {
        require(phase == Phases.PreIcoA);
        _;
    }

    modifier whenPreIcoB() {
        require(phase == Phases.PreIcoB);
        _;
    }

    modifier whenMainIco() {
        require(phase == Phases.MainIco);
        _;
    }

    modifier whenIcoActive() {
        require((phase == Phases.PreIcoA) || (phase == Phases.PreIcoB) || (phase == Phases.MainIco));
        _;
    }

    modifier limitForOwner() {
        require((msg.sender != owner) || (phase == Phases.AfterIco));
        _;
    }

}
