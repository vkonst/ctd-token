pragma solidity 0.4.15;

import './lib/zeppelin-solidity/math/SafeMath.sol';
import './PausableOnce.sol';
import './UpgradableToken.sol';


contract UmuToken is UpgradableToken, PausableOnce {

    using SafeMath for uint256;

    string public constant name = "UMU Token";
    string public constant symbol = "UMU";
    /** Number of "Atom" in 1 UMU (1 UMU = 1x10^decimals Atom) */
    uint8  public constant decimals = 18;

    /** Holder of bounty tokens */
    address public bounty;

    mapping (address => uint) pendingWithdrawals;

    /** Limit (in Atom) issued, inclusive owner's and bounty shares */
    uint256 constant internal TOTAL_LIMIT = 496000000 * (10 ** uint256(decimals));
    /** Limit (in Atom) for Pre-ICO Phases A, incl. owner's and bounty shares */
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

    // Award in Wei(s) to a successful initiator of a Phase shift
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

    struct Adjustments {
        Phases newPhase;
        uint256 shiftAward;
        uint256 overSoldTokens;
    }

    event NewTokens(uint256 amount);
    event Shifted(Phases phase);

    // current Phase
    Phases internal phase = Phases.PreStart;

    // Timestamps limiting duration of Phases, in seconds since Unix epoch.
    // Leave at least 900 (seconds) between the stamps.
    //
    uint64 internal preIcoOpeningTime;  // when Pre-ICO Phase A starts
    uint64 internal icoOpeningTime;     // when Main ICO starts (if not sold out before)
    uint64 internal closingTime;        // by when the ICO campaign finishes in any way


    function UmuToken(
        uint64 _preIcoOpeningTime,
        uint64 _icoOpeningTime,
        uint64 _closingTime
        // msg.value MUST be at least the sum of AWARD(s)
    ) onlyOwner
    {
        require(_preIcoOpeningTime > now);
        require(_icoOpeningTime >= preIcoOpeningTime);
        require(_closingTime > icoOpeningTime);

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

    function setBounty(address _bounty) onlyOwner whenNotOpened public returns (bool) {

        require(_bounty != address(0));
        bounty = _bounty;
        return true;
    }

    function create() payable whenIcoActive whenNotPaused public returns (bool) {

        require(msg.value > 0);

        Phases oldPhase = phase;
        uint256 adjustedValue = msg.value;
        uint256 overPaidValue = 0;

        Adjustments memory adjusted = adjustBasedOnTime();
        Rates memory rates = getRates();
        Tokens memory tokens = computeTokens(msg.value, rates);
        adjusted = adjustBasedOnQty(tokens.newTotalSupply, adjusted);

        if (adjusted.overSoldTokens > 0) {
            overPaidValue = adjusted.overSoldTokens.div(rates.total);
            adjustedValue = msg.value.sub(overPaidValue);
            tokens = computeTokens(adjustedValue, rates);
        }

        // new tokens "emission"
        totalSupply = tokens.newTotalSupply;
        balances[msg.sender] = balances[msg.sender].add(tokens.forSender);
        balances[owner] = balances[owner].add(tokens.forOwner);
        balances[bounty] = balances[bounty].add(tokens.forBounty);

        // ETH transfers
        if (overPaidValue > 0) {
            pendingWithdrawals[msg.sender] = pendingWithdrawals[msg.sender].add(overPaidValue);
            owner.transfer(adjustedValue);
        } else {
            owner.transfer(msg.value);
        }

        // Event emitting
        NewTokens(tokens.total);
        if (adjusted.newPhase != oldPhase) {
            shiftTo(adjusted.newPhase, adjusted.shiftAward);
        }

        return true;
    }

    function withdraw() public returns (bool) {
        uint amount = pendingWithdrawals[msg.sender];
        require(amount > 0);

        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amount);
        return true;
    }

    function returnWeis() onlyOwner whenClosed public {
        owner.transfer(this.balance);
    }

    function adjustBasedOnTime() internal returns (Adjustments adjusted) {

        adjusted.shiftAward = 0;
        adjusted.overSoldTokens = 0;

        if ((now >= closingTime) && (phase != Phases.AfterIco)) {
            phase = Phases.AfterIco;
            adjusted.shiftAward = ICO_CLOSING_AWARD;

        } else if ((now >= icoOpeningTime) &&
        ((phase == Phases.PreIcoA) || (phase == Phases.PreIcoB))) {
            phase = Phases.MainIco;
            adjusted.shiftAward = ICO_OPENING_AWARD;

        } else if ((now >= preIcoOpeningTime) && (phase == Phases.PreStart)) {
            phase = Phases.PreIcoA;
            adjusted.shiftAward = PRE_OPENING_AWARD;
        }

        adjusted.newPhase = phase;
        return adjusted;
    }

    function adjustBasedOnQty(uint256 newTotalSupply, Adjustments adjusted) internal returns (Adjustments) {

        if (newTotalSupply >= TOTAL_LIMIT) {
            adjusted.overSoldTokens = newTotalSupply.sub(TOTAL_LIMIT);
            adjusted.newPhase = Phases.AfterIco;
            adjusted.shiftAward = ICO_CLOSING_AWARD;

        } else if ((phase == Phases.PreIcoA) && (newTotalSupply >= PRE_ICO_LIMIT)) {
            adjusted.overSoldTokens = newTotalSupply.sub(PRE_ICO_LIMIT);
            adjusted.newPhase = (now >= icoOpeningTime) ? Phases.PreIcoB : Phases.AfterIco;
            adjusted.shiftAward = (now >= icoOpeningTime) ? ICO_OPENING_AWARD : ICO_CLOSING_AWARD;
        }

        return adjusted;
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

    function computeTokens(uint256 weis, Rates rates) internal returns (Tokens tokens) {

        tokens.forSender = weis.mul(uint256(rates.toSender));
        tokens.forOwner = weis.mul(uint256(rates.toOwner));
        tokens.forBounty = weis.mul(uint256(rates.toBounty));
        tokens.total = tokens.forSender.add(tokens.forOwner).add(tokens.forBounty);
        tokens.newTotalSupply = totalSupply.add(tokens.total);
        return(tokens);
    }

    function shiftTo(Phases _phase, uint256 award) internal {
        phase = _phase;
        pendingWithdrawals[msg.sender] = pendingWithdrawals[msg.sender].add(award);
        Shifted(phase);
    }

    function transfer(address _to, uint256 _value)
        whenNotPaused limitForOwner public returns (bool)
    {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value)
        whenNotPaused limitForOwner public returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value)
        whenNotPaused limitForOwner public returns (bool)
    {
        return super.approve(_spender, _value);
    }

    function increaseApproval(address _spender, uint _addedValue)
        whenNotPaused limitForOwner public returns (bool success)
    {
        return super.increaseApproval(_spender, _addedValue);
    }

    function decreaseApproval(address _spender, uint _subtractedValue)
        whenNotPaused limitForOwner public returns (bool success)
    {
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

    modifier whenIcoActive() {
        require((phase == Phases.PreIcoA) || (phase == Phases.PreIcoB) || (phase == Phases.MainIco));
        _;
    }

    modifier limitForOwner() {
        require((msg.sender != owner) || (phase == Phases.AfterIco));
        _;
    }

}
