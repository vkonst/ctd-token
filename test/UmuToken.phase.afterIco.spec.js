import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import {increaseTimeTo} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import params from './helpers/UmuToken.params';

/*global artifacts, assert, beforeEach, afterEach*/

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

contract('UmuToken After ICO Phase', (accounts) => {
    let token, preIcoOpeningTime, icoOpeningTime, icoClosingTime;

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
        await createBalancesAndSetPhase();
    });

    describe('a call by the owner', async () => {

        it('should throw error if create() called', async () => {
            await expectThrows(token.create.call({from: owner, value: OneEth}));
        });

        it('should NOT throw error if transfer() called and balance available', async () => {
            let result = token.transfer.call(buyer, 1, {from: owner});
            assert(result);
        });

        it('should NOT throw error if transferFrom() called and allowance available', async () => {
            let result = token.transferFrom.call(buyer, owner, 1, {from: owner});
            assert(result);
        });

        it('should NOT throw error if approve() called', async () => {
            let result = token.approve.call(buyer, 1, {from: owner});
            assert(result);
        });

        it('should NOT throw error if increaseApproval() called', async () => {
            let result = token.increaseApproval.call(bounty, 1, {from: owner});
            assert(result);
        });

        it('should NOT throw error if decreaseApproval() called', async () => {
            let result = token.decreaseApproval.call(bounty, 1, {from: owner});
            assert(result);
        });

    });

    describe('a call by the buyer', async () => {

        it('should throw error if create() called', async () => {
            await expectThrows(token.create.call({from: buyer, value: OneEth}));
        });

        it('should NOT throw error if transfer() called and balance available', async () => {
            let result = await token.transfer.call(owner, 1, {from: buyer});
            assert(result);
        });

        it('should NOT throw error if transferFrom() called and allowance available', async () => {
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

        it('should throw error if create() called', async () => {
            await expectThrows(token.create.call({from: bounty, value: OneEth}));
        });

        it('should NOT throw error if transfer() called and balance available', async () => {
            let result = await token.transfer.call(owner, 1, {from: bounty});
            assert(result);
        });

        it('should NOT throw error if transferFrom() called and allowance available', async () => {
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

    async function createBalancesAndSetPhase(fromAddr = stranger) {
        // create balances
        await increaseTimeTo(icoOpeningTime + tenSeconds);
        await callCreateWithOneEthFrom(buyer);

        await token.approve(owner,  1, {from: buyer});
        await token.approve(bounty, 1, {from: buyer});
        await token.approve(owner,  1, {from: bounty});
        await token.approve(buyer,  1, {from: bounty});

        // switch to After ICO Phase
        await increaseTimeTo(icoClosingTime + tenSeconds);
        await token.create({from: fromAddr, value: OneWei});
        await checkPhase(params.icoPhases.afterIco);
    }

    async function callCreateWithOneEthFrom(fromAddr = buyer) {
        return await token.create({from: fromAddr, value: OneEth});
    }

    async function checkPhase(expectedPhase) {
        let phase = await token.phase.call();
        let actualPhase = (typeof phase === 'number') ? phase : phase.toNumber();
        assert.equal(actualPhase, expectedPhase);
    }

});
