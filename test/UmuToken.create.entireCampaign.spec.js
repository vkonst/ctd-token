import {increaseTimeTo} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import params from './helpers/UmuToken.params';
import {DUMP, dumper, dumpActVsExpect, logEvents, toUmuMio} from "./helpers/UmuToken.utils";

/*global artifacts, assert, before, beforeEach, afterEach, web3*/

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

const BigNumber = web3.BigNumber;

contract('UmuToken ICO campaign', (accounts) => {
    let token, preIcoOpeningTime, icoOpeningTime;
    let txs = [], states = {pre: [], post: []};
    let dump;

    const owner = accounts[0];
    const buyer = accounts[1];
    const stranger = accounts[3];
    const bounty = accounts[4];

    const OneEth = 1e18;
    const QuoterEth = 250e15;
    const ThreeQuoterEth = 750e15;
    const tenSeconds = 10;

    const preIcoProceeds = params.tokenQtyLimits.preIco
        .divToInt(params.tokenRates.preIcoA.total);

    const mainIcoProceeds = params.tokenQtyLimits.total
        .sub(params.tokenQtyLimits.preIco)
        .divToInt(params.tokenRates.mainIco.total);

    const campaignProceeds = preIcoProceeds.add(mainIcoProceeds);

    const icoQtyLimitAtRateAPlusOneEth = params.tokenQtyLimits.total
        .divToInt(params.tokenRates.preIcoA.total)
        .add(OneEth);

    const buyerPreIcoTokens = preIcoProceeds.mul(params.tokenRates.preIcoA.sender);
    const buyerMainIcoTokens = mainIcoProceeds.mul(params.tokenRates.mainIco.sender);
    const campaignBuyerTokens = buyerPreIcoTokens.add(buyerMainIcoTokens);

    const ownerPreIcoTokens = preIcoProceeds.mul(params.tokenRates.preIcoA.owner);
    const ownerMainIcoTokens = mainIcoProceeds.mul(params.tokenRates.mainIco.owner);
    const campaignOwnerTokens = ownerPreIcoTokens.add(ownerMainIcoTokens);

    const bountyPreIcoTokens = preIcoProceeds.mul(params.tokenRates.preIcoA.bounty);
    const bountyMainIcoTokens = mainIcoProceeds.mul(params.tokenRates.mainIco.bounty);
    const campaignBountyTokens = bountyPreIcoTokens.add(bountyMainIcoTokens);

    before(async () => {
        const timeNow = await latestTime();
        preIcoOpeningTime = timeNow + 6*tenSeconds;
        icoOpeningTime = preIcoOpeningTime + params.durationLimits.preIco;

        token = await UmuTokenMock.new(preIcoOpeningTime);
        await token.setBounty(bounty);

        if (DUMP) {
            dump = await dumper(token, {owner, buyer, bounty});
            await dump('*** =clean');
        }

        states.pre.push(await getChainData(token));
        txs.push(
            await setPreIcoAndSellOutIcoTokens(params, buyer)
        );
        states.post.push(await getChainData(token));
        if (DUMP) await dump('*** =pre-pre');

        states.pre.push(await getChainData(token));
        txs.push(
            await setMainIcoAndLeaveTokensForQuoterEtherOnly(params, buyer)
        );
        states.post.push(await getChainData(token));

        if (DUMP) await dump('*** =pre');
        states.pre.push(await getChainData(token));
        txs.push(
            await sendCreateForOneEather(buyer)
        );
        states.post.push(await getChainData(token));
        if (DUMP) await dump('*** =post');

    });

    describe('create() called on Phase A with value worth all ICO tokens at Phase A rate plus one ETH', async () => {
        let pre, post, tx;

        const overpaidWeiPlusAward = icoQtyLimitAtRateAPlusOneEth
            .sub(preIcoProceeds)
            .add(params.awards.preOpening);

        beforeEach(async () => {
            tx = txs[0];
            pre = states.pre[0];
            post = states.post[0];
        });

        it(`should set totalSupply to ${toUmuMio(params.tokenQtyLimits.preIco)}M tokens`, async () => {
            const actual = post.totalSupply;
            const expected = params.tokenQtyLimits.preIco;
            if (DUMP) dumpActVsExpect(actual, expected, '*f1');
            assert(actual.sub(expected).absoluteValue().toNumber() <= params.tokenRates.preIcoA.total);
        });

        it(`should set buyer balance to ${toUmuMio(buyerPreIcoTokens)}M tokens`, async () => {
            const actual = post.tokenBalance.buyer;
            const expected = buyerPreIcoTokens;
            if (DUMP) dumpActVsExpect(actual, expected, '*f2');
            assert(actual.sub(expected).absoluteValue().toNumber() <= (params.tokenRates.preIcoA.sender));
        });

        it(`should set owner balance to ${toUmuMio(ownerPreIcoTokens)}M tokens`, async () => {
            const actual = post.tokenBalance.owner;
            const expected = ownerPreIcoTokens;
            if (DUMP) dumpActVsExpect(actual, expected, '*f3');
            assert(actual.sub(expected).absoluteValue().toNumber() <= (params.tokenRates.preIcoA.owner));
        });

        it(`should set bounty balance to ${toUmuMio(bountyPreIcoTokens)}M tokens`, async () => {
            const actual = post.tokenBalance.bounty;
            const expected = bountyPreIcoTokens;
            if (DUMP) dumpActVsExpect(actual, expected, '*f4');
            assert(actual.sub(expected).absoluteValue().toNumber() <= (params.tokenRates.preIcoA.bounty));
        });

        it(`should add ${preIcoProceeds.div(1e+18)} ETH to the owner account`, async () => {
            const actual = post.ethBalance.owner.sub(pre.ethBalance.owner);
            const expected = preIcoProceeds;
            if (DUMP) dumpActVsExpect(actual, expected, '*f5');
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it(`should set totalProceeds to ${preIcoProceeds.div(1e+18)} ETH`, async () => {
            const actual = post.totalProceeds;
            const expected = preIcoProceeds;
            if (DUMP) dumpActVsExpect(actual, expected, '*f6');
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it(`should set withdrawals for the buyer to ${overpaidWeiPlusAward.div(1e+18)} ETH`,
            async () => {
                const actual = post.withdrawal.buyer;
                const expected = overpaidWeiPlusAward;
                if (DUMP) dumpActVsExpect(actual, expected, '*f7');
                assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
            }
        );

    });

    describe('create() during ICO Phase with ETH value leaving tokens worth 0.25 ETH only', async () => {
        let pre, post, tx;

        const quoterTokens = (new BigNumber(QuoterEth)).mul(params.tokenRates.mainIco.total);

        beforeEach(async () => {
            tx = txs[1];
            pre = states.pre[0];
            post = states.post[1];
        });

        it(`should set totalSupply to ${toUmuMio(params.tokenQtyLimits.total.sub(quoterTokens))}M tokens`, async () => {
            const actual = post.totalSupply;
            const expected = params.tokenQtyLimits.total.sub(quoterTokens);
            let tolerance = params.tokenRates.preIcoA.total + params.tokenRates.mainIco.total;

            if (DUMP) dumpActVsExpect(actual, expected, '*e1');
            assert(actual.sub(expected).absoluteValue().toNumber() <= tolerance);
        });

        it(`should set totalProceeds to ${campaignProceeds.sub(QuoterEth).div(1e+18)} ETH`, async () => {
            const actual = post.totalProceeds;
            const expected = campaignProceeds.sub(QuoterEth);

            if (DUMP) dumpActVsExpect(actual, expected, '*e2');
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

    });

    describe('create() during ICO Phase with 1 ETH when only 0.25 ETH worth tokens unsold', async () => {
        let pre, post, tx;

        beforeEach(async () => {
            tx = txs[2];
            pre = states.pre[2];
            post = states.post[2];
        });

        it(`should add ${params.tokenRates.mainIco.total/4} tokens to totalSupply`, async () => {
            const actual = post.totalSupply.sub(pre.totalSupply);
            const expected = (new BigNumber(params.tokenRates.mainIco.total)).mul(250e15);
            if (DUMP) dumpActVsExpect(actual, expected, '*d1');
            assert(actual.sub(expected).absoluteValue().toNumber() <= params.tokenRates.mainIco.total);
        });

        it(`should add ${params.tokenRates.mainIco.sender/4} tokens to the buyer balance`, async () => {
            const actual = post.tokenBalance.buyer.sub(pre.tokenBalance.buyer);
            const expected = params.tokenRates.mainIco.sender*250e15;
            if (DUMP) dumpActVsExpect(actual, expected, '*d2');
            assert(actual.sub(expected).absoluteValue().toNumber() <= (params.tokenRates.mainIco.sender + 1));
        });

        it(`should add ${params.tokenRates.mainIco.owner/4} tokens to the owner balance`, async () => {
            const actual = post.tokenBalance.owner.sub(pre.tokenBalance.owner);
            const expected = params.tokenRates.mainIco.owner*250e15;
            if (DUMP) dumpActVsExpect(actual, expected, '*d3');
            assert(actual.sub(expected).absoluteValue().toNumber() <= (params.tokenRates.mainIco.owner + 1));
        });

        it(`should add ${params.tokenRates.mainIco.bounty/4} tokens to the bounty balance`, async () => {
            const actual = post.tokenBalance.bounty.sub(pre.tokenBalance.bounty);
            const expected = params.tokenRates.mainIco.bounty*250e15;
            if (DUMP) dumpActVsExpect(actual, expected, '*d4');
            assert(actual.sub(expected).absoluteValue().toNumber() <= (params.tokenRates.mainIco.bounty + 1));
        });

        it('should add 0.25 Ether to the owner account', async () => {
            const actual = post.ethBalance.owner.sub(pre.ethBalance.owner);
            const expected = QuoterEth;
            if (DUMP) dumpActVsExpect(actual, expected, '*d5');
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it('should add 0.25 Ether to the total proceeds', async () => {
            const actual = post.totalProceeds.sub(pre.totalProceeds);
            const expected = QuoterEth;
            if (DUMP) dumpActVsExpect(actual, expected, '*d6');
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it(`should add 0.75 ETH and ${params.awards.closing.div(1e18)} ETH award to withdrawals for the buyer`,
            async () => {
                const actual = post.withdrawal.buyer.sub(pre.withdrawal.buyer);
                const expected = params.awards.closing.add(ThreeQuoterEth);
                if (DUMP) dumpActVsExpect(actual, expected, '*d7');
                assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
            }
        );

        it(`should emit Withdrawal event on overpaid 0.75 ETH`, async () => {
            let event = tx.logs[0];
            const actual = event.args.weiAmount;
            const expected = ThreeQuoterEth;

            if (DUMP) dumpActVsExpect(actual, expected, '*8');
            assert.equal(event.event, 'Withdrawal');
            assert.equal(event.args.drawer, buyer);
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it(`should emit NewTokens event on ${params.tokenRates.mainIco.total/4} tokens`, async () => {
            let event = tx.logs[1];
            const actual = event.args.amount;
            const expected = new BigNumber(params.tokenRates.mainIco.total).mul(QuoterEth);

            if (DUMP) dumpActVsExpect(actual, expected, '*9');
            assert.equal(event.event, 'NewTokens');
            assert(actual.sub(expected).absoluteValue().toNumber() <= params.tokenRates.mainIco.total);
        });

        it('should emit NewFunds event on 0.25 Ether', async () => {
            let event = tx.logs[2];
            const actual = event.args.value;
            const expected = QuoterEth;

            if (DUMP) dumpActVsExpect(actual, expected, '*a');
            assert.equal(event.event, 'NewFunds');
            assert.equal(event.args.funder, buyer);
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it(`should emit Withdrawal event with ${params.awards.closing.div(1e18)} ETH award`, async () => {
            let event = tx.logs[3];
            const actual = event.args.weiAmount;
            const expected = params.awards.closing;

            if (DUMP) dumpActVsExpect(actual, expected, '*b');
            assert.equal(event.event, 'Withdrawal');
            assert.equal(event.args.drawer, buyer);
            assert.equal(actual.sub(expected), 0);
        });

        it(`should emit NewPhase event with Main ICO Phase`, async () => {
            let event = tx.logs[4];
            const actual = event.args.phase.toNumber();
            const expected = params.icoPhases.afterIco;

            if (DUMP) dumpActVsExpect(actual, expected, '*c');
            assert.equal(event.event, 'NewPhase');
            assert.equal(actual, expected);
        });

    });

    describe('the entire campaign', async () => {
        let pre, post, tx;

        beforeEach(async () => {
            tx = txs[2];
            pre = states.pre[0];
            post = states.post[2];
        });

        it(`should set totalSupply to ${toUmuMio(params.tokenQtyLimits.total)}M tokens`, async () => {
            const actual = post.totalSupply;
            const expected = params.tokenQtyLimits.total;
            let tolerance = params.tokenRates.preIcoA.total + params.tokenRates.mainIco.total;

            if (DUMP) dumpActVsExpect(actual, expected, '*c1');
            assert(actual.sub(expected).absoluteValue().toNumber() <= tolerance);
        });

        it(`should set buyer balance to ${toUmuMio(campaignBuyerTokens)}M tokens`, async () => {
            const actual = post.tokenBalance.buyer;
            const expected = campaignBuyerTokens;
            let tolerance = params.tokenRates.preIcoA.sender + params.tokenRates.mainIco.sender;

            if (DUMP) dumpActVsExpect(actual, expected, '*c2');
            assert(actual.sub(expected).absoluteValue().toNumber() <= tolerance);
        });

        it(`should set owner balance to ${toUmuMio(campaignOwnerTokens)}M tokens`, async () => {
            const actual = post.tokenBalance.owner;
            const expected = campaignOwnerTokens;
            let tolerance = params.tokenRates.preIcoA.owner + params.tokenRates.mainIco.owner;

            if (DUMP) dumpActVsExpect(actual, expected, '*c3');
            assert(actual.sub(expected).absoluteValue().toNumber() <= tolerance);
        });

        it(`should set bounty balance to ${toUmuMio(campaignBountyTokens)}M tokens`, async () => {
            const actual = post.tokenBalance.bounty;
            const expected = campaignBountyTokens;
            let tolerance = params.tokenRates.preIcoA.bounty + params.tokenRates.mainIco.bounty;

            if (DUMP) dumpActVsExpect(actual, expected, '*c4');
            assert(actual.sub(expected).absoluteValue().toNumber() <= tolerance);
        });

        it(`should set totalSupply to the sum of customer', owner' and bounty' tokens`, async () => {
            const actual = post.totalSupply;
            const expected = post.tokenBalance.buyer.add(post.tokenBalance.owner).add(post.tokenBalance.bounty);

            if (DUMP) dumpActVsExpect(actual, expected, '*c5');
            assert.equal(actual.sub(expected).absoluteValue().toNumber(), 0);
        });

        it(`should add ${campaignProceeds.div(1e+18)} ETH to the owner account`, async () => {
            const actual = post.ethBalance.owner.sub(pre.ethBalance.owner);
            const expected = campaignProceeds;

            if (DUMP) dumpActVsExpect(actual, expected, '*c6');
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it(`should set totalProceeds to ${campaignProceeds.div(1e+18)} ETH`, async () => {
            const actual = post.totalProceeds;
            const expected = campaignProceeds;

            if (DUMP) dumpActVsExpect(actual, expected, '*c7');
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

    });

    async function setPreIcoAndSellOutIcoTokens(params, fromAddr = stranger) {

        await increaseTimeTo(icoOpeningTime - tenSeconds);

        const targetPreIcotWei = params.tokenQtyLimits.preIco
            .divToInt(params.tokenRates.preIcoA.total)
            .add(OneEth)
            .toString();
        if (DUMP) console.warn("preICO target Wei: " + targetPreIcotWei);

        const tx = await token.create({from: fromAddr, value: icoQtyLimitAtRateAPlusOneEth});
        if (DUMP) logEvents(tx);

        await checkPhase(params.icoPhases.preIcoB);

        return tx;

    }

    async function setMainIcoAndLeaveTokensForQuoterEtherOnly(params, fromAddr = stranger) {

        await increaseTimeTo(icoOpeningTime + tenSeconds);

        const targetWei = params.tokenQtyLimits.total
            .sub(params.tokenQtyLimits.preIco)
            .divToInt(params.tokenRates.mainIco.total)
            .sub(QuoterEth)
            .toString();
        if (DUMP) console.warn("mainICO target Wei: " + targetWei);

        const tx = await token.create({from: fromAddr, value: targetWei});
        if (DUMP) logEvents(tx);

        await checkPhase(params.icoPhases.mainIco);

        return tx;
    }

    async function sendCreateForOneEather(fromAddr = buyer) {
        const tx = await token.create({from: fromAddr, value: OneEth});
        if (DUMP) logEvents(tx);
        return tx;
    }


    async function checkPhase(expectedPhase) {
        let phase = await token.phase.call();
        let actualPhase = (typeof phase === 'number') ? phase : phase.toNumber();
        assert.equal(actualPhase, expectedPhase);
    }

    function getChainData(token) {

        let result = {
            ethBalance:{},
            tokenBalance:{},
            withdrawal: {}
        };

        return Promise.all([
            token.totalSupply.call(),
            token.totalProceeds.call(),
            token.getTokenBalanceOf.call(owner),
            token.getTokenBalanceOf.call(buyer),
            token.getTokenBalanceOf.call(bounty),
            token.getBalanceAt.call(owner),
            token.getBalanceAt.call(buyer),
            token.testPendingWithdrawalAmount.call({from: buyer})
        ])
            .then(response => ([
                result.totalSupply,
                result.totalProceeds,
                result.tokenBalance.owner,
                result.tokenBalance.buyer,
                result.tokenBalance.bounty,
                result.ethBalance.owner,
                result.ethBalance.buyer,
                result.withdrawal.buyer
            ] = response, result));
    }

});
