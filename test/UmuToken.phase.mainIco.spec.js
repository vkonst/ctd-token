'use strict';

import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import {increaseTimeTo} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import params from './helpers/UmuToken.params';

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

let DUMP = false;

contract('UmuToken Main ICO Phase', (accounts) => {
    let token, preIcoOpeningTime, icoOpeningTime, icoClosingTime;
    let beforeOwnerEthBalance, beforeTotalSupply, beforeTokenBalanceOfOwner, beforeTokenBalanceOfBounty;

    let owner = accounts[0];
    let buyer = accounts[1];
    let stranger = accounts[3];
    let bounty = accounts[4];

    const OneWei = 1;
    const OneEth = 1e18;
    const tenSeconds = 10;

    beforeEach(async () => {
        const timeNow = await latestTime();
        preIcoOpeningTime = timeNow + 6*tenSeconds;
        icoOpeningTime = preIcoOpeningTime + params.durationLimits.preIco;
        icoClosingTime = icoOpeningTime + params.durationLimits.mainIco;

        token = await UmuTokenMock.new(preIcoOpeningTime);
        await token.setBounty(bounty);
    });

    beforeEach(async () => {
        await setPhase();
    });

    describe('a call from buyer of "create()" with value of 1 ETH', async () => {

        beforeEach(async () => {
            beforeTotalSupply = await token.totalSupply.call();
            beforeTokenBalanceOfOwner = await token.getTokenBalanceOf.call(owner);
            beforeTokenBalanceOfBounty = await token.getTokenBalanceOf.call(bounty);
            beforeOwnerEthBalance = await token.getBalanceAt(owner);
            assert.equal(await token.getTokenBalanceOf.call(buyer), 0);

            await callCreateWithOneEthFrom(buyer);
        });

        it(`should add ${params.tokenRates.mainIco.total} tokens to totalSupply`, async () => {
            let addedTokens = (await token.totalSupply.call()).sub(beforeTotalSupply);
            assert.equal(toUmu(addedTokens), params.tokenRates.mainIco.total);
        });

        it(`should add ${params.tokenRates.mainIco.sender} tokens to the buyer balance`, async () => {
            assert.equal(toUmu(await token.getTokenBalanceOf.call(buyer)), params.tokenRates.mainIco.sender);
        });

        it(`should add ${params.tokenRates.mainIco.owner} tokens to the owner balance`, async () => {
            let addedTokens = (await token.getTokenBalanceOf.call(owner)).sub(beforeTokenBalanceOfOwner);
            assert.equal(toUmu(addedTokens), params.tokenRates.mainIco.owner);
        });

        it(`should add ${params.tokenRates.mainIco.bounty} tokens to the bounty balance`, async () => {
            let addedTokens = (await token.getTokenBalanceOf.call(bounty)).sub(beforeTokenBalanceOfBounty);
            assert.equal(toUmu(addedTokens), params.tokenRates.mainIco.bounty);
        });

        it('should add 1 Ether to the owner account', async () => {
            let actualBalance = (await token.getBalanceAt(owner)).toNumber();
            let expectedBalance = beforeOwnerEthBalance.add(OneEth).toNumber();
            assert.equal(actualBalance, expectedBalance);
            if (DUMP) await dump('*** =should add 1 Ether to the owner account');
        });

    });

    describe('a call by the owner', async () => {
        let tx;

        beforeEach(async () => {
            tx = await callCreateWithOneEthFrom(owner);
        });

        it('should NOT throw error if create() called', async () => {
            assert(!!tx);
        });

        it('should throw error if transfer() called and balance available', async () => {
            await expectThrows(token.transfer.call(buyer, 1, {from: owner}));
        });

        it('should throw error if transferFrom() called and allowance available', async () => {
            // give buyer some tokens needed to provide the allowance
            await token.create({from: buyer, value: OneWei});
            await token.approve(owner, 1, {from: buyer});

            await expectThrows(token.transferFrom.call(buyer, owner, 1, {from: owner}));
        });

        it('should throw error if approve() called', async () => {
            await expectThrows(token.approve.call(buyer, 1, {from: owner}));
        });

        it('should throw error if increaseApproval() called', async () => {
            await expectThrows(token.increaseApproval.call(bounty, 1, {from: owner}));
        });

        it('should throw error if decreaseApproval() called', async () => {
            await expectThrows(token.decreaseApproval.call(bounty, 1, {from: owner}));
        });

    });

    describe('a call by the buyer', async () => {

        beforeEach(async () => {
            await callCreateWithOneEthFrom();
        });

        it('should NOT throw error if transfer() called and balance available', async () => {
            let result = await token.transfer.call(owner, 1, {from: buyer});
            assert(result);
        });

        it('should NOT throw error if transferFrom() called and allowance available', async () => {
            await token.approve(buyer, 1, {from: bounty});
            let result = await token.transferFrom.call(bounty, buyer, 1, {from: buyer});
            assert(result);
        });

        it('should NOT throw error if approve() called', async () => {
            let result = await token.approve.call(owner, 1, {from: buyer});
            assert(result);
        });

        it('should NOT throw error if increaseApproval() called', async () => {
            let result = await token.increaseApproval.call(owner, 1, {from: buyer});
            assert(result);
        });

        it('should NOT throw error if decreaseApproval() called', async () => {
            let result = await token.decreaseApproval.call(owner, 1, {from: buyer});
            assert(result);
        });

    });

    describe('a call by the bounty', async () => {
        let tx;

        beforeEach(async () => {
            tx = await callCreateWithOneEthFrom(bounty);
        });

        it('should NOT throw error if create() called', async () => {
            assert(!!tx);
        });

        it('should NOT throw error if transfer() called and balance available', async () => {
            let result = await token.transfer.call(owner, 1, {from: bounty});
            assert(result);
        });

        it('should NOT throw error if transferFrom() called and allowance available', async () => {
            // give buyer some tokens needed to provide the allowance
            await token.transfer(buyer, 1, {from: bounty});
            await token.approve(bounty, 1, {from: buyer});

            let result = await token.transferFrom.call(buyer, bounty, 1, {from: bounty});
            assert(result);
        });

        it('should NOT throw error if approve() called', async () => {
            let result = await token.approve.call(owner, 1, {from: bounty});
            assert(result);
        });

        it('should NOT throw error if increaseApproval() called', async () => {
            let result = await token.increaseApproval.call(owner, 1, {from: bounty});
            assert(result);
        });

        it('should NOT throw error if decreaseApproval() called', async () => {
            let result = await token.decreaseApproval.call(owner, 1, {from: bounty});
            assert(result);
        });

    });

    async function setPhase(fromAddr = stranger) {
        // switch to Main ICO Phase
        await increaseTimeTo(icoOpeningTime + tenSeconds);
        await token.create({from: fromAddr, value: params.maxPreIcoAPhaseWei + OneEth});
        await checkPhase(params.icoPhases.mainIco);
    }

    async function callCreateWithOneEthFrom(fromAddr = buyer) {
        return await token.create({from: fromAddr, value: OneEth});
    }

    async function checkPhase(expectedPhase) {
        let phase = await token.phase.call();
        let actualPhase = (typeof phase === 'number') ? phase : phase.toNumber();
        assert.equal(actualPhase, expectedPhase);
    }

    async function dump(msg) {
        let timeNow = await latestTime();

        if (msg) console.warn(msg);
        console.warn('time: ' +
            (timeNow >= icoClosingTime    ? ('icoClosed + ' + (timeNow - icoClosingTime))    :
                (timeNow >= icoOpeningTime    ? ('icoOpened + ' + (timeNow - icoOpeningTime))    :
                        (timeNow >= preIcoOpeningTime ? ('preOpened + ' + (timeNow - preIcoOpeningTime)) :
                            (timeNow - preIcoOpeningTime))
                )));
        console.warn('phase: ' + await token.phase.call());
        console.warn('totalSupply  [Atoms]: ' + (await token.totalSupply.call()));
        console.warn('tokensBuyer  [Atoms]: ' + (await token.getTokenBalanceOf.call(buyer)));
        console.warn('tokensOwner  [Atoms]: ' + (await token.getTokenBalanceOf.call(owner)));
        console.warn('tokensBounty [Atoms]: ' + (await token.getTokenBalanceOf.call(bounty)));
        console.warn('totalProceeds  [Wei]: ' + (await token.totalProceeds.call()));
        console.warn('ethOwner       [Wei]: ' + (await token.getBalanceAt(owner)).sub(beforeOwnerEthBalance));
    }

    function toUmu(atoms) {
        let bigAtoms = (typeof atoms === 'number') ? (new BigNumber(atoms)) : atoms;
        return bigAtoms.div(1e18).toNumber();
    }

});
