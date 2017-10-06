import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
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

    const OneWei = 1;
    const OneEth = 1e18;
    const HalfEth = 5e17;
    const tenSeconds = 10;

    let dump;

    before(async () => {
        console.warn('*** root before');
        const timeNow = await latestTime();
        preIcoOpeningTime = timeNow + 6*tenSeconds;

        token = await UmuTokenMock.new(preIcoOpeningTime);
        await token.setBounty(bounty);

        if (DUMP) {
            dump = await dumper(token, {owner, buyer, bounty, stranger});
        }

        await setPreIcoAndLeaveTokensForHalfEtherOnly();
    });

    describe('with value of 1 ETH when only 0.5 ETH needed for available tokens', async () => {
        let pre, post;

        before(async () => {
            console.warn('*** describe before');
            pre = await getChainData(token);
            if (DUMP) await dump('*** =before');

            let tx = await token.create({from: buyer, value: OneEth});

            post = await getChainData(token);
            if (DUMP) await dump('*** =after');
        });

        it(`should add ${params.tokenRates.preIcoA.total/2} tokens to totalSupply`, async () => {
            let addedTokens = post.totalSupply.sub(pre.totalSupply);
            assert.equal(toUmu(addedTokens), params.tokenRates.preIcoA.total/2);
        });

        it(`should add ${params.tokenRates.preIcoA.sender/2} tokens to the buyer balance`, async () => {
            let addedTokens = post.tokenBalance.buyer.sub(pre.tokenBalance.buyer);
            assert.equal(toUmu(addedTokens), params.tokenRates.preIcoA.sender/2);
        });

        it(`should add ${params.tokenRates.preIcoA.owner/2} tokens to the owner balance`, async () => {
            let addedTokens = post.tokenBalance.owner.sub(pre.tokenBalance.owner);
            assert.equal(toUmu(addedTokens), params.tokenRates.preIcoA.owner/2);
        });

        it(`should add ${params.tokenRates.preIcoA.bounty/2} tokens to the bounty balance`, async () => {
            let addedTokens = post.tokenBalance.bounty.sub(pre.tokenBalance.bounty);
            assert.equal(toUmu(addedTokens), params.tokenRates.preIcoA.bounty/2);
        });

        it('should add 0.5 Ether to the owner account', async () => {
            let addedEth = post.ethBalance.owner.sub(pre.ethBalance.owner).toNumber();
            assert.equal(addedEth, HalfEth);
        });
    });

    async function setPreIcoAndLeaveTokensForHalfEtherOnly(params, fromAddr = stranger) {
        // switch to Pre-ICO Phase A
        await increaseTimeTo(preIcoOpeningTime + tenSeconds);

        // compute precisely Wei value that leaves available tokens for 0.5 ETH
        let roundedWei = params.tokenQtyLimits.preIco.div(params.tokenRates.preIcoA.total);
        let roundedQtyLimit = roundedWei.mul(params.tokenRates.preIcoA.total);
        if (params.tokenQtyLimits.preIco.greaterThan(roundedQtyLimit)) {
            roundedWei = roundedWei.sub(1);
        }
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
        let result = {ethBalance:{}, tokenBalance:{}};

        return Promise.all([
            token.totalSupply.call(),
            token.totalProceeds.call(),
            token.getTokenBalanceOf.call(owner),
            token.getTokenBalanceOf.call(buyer),
            token.getTokenBalanceOf.call(bounty),
            token.getBalanceAt.call(owner),
            token.getBalanceAt.call(buyer),
        ])
            .then(response => ([
                result.totalSupply,
                result.totalProceeds,
                result.tokenBalance.owner,
                result.tokenBalance.buyer,
                result.tokenBalance.bounty,
                result.ethBalance.owner,
                result.ethBalance.buyer
            ] = response, result));
    }

});
