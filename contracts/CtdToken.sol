pragma solidity 0.4.15;

import './lib/zeppelin-solidity/math/SafeMath.sol';
import './PausableOnce.sol';
import './UpgradableToken.sol';
import './Withdrawable.sol';


/**
 * @title Cointed Token
 * @dev Cointed Token (CTD) and Token Sale (ICO).
 */

contract CtdToken is UpgradableToken, PausableOnce, Withdrawable {

    using SafeMath for uint256;

    string public constant name = "Cointed Token";
    string public constant symbol = "CTD";
    /** Number of "Atom" in 1 CTD (1 CTD = 1x10^decimals Atom) */
    uint8  public constant decimals = 18;

    /** Holder of bounty tokens */
    address public bounty;

    /** Limit (in Atom) issued, inclusive owner's and bounty shares */
    uint256 constant internal TOTAL_LIMIT   = 650000000 * (10 ** uint256(decimals));
    /** Limit (in Atom) for Pre-ICO Phases A, incl. owner's and bounty shares */
    uint256 constant internal PRE_ICO_LIMIT = 130000000 * (10 ** uint256(decimals));

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

    uint64 constant internal PRE_ICO_DURATION = 745 hours;
    uint64 constant internal ICO_DURATION = 2423 hours + 59 minutes;
    uint64 constant internal RETURN_WEI_PAUSE = 30 days;

    // Main ICO rate in CTD(s) per 1 ETH:
    uint256 constant internal TO_SENDER_RATE   = 1000;
    uint256 constant internal TO_OWNER_RATE    =  263;
    uint256 constant internal TO_BOUNTY_RATE   =   52;
    uint256 constant internal TOTAL_RATE   =   TO_SENDER_RATE + TO_OWNER_RATE + TO_BOUNTY_RATE;
    // Pre-ICO Phase A rate
    uint256 constant internal TO_SENDER_RATE_A = 1150;
    uint256 constant internal TO_OWNER_RATE_A  =  304;
    uint256 constant internal TO_BOUNTY_RATE_A =   61;
    uint256 constant internal TOTAL_RATE_A   =   TO_SENDER_RATE_A + TO_OWNER_RATE_A + TO_BOUNTY_RATE_A;
    // Pre-ICO Phase B rate
    uint256 constant internal TO_SENDER_RATE_B = 1100;
    uint256 constant internal TO_OWNER_RATE_B  =  292;
    uint256 constant internal TO_BOUNTY_RATE_B =   58;
    uint256 constant internal TOTAL_RATE_B   =   TO_SENDER_RATE_B + TO_OWNER_RATE_B + TO_BOUNTY_RATE_B;

    // Award in Wei(s) to a successful initiator of a Phase shift
    uint256 constant internal PRE_OPENING_AWARD = 100 * (10 ** uint256(15));
    uint256 constant internal ICO_OPENING_AWARD = 200 * (10 ** uint256(15));
    uint256 constant internal ICO_CLOSING_AWARD = 500 * (10 ** uint256(15));

    struct Rates {
        uint256 toSender;
        uint256 toOwner;
        uint256 toBounty;
        uint256 total;
    }

    event NewTokens(uint256 amount);
    event NewFunds(address funder, uint256 value);
    event NewPhase(Phases phase);

    // current Phase
    Phases public phase = Phases.PreStart;

    // Timestamps limiting duration of Phases, in seconds since Unix epoch.
    uint64 public preIcoOpeningTime;  // when Pre-ICO Phase A starts
    uint64 public icoOpeningTime;     // when Main ICO starts (if not sold out before)
    uint64 public closingTime;        // by when the ICO campaign finishes in any way
    uint64 public returnAllowedTime;  // when owner may withdraw Eth from contract, if any

    uint256 public totalProceeds;

    /*
     * @dev constructor
     * @param _preIcoOpeningTime Timestamp when the Pre-ICO (Phase A) shall start.
     * msg.value MUST be at least the sum of awards.
     */
    function CtdToken(uint64 _preIcoOpeningTime) payable {
        require(_preIcoOpeningTime > now);

        preIcoOpeningTime = _preIcoOpeningTime;
        icoOpeningTime = preIcoOpeningTime + PRE_ICO_DURATION;
        closingTime = icoOpeningTime + ICO_DURATION;
    }

    /*
     * @dev Fallback function delegates the request to create().
     */
    function () payable external {
        create();
    }

    /**
     * @dev Set the address of the holder of bounty tokens.
     * @param _bounty The address of the bounty token holder.
     * @return success/failure
     */
    function setBounty(address _bounty) onlyOwner external returns (bool success) {
        require(_bounty != address(0));
        bounty = _bounty;
        return true;
    }

    /**
     * @dev Mint tokens and add them to the balance of the message.sender.
     * Additional tokens are minted and added to the owner and the bounty balances.
     * @return success/failure
     */
    function create() payable whenNotClosed whenNotPaused public returns (bool success) {
        require(msg.value > 0);
        require(now >= preIcoOpeningTime);

        Phases oldPhase = phase;
        uint256 weiToParticipate = msg.value;
        uint256 overpaidWei;

        adjustPhaseBasedOnTime();

        if (phase != Phases.AfterIco) {

            Rates memory rates = getRates();
            uint256 newTokens = weiToParticipate.mul(rates.total);
            uint256 requestedSupply = totalSupply.add(newTokens);

            uint256 oversoldTokens = computeOversoldAndAdjustPhase(requestedSupply);
            overpaidWei = (oversoldTokens > 0) ? oversoldTokens.div(rates.total) : 0;

            if (overpaidWei > 0) {
                weiToParticipate = msg.value.sub(overpaidWei);
                newTokens = weiToParticipate.mul(rates.total);
                requestedSupply = totalSupply.add(newTokens);
            }

            // "emission" of new tokens
            totalSupply = requestedSupply;
            balances[msg.sender] = balances[msg.sender].add(weiToParticipate.mul(rates.toSender));
            balances[owner] = balances[owner].add(weiToParticipate.mul(rates.toOwner));
            balances[bounty] = balances[bounty].add(weiToParticipate.mul(rates.toBounty));

            // ETH transfers
            totalProceeds = totalProceeds.add(weiToParticipate);
            owner.transfer(weiToParticipate);
            if (overpaidWei > 0) {
                setWithdrawal(msg.sender, overpaidWei);
            }

            // Logging
            NewTokens(newTokens);
            NewFunds(msg.sender, weiToParticipate);

        } else {
            setWithdrawal(msg.sender, msg.value);
        }

        if (phase != oldPhase) {
            logShiftAndBookAward();
        }

        return true;
    }

    /**
     * @dev Send the value (ethers) that the contract holds to the owner address.
     */
    function returnWei() onlyOwner whenClosed afterWithdrawPause external {
        owner.transfer(this.balance);
    }

    function adjustPhaseBasedOnTime() internal {

        if (now >= closingTime) {
            if (phase != Phases.AfterIco) {
                phase = Phases.AfterIco;
            }
        } else if (now >= icoOpeningTime) {
            if (phase != Phases.MainIco) {
                phase = Phases.MainIco;
            }
        } else if (phase == Phases.PreStart) {
            setDefaultParamsIfNeeded();
            phase = Phases.PreIcoA;
        }
    }

    function setDefaultParamsIfNeeded() internal {
        if (bounty == address(0)) {
            bounty = owner;
        }
        if (upgradeMaster == address(0)) {
            upgradeMaster = owner;
        }
        if (pauseMaster == address(0)) {
            pauseMaster = owner;
        }
    }

    function computeOversoldAndAdjustPhase(uint256 newTotalSupply) internal returns (uint256 oversoldTokens) {

        if ((phase == Phases.PreIcoA) &&
            (newTotalSupply >= PRE_ICO_LIMIT)) {
            phase = Phases.PreIcoB;
            oversoldTokens = newTotalSupply.sub(PRE_ICO_LIMIT);

        } else if (newTotalSupply >= TOTAL_LIMIT) {
            phase = Phases.AfterIco;
            oversoldTokens = newTotalSupply.sub(TOTAL_LIMIT);

        } else {
            oversoldTokens = 0;
        }

        return oversoldTokens;
    }

    function getRates() internal returns (Rates rates) {

        if (phase == Phases.PreIcoA) {
            rates.toSender = TO_SENDER_RATE_A;
            rates.toOwner = TO_OWNER_RATE_A;
            rates.toBounty = TO_BOUNTY_RATE_A;
            rates.total = TOTAL_RATE_A;
        } else if (phase == Phases.PreIcoB) {
            rates.toSender = TO_SENDER_RATE_B;
            rates.toOwner = TO_OWNER_RATE_B;
            rates.toBounty = TO_BOUNTY_RATE_B;
            rates.total = TOTAL_RATE_B;
        } else {
            rates.toSender = TO_SENDER_RATE;
            rates.toOwner = TO_OWNER_RATE;
            rates.toBounty = TO_BOUNTY_RATE;
            rates.total = TOTAL_RATE;
        }
        return rates;
    }

    function logShiftAndBookAward() internal {
        uint256 shiftAward;

        if ((phase == Phases.PreIcoA) || (phase == Phases.PreIcoB)) {
            shiftAward = PRE_OPENING_AWARD;

        } else if (phase == Phases.MainIco) {
            shiftAward = ICO_OPENING_AWARD;

        } else {
            shiftAward = ICO_CLOSING_AWARD;
            returnAllowedTime = uint64(now + RETURN_WEI_PAUSE);
        }

        setWithdrawal(msg.sender, shiftAward);
        NewPhase(phase);
    }

    /**
     * @dev Transfer tokens to the specified address.
     * @param _to The address to transfer to.
     * @param _value The amount of tokens to be transferred.
     * @return success/failure
     */
    function transfer(address _to, uint256 _value)
        whenNotPaused limitForOwner public returns (bool success)
    {
        return super.transfer(_to, _value);
    }

    /**
     * @dev Transfer tokens from one address to another.
     * @param _from address The address which you want to send tokens from.
     * @param _to address The address which you want to transfer to.
     * @param _value the amount of tokens to be transferred.
     * @return success/failure
     */
    function transferFrom(address _from, address _to, uint256 _value)
        whenNotPaused limitForOwner public returns (bool success)
    {
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * @dev Approve the specified address to spend the specified amount of tokens on behalf of the msg.sender.
     * Use "increaseApproval" or "decreaseApproval" function to change the approval, if needed.
     * @param _spender The address which will spend the funds.
     * @param _value The amount of tokens to be spent.
     * @return success/failure
     */
    function approve(address _spender, uint256 _value)
        whenNotPaused limitForOwner public returns (bool success)
    {
        require((_value == 0) || (allowed[msg.sender][_spender] == 0));
        return super.approve(_spender, _value);
    }

    /**
     * @dev Increase the approval for the passed address to spend tokens on behalf of the msg.sender.
     * @param _spender The address which will spend the funds.
     * @param _addedValue The amount of tokens to increase the approval with.
     * @return success/failure
     */
    function increaseApproval(address _spender, uint _addedValue)
        whenNotPaused limitForOwner public returns (bool success)
    {
        return super.increaseApproval(_spender, _addedValue);
    }

    /**
     * @dev Decrease the approval for the passed address to spend tokens on behalf of the msg.sender.
     * @param _spender The address which will spend the funds.
     * @param _subtractedValue The amount of tokens to decrease the approval with.
     * @return success/failure
     */
    function decreaseApproval(address _spender, uint _subtractedValue)
        whenNotPaused limitForOwner public returns (bool success)
    {
        return super.decreaseApproval(_spender, _subtractedValue);
    }

    /*
     * @dev Withdraw the allowed value (ethers) from the contract balance.
     * @return success/failure
     */
    function withdraw() whenNotPaused public returns (bool success) {
        return super.withdraw();
    }

    /**
     * @dev Throws if called when ICO is active.
     */
    modifier whenClosed() {
        require(phase == Phases.AfterIco);
        _;
    }

    /**
     * @dev Throws if called when ICO is completed.
     */
    modifier whenNotClosed() {
        require(phase != Phases.AfterIco);
        _;
    }

    /**
     * @dev Throws if called by the owner before ICO is completed.
     */
    modifier limitForOwner() {
        require((msg.sender != owner) || (phase == Phases.AfterIco));
        _;
    }

    /**
     * @dev Throws if called before returnAllowedTime.
     */
    modifier afterWithdrawPause() {
        require(now > returnAllowedTime);
        _;
    }

}
