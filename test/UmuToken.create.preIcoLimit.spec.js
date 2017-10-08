import {increaseTimeTo} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import params from './helpers/UmuToken.params';
import {DUMP, dumper, dumpActVsExpect, logEvents} from "./helpers/UmuToken.utils";

/*global artifacts, assert, before, beforeEach, afterEach, web3*/

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

const BigNumber = web3.BigNumber;

contract('UmuToken.create() on Pre-ICO Phase', (accounts) => {
    let token, preIcoOpeningTime;

    let owner = accounts[0];
    let buyer = accounts[1];
    let stranger = accounts[3];
    let bounty = accounts[4];

    const OneEth = 1e18;
    const QuoterEth = 250e15;
    const ThreeQuoterEth = 750e15;
    const tenSeconds = 10;

    let dump;

    describe('called with 1 ETH when only 0.25 ETH needed for available pre-ICO tokens', async () => {
        let pre, post, tx, txs = [];

        before(async () => {
            const timeNow = await latestTime();
            preIcoOpeningTime = timeNow + 6*tenSeconds;

            token = await UmuTokenMock.new(preIcoOpeningTime);
            await token.setBounty(bounty);

            if (DUMP) {
                dump = await dumper(token, {owner, buyer, bounty, stranger});
                await dump('*** =clean');
            }

            txs.push(await setPreIcoAndLeaveTokensForQouterEtherOnly(params, stranger));

            if (DUMP) await dump('*** =prio');
            pre = await getChainData(token);

            tx = await sendCreateForOneEather();
            txs.push(tx);

            post = await getChainData(token);
            if (DUMP) await dump('*** =post');
        });

        it(`should add ${params.tokenRates.preIcoA.total/4} tokens to totalSupply`, async () => {
            let actual = post.totalSupply.sub(pre.totalSupply);
            let expected = (new BigNumber(params.tokenRates.preIcoA.total)).mul(250e15);
            if (DUMP) dumpActVsExpect(actual, expected, '*1');
            assert(actual.sub(expected).absoluteValue().toNumber() <= params.tokenRates.preIcoA.total);
        });

        it(`should add ${params.tokenRates.preIcoA.sender/4} tokens to the buyer balance`, async () => {
            let actual = post.tokenBalance.buyer.sub(pre.tokenBalance.buyer);
            let expected = params.tokenRates.preIcoA.sender*250e15;
            if (DUMP) dumpActVsExpect(actual, expected, '*2');
            assert(actual.sub(expected).absoluteValue().toNumber() <= (params.tokenRates.preIcoA.sender + 1));
        });

        it(`should add ${params.tokenRates.preIcoA.owner/4} tokens to the owner balance`, async () => {
            let actual = post.tokenBalance.owner.sub(pre.tokenBalance.owner);
            let expected = params.tokenRates.preIcoA.owner*250e15;
            if (DUMP) dumpActVsExpect(actual, expected, '*3');
            assert(actual.sub(expected).absoluteValue().toNumber() <= (params.tokenRates.preIcoA.owner + 1));
        });

        it(`should add ${params.tokenRates.preIcoA.bounty/4} tokens to the bounty balance`, async () => {
            let actual = post.tokenBalance.bounty.sub(pre.tokenBalance.bounty);
            let expected = params.tokenRates.preIcoA.bounty*250e15;
            if (DUMP) dumpActVsExpect(actual, expected, '*4');
            assert(actual.sub(expected).absoluteValue().toNumber() <= (params.tokenRates.preIcoA.bounty + 1));
        });

        it('should add 0.25 Ether to the owner account', async () => {
            let actual = post.ethBalance.owner.sub(pre.ethBalance.owner);
            let expected = QuoterEth;
            if (DUMP) dumpActVsExpect(actual, expected, '*5');
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it('should add 0.25 Ether to the total proceeds', async () => {
            let actual = post.totalProceeds.sub(pre.totalProceeds);
            let expected = QuoterEth;
            if (DUMP) dumpActVsExpect(actual, expected, '*6');
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it(`should add 0.75 ETH and ${params.awards.preOpening.div(1e18)} ETH award to withdrawals for the buyer`,
            async () => {
                let actual = post.withdrawal.buyer.sub(pre.withdrawal.buyer);
                let expected = params.awards.preOpening.add(ThreeQuoterEth);
                if (DUMP) dumpActVsExpect(actual, expected, '*7');
                assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
            }
        );

        it(`should emit Withdrawal event on overpaid 0.75 ETH`, async () => {
            let event = tx.logs[0];
            let actual = event.args.weiAmount;
            let expected = ThreeQuoterEth;

            if (DUMP) dumpActVsExpect(actual, expected, '*8');
            assert.equal(event.event, 'Withdrawal');
            assert.equal(event.args.drawer, buyer);
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it(`should emit NewTokens event on ${params.tokenRates.preIcoA.total/4} tokens`, async () => {
            let event = tx.logs[1];
            let actual = event.args.amount;
            let expected = new BigNumber(params.tokenRates.preIcoA.total).mul(QuoterEth);

            if (DUMP) dumpActVsExpect(actual, expected, '*9');
            assert.equal(event.event, 'NewTokens');
            assert(actual.sub(expected).absoluteValue().toNumber() <= params.tokenRates.preIcoA.total);
        });

        it('should emit NewFunds event on 0.25 Ether', async () => {
            let event = tx.logs[2];
            let actual = event.args.value;
            let expected = QuoterEth;

            if (DUMP) dumpActVsExpect(actual, expected, '*a');
            assert.equal(event.event, 'NewFunds');
            assert.equal(event.args.funder, buyer);
            assert(actual.sub(expected).absoluteValue().toNumber() <= 1);
        });

        it(`should emit Withdrawal event with ${params.awards.preOpening.div(1e18)} ETH award`, async () => {
            let event = tx.logs[3];
            let actual = event.args.weiAmount;
            let expected = params.awards.preOpening;

            if (DUMP) dumpActVsExpect(actual, expected, '*b');
            assert.equal(event.event, 'Withdrawal');
            assert.equal(event.args.drawer, buyer);
            assert.equal(actual.sub(expected), 0);
        });

        it(`should emit NewPhase event with Main ICO Phase`, async () => {
            let event = tx.logs[4];
            let actual = event.args.phase.toNumber();
            let expected = params.icoPhases.preIcoB;

            if (DUMP) dumpActVsExpect(actual, expected, '*c');
            assert.equal(event.event, 'NewPhase');
            assert.equal(actual, expected);
        });

    });

    async function setPreIcoAndLeaveTokensForQouterEtherOnly(params, fromAddr = stranger) {

        await increaseTimeTo(preIcoOpeningTime + tenSeconds);

        // leave tokens within Pre-ICO limit worth 0.25 ETH
        let targetWei = params.tokenQtyLimits.preIco
            .divToInt(params.tokenRates.preIcoA.total)
            .sub(QuoterEth)
            .toString();
        if (DUMP) console.warn("Target Wei: " + targetWei);

        let tx = await token.create({from: fromAddr, value: targetWei});
        if (DUMP) logEvents(tx);

        await checkPhase(params.icoPhases.preIcoA);

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
