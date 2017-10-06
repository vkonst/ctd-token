import {increaseTimeTo} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import params from './helpers/UmuToken.params';
import {DUMP, dumper, toUmu} from "./helpers/UmuToken.utils";

/*global artifacts, assert, before, beforeEach, afterEach*/

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

contract('UmuToken.create()', (accounts) => {
    let token, preIcoOpeningTime;

    let owner = accounts[0];
    let buyer = accounts[1];
    let stranger = accounts[3];
    let bounty = accounts[4];

    const OneEth = 1e18;
    const HalfEth = 5e17;
    const tenSeconds = 10;

    let dump;

    before(async () => {
        const timeNow = await latestTime();
        preIcoOpeningTime = timeNow + 6*tenSeconds;

        token = await UmuTokenMock.new(preIcoOpeningTime);
        await token.setBounty(bounty);

        if (DUMP) {
            dump = await dumper(token, {owner, buyer, bounty, stranger});
        }

        await setPreIcoAndLeaveTokensForHalfEtherOnly(params, stranger);
    });

    describe('with value of 1 ETH when only 0.5 ETH needed for available tokens', async () => {
        let pre, post, tx;

        before(async () => {
            pre = await getChainData(token);
            if (DUMP) await dump('*** =prio');

            tx = await token.create({from: buyer, value: OneEth});

            post = await getChainData(token);
            if (DUMP) await dump('*** =post');
        });

        it(`should add ${params.tokenRates.preIcoA.total/2} tokens to totalSupply`, async () => {
            let actual = post.totalSupply.sub(pre.totalSupply);
            let expected = params.tokenRates.preIcoA.total*1e18/2;
            if (DUMP) console.warn('*1 actual  :' + actual);
            if (DUMP) console.warn('*1 expected:' + expected);
            assert(Math.abs(toUmu(actual.sub(expected))) < 1/1e6);
        });

        it(`should add ${params.tokenRates.preIcoA.sender/2} tokens to the buyer balance`, async () => {
            let actual = post.tokenBalance.buyer.sub(pre.tokenBalance.buyer);
            let expected = params.tokenRates.preIcoA.sender*1e18/2;
            if (DUMP) console.warn('*2 actual  :' + actual);
            if (DUMP) console.warn('*2 expected:' + expected);
            assert(Math.abs(toUmu(actual.sub(expected))) < 1/1e6);
        });

        it(`should add ${params.tokenRates.preIcoA.owner/2} tokens to the owner balance`, async () => {
            let actual = post.tokenBalance.owner.sub(pre.tokenBalance.owner);
            let expected = params.tokenRates.preIcoA.owner*1e18/2;
            if (DUMP) console.warn('*3 actual  :' + actual);
            if (DUMP) console.warn('*3 expected:' + expected);
            assert(Math.abs(toUmu(actual.sub(expected))) < 1/1e6);
        });

        it(`should add ${params.tokenRates.preIcoA.bounty/2} tokens to the bounty balance`, async () => {
            let actual = post.tokenBalance.bounty.sub(pre.tokenBalance.bounty);
            let expected = params.tokenRates.preIcoA.bounty*1e18/2;
            if (DUMP) console.warn('*4 actual  :' + actual);
            if (DUMP) console.warn('*4 expected:' + expected);
            assert(Math.abs(toUmu(actual.sub(expected))) < 1/1e6);
        });

        it('should add 0.5 Ether to the owner account', async () => {
            let actual = post.ethBalance.owner.sub(pre.ethBalance.owner);
            let expected = HalfEth;
            if (DUMP) console.warn('*5 actual  :' + actual);
            if (DUMP) console.warn('*5 expected:' + expected);
            assert(Math.abs(actual.sub(expected).toNumber()));
        });

        it('should add 0.5 Ether to the total proceeds', async () => {
            let actual = post.totalProceeds.sub(pre.totalProceeds);
            let expected = HalfEth;
            if (DUMP) console.warn('*6 actual  :' + actual);
            if (DUMP) console.warn('*6 expected:' + expected);
            assert(Math.abs(actual.sub(expected).div(1e18).toNumber()) < 1/1e6);
        });

        it(`should add overpaid 0.5 ETH and ${params.awards.preOpening.div(1e18)} ETH award to withdrawal by buyer`,
            async () => {
                let actual = post.withdrawal.buyer.sub(pre.withdrawal.buyer);
                let expected = params.awards.preOpening.add(HalfEth);
                if (DUMP) console.warn('*7 actual  :' + actual);
                if (DUMP) console.warn('*7 expected:' + expected);
                assert(Math.abs(actual.sub(expected).div(1e18).toNumber()) < 1/1e6);
            }
        );

        it(`should emit Withdrawal event on overpaid 0.5 ETH`, async () => {
            let event = tx.logs[0];
            let actual = event.args.weiAmount;
            let expected = HalfEth;

            if (DUMP) console.warn('*8 actual  :' + actual);
            if (DUMP) console.warn('*8 expected:' + expected);
            assert.equal(event.event, 'Withdrawal');
            assert.equal(event.args.drawer, buyer);
            assert(Math.abs(actual.sub(expected).div(1e18).toNumber()) < 1e6);
        });

        it(`should emit NewTokens event on ${params.tokenRates.preIcoA.total/2} tokens`, async () => {
            let event = tx.logs[1];
            let actual = event.args.amount;
            let expected = params.tokenRates.preIcoA.total * 1e18/2;

            if (DUMP) console.warn('*9 actual  :' + actual);
            if (DUMP) console.warn('*9 expected:' + expected);
            assert.equal(event.event, 'NewTokens');
            assert(Math.abs(actual.sub(expected).div(1e18).toNumber()) < 1e6);
        });

        it('should emit NewFunds event on 0.5 Ether', async () => {
            let event = tx.logs[2];
            let actual = event.args.value;
            let expected = HalfEth;

            if (DUMP) console.warn('*a actual  :' + actual);
            if (DUMP) console.warn('*a expected:' + expected);
            assert.equal(event.event, 'NewFunds');
            assert.equal(event.args.funder, buyer);
            assert(Math.abs(actual.sub(expected).div(1e18).toNumber()) < 1e6);
        });

        it(`should emit Withdrawal event with ${params.awards.preOpening.div(1e18)} ETH award`, async () => {
            let event = tx.logs[3];
            let actual = event.args.weiAmount;
            let expected = params.awards.preOpening;

            if (DUMP) console.warn('*b actual  :' + actual);
            if (DUMP) console.warn('*b expected:' + expected);
            assert.equal(event.event, 'Withdrawal');
            assert.equal(event.args.drawer, buyer);
            assert.equal(actual.sub(expected), 0);
        });

        it(`should emit NewPhase event with Main ICO Phase`, async () => {
            let event = tx.logs[4];
            assert.equal(event.event, 'NewPhase');
            assert.equal(event.args.phase.toNumber(), params.icoPhases.preIcoB);
        });

    });

    async function setPreIcoAndLeaveTokensForHalfEtherOnly(params, fromAddr = stranger) {
        // switch to Pre-ICO Phase A
        await increaseTimeTo(preIcoOpeningTime + tenSeconds);

        // compute precisely Wei value that leaves available tokens for 0.5 ETH
        let roundedWei = params.tokenQtyLimits.preIco.div(params.tokenRates.preIcoA.total);
        let roundedQtyLimit = roundedWei.mul(params.tokenRates.preIcoA.total);
        let targetWei = roundedWei.sub(HalfEth);

        await token.create({from: fromAddr, value: targetWei.toNumber()});
        await checkPhase(params.icoPhases.preIcoA);
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
