import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import increaseTime, {increaseTimeTo, duration} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import params from './helpers/UmuToken.params';

/*global artifacts, assert, beforeEach, afterEach*/

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

const PAUSE_DURATION = duration.days(14);

contract('UmuToken is PausableOnce', (accounts) => {
    let token, preIcoOpeningTime, icoOpeningTime, icoClosingTime;

    let owner = accounts[0];
    let buyer = accounts[1];
    let stranger = accounts[3];
    let bounty = accounts[4];
    let master = accounts[5];

    const OneEth = 1e18;
    const tenSeconds = 10;

    beforeEach(async () => {
        const timeNow = await latestTime();
        preIcoOpeningTime = timeNow + 6*tenSeconds;
        icoOpeningTime = preIcoOpeningTime + params.durationLimits.preIco;
        icoClosingTime = icoOpeningTime + params.durationLimits.mainIco;

        token = await UmuTokenMock.new(preIcoOpeningTime, {value: OneEth});
        await token.setBounty(bounty);
    });

    beforeEach(async () => {
        await setPhaseAndCreateBalances();
    });

    describe('constructor', async () => {

        it('should set pauseMaster to 0', async () => {
            assert.equal(await token.pauseMaster(), 0);
        });

        it('should set pauseEnd to 0', async () => {
            assert.equal(await token.pauseEnd(), 0);
        });
    });

    describe('setPauseMaster()', async () => {

        it('should assign the new pauseMaster being called by the owner', async () => {
            await token.setPauseMaster(master, {from: owner});
            assert.equal(await token.pauseMaster(), master);
        });

        it('should not allow setting the pauseMaster by non-owners', async () => {
            assert((await token.owner()) != stranger);
            await expectThrows(token.setPauseMaster(master, {from: stranger}));
        });

        it('should not allow setting to null or 0 address by the owner ', async () => {
            await expectThrows(token.setPauseMaster(null, {from: owner}));
            await expectThrows(token.setPauseMaster(0, {from: owner}));
        });

    });

    describe('pause()', async () => {

        describe('before the pause master has been set ...', async () => {

            it('should throw being called by the owner', async () => {
                await expectThrows(token.pause({from: owner}));
            });

            it('should throw being called not by the pause master', async () => {
                await expectThrows(token.pause({from: stranger}));
            });

        });

        describe('after the pause master has been set ...', async () => {
            beforeEach(async () => {
                await token.setPauseMaster(master, {from: owner});
                assert.equal(await token.pauseMaster(), master);
            });

            it('should return true being called by the pause master', async () => {
                let result = await token.pause.call({from: master});
                assert.equal(await result, true);
            });

            it('... and should assign pauseEnd', async () => {
                await putOnPauseAndCheckPauseEnd();
            });

            it('... and should emit Paused', async () => {
                let result = await token.pause({from: master});

                assert.lengthOf(result.logs, 1);
                let event = result.logs[0];
                assert.equal(event.event, 'Paused');
            });

            it('... and should throw when called again', async () => {
                await token.pause({from: master});
                await expectThrows(token.pause({from: master}));
            });

            it('should throw being called by the owner', async () => {
                await expectThrows(token.pause({from: owner}));
            });

            it('should throw being called not by strangers', async () => {
                await expectThrows(token.pause({from: stranger}));
            });

        });

    });

    describe('whenNotPaused<modifier>', async () => {

        it('should NOT throw if the pause master is yet unset', async () => {
            let result = await token.testModifierWhenNotPaused();
            assert.equal(result, true);
        });

        it('... and should NOT throw if called by non-owners', async () => {
            let result = await token.testModifierWhenNotPaused({from: stranger});
            assert.equal(result, true);
        });

        describe('after the pause has been set ...', async () => {

            beforeEach(async () => {
                // Set the pause master
                await token.setPauseMaster(master, {from: owner});
                assert.equal(await token.pauseMaster(), master);

                // ... and start the pause
                let result = await token.pause({from: master});
                let event = result.logs[0];
                assert.equal(event.event, 'Paused');
            });

            it('should throw being called during the pause', async () => {
                await expectThrows(token.testModifierWhenNotPaused());
            });

            it('should NOT throw being called after the pause', async () => {
                await increaseTime(PAUSE_DURATION + 60);

                let result = await token.testModifierWhenNotPaused();
                assert.equal(result, true);
            });

        });

    });

    describe('when the contract is NOT on pause', async () => {

        beforeEach(async () => {
            await setAllowances();
        });

        describe('a call by the buyer', async () => {

            it('should NOT throw error if create() called', async () => {
                let result = await token.create({from: buyer, value: OneEth});
                assert(result);
            });

            it('should NOT throw error if transfer() called when balance available', async () => {
                let result = await token.transfer.call(stranger, 1, {from: buyer});
                assert(result);
            });

            it('should NOT throw error if transferFrom() called when allowance is available', async () => {
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

            it('should NOT throw error if withdraw() called when withdrawal is avaliable', async () => {
                let result = await token.withdraw.call({from: buyer});
                assert(result);
            });

        });

        describe('a call by a stranger', async () => {
            it('should NOT throw error if create() called', async () => {
                let result = await token.create.call({from: stranger, value: OneEth});
                assert(result);
            });
        });

    });

    describe('when the contract put on pause', async () => {

        beforeEach(async () => {
            await setAllowances();
            await token.setPauseMaster(master, {from: owner});
            await putOnPauseAndCheckPauseEnd();
        });

        describe('a call by the buyer', async () => {

            it('should throw error if create() called', async () => {
                await expectThrows(token.create({from: buyer, value: OneEth}));
            });

            it('should throw error if transfer() called even if balance is available', async () => {
                await expectThrows(token.transfer.call(stranger, 1, {from: buyer}));
            });

            it('should throw error if transferFrom() called even if allowance is available', async () => {
                await expectThrows(token.transferFrom.call(buyer, stranger, 1, {from: buyer}));
            });

            it('should throw error if approve() called', async () => {
                await expectThrows(token.approve.call(stranger, 1, {from: buyer}));
            });

            it('should throw error if increaseApproval() called', async () => {
                await expectThrows(token.increaseApproval.call(bounty, 1, {from: buyer}));
            });

            it('should throw error if decreaseApproval() called', async () => {
                await expectThrows(token.decreaseApproval.call(bounty, 1, {from: buyer}));
            });

            it('should throw error if withdraw() called even if withdrawal is avaliable', async () => {
                await expectThrows(token.withdraw.call({from: buyer}));
            });

        });

        describe('a call by the owner', async () => {

            it('should throw error if create() called', async () => {
                await expectThrows(token.create({from: owner, value: OneEth}));
            });

            it('should throw error if transfer() called even if balance is available', async () => {
                await expectThrows(token.transfer.call(stranger, 1, {from: owner}));
            });

            it('should throw error if transferFrom() called even if allowance is available', async () => {
                await expectThrows(token.transferFrom.call(buyer, owner, 1, {from: owner}));
            });

            it('should throw error if approve() called', async () => {
                await expectThrows(token.approve.call(stranger, 1, {from: owner}));
            });

            it('should throw error if increaseApproval() called', async () => {
                await expectThrows(token.increaseApproval.call(bounty, 1, {from: owner}));
            });

            it('should throw error if decreaseApproval() called', async () => {
                await expectThrows(token.decreaseApproval.call(bounty, 1, {from: owner}));
            });

            it('should throw error if withdraw() called even if withdrawal is avaliable', async () => {
                await expectThrows(token.withdraw.call({from: owner}));
            });

        });

        describe('a call by a stranger', async () => {
            it('should throw error if create() called', async () => {
                await expectThrows(token.create({from: stranger, value: OneEth}));
            });
        });

    });

    async function setPhaseAndCreateBalances() {
        // switch to Main ICO Phase
        await increaseTimeTo(icoOpeningTime + tenSeconds);
        // it creates balances for buyer, owner, bounty and withdrawal for buyer
        await token.create({from: buyer, value: OneEth});
        await checkPhase(params.icoPhases.mainIco);
    }

    async function setAllowances() {
        await token.approve(owner,  1, {from: buyer});
        await token.approve(bounty, 2, {from: buyer});
        await token.approve(owner,  3, {from: bounty});
        await token.approve(buyer,  4, {from: bounty});
    }

    async function putOnPauseAndCheckPauseEnd() {
        await token.pause({from: master});
        let expectedPauseEnd = await latestTime();
        expectedPauseEnd += PAUSE_DURATION;
        let actualPauseEnd = await token.pauseEnd.call();
        assert.equal(actualPauseEnd.toNumber(), expectedPauseEnd);
    }

    async function checkPhase(expectedPhase) {
        let phase = await token.phase.call();
        let actualPhase = (typeof phase === 'number') ? phase : phase.toNumber();
        assert.equal(actualPhase, expectedPhase);
    }

});
