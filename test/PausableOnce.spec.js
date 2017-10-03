import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import increaseTime from './lib/zeppelin-solidity/test/helpers/increaseTime';
import {duration} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';

const PausableOnceMock = artifacts.require('./helpers/UmuTokenMock.sol');

const PAUSE_DURATION = duration.days(14);

contract('PausableOnce', (accounts) => {
    let pausable;

    let owner = accounts[0];
    let master = accounts[1];
    let stranger = accounts[2];

    beforeEach(async () => {
        const tenSeconds = 10;
        const timeNow = await latestTime();
        const preIcoOpeningTime = timeNow + tenSeconds;
        pausable = await PausableOnceMock.new(preIcoOpeningTime);
    });

    describe('constructor', async () => {

        it('should set pauseMaster to 0', async () => {
            assert.equal(await pausable.pauseMaster(), 0);
        });

        it('should set pauseEnd to 0', async () => {
            assert.equal(await pausable.pauseEnd(), 0);
        });
    });

    describe('setPauseMaster()', async () => {

        it('should assign the new pauseMaster being called by the old owner', async () => {
            await pausable.setPauseMaster(master, {from: owner});
            assert.equal(await pausable.pauseMaster(), master);
        });

        it('should not allow setting the pauseMaster by non-owners', async () => {
            assert((await pausable.owner()) != stranger);
            await expectThrows(pausable.setPauseMaster(master, {from: stranger}));
        });

        it('should not allow setting to null or 0 address by the owner ', async () => {
            await expectThrows(pausable.setPauseMaster(null, {from: owner}));
            await expectThrows(pausable.setPauseMaster(0, {from: owner}));
        });

    });

    describe('pause()', async () => {

        describe('before the pause master has been set ...', async () => {

            it('should throw being called by the owner', async () => {
                await expectThrows(pausable.pause({from: owner}));
            });

            it('should throw being called not by the pause master', async () => {
                await expectThrows(pausable.pause({from: stranger}));
            });

        });

        describe('after the pause master has been set ...', async () => {
            beforeEach(async () => {
                await pausable.setPauseMaster(master, {from: owner});
                assert.equal(await pausable.pauseMaster(), master);
                // let the new block(s) to mine
                await increaseTime(60);
            });

            it('should return true being called by the pause master', async () => {
                let result = await pausable.pause.call({from: master});
                assert.equal(await result, true);
            });

            it('... and should assign pauseEnd', async () => {
                await pausable.pause({from: master});
                let expectedPauseEnd = await latestTime();
                expectedPauseEnd += PAUSE_DURATION;
                let actualPauseEnd = await pausable.pauseEnd();
                assert.equal(actualPauseEnd.toNumber(), expectedPauseEnd);
            });

            it('... and should emit Paused', async () => {
                let result = await pausable.pause({from: master});

                assert.lengthOf(result.logs, 1);
                let event = result.logs[0];
                assert.equal(event.event, 'Paused');
            });

            it('... and should throw when called again', async () => {
                await pausable.pause({from: master});
                await increaseTime(60);
                await expectThrows(pausable.pause({from: master}));
            });

            it('should throw being called by the owner', async () => {
                await expectThrows(pausable.pause({from: owner}));
            });

            it('should throw being called not by strangers', async () => {
                await expectThrows(pausable.pause({from: stranger}));
            });

        });

    });

    describe('whenNotPaused<modifier>', async () => {

        it('should NOT throw if the pause master is yet unset', async () => {
            let result = await pausable.testModifierWhenNotPaused();
            assert.equal(result, true);
        });

        it('... and should NOT throw if called by non-owners', async () => {
            let result = await pausable.testModifierWhenNotPaused({from: stranger});
            assert.equal(result, true);
        });

        describe('after the pause has been set ...', async () => {

            beforeEach(async () => {
                // Set the pause master
                await pausable.setPauseMaster(master, {from: owner});
                assert.equal(await pausable.pauseMaster(), master);

                // ... and start the pause
                let result = await pausable.pause({from: master});
                let event = result.logs[0];
                assert.equal(event.event, 'Paused');

                // let the new block(s) to mine
                await increaseTime(60);
            });

            it('should throw being called during the pause', async () => {
                await expectThrows(pausable.testModifierWhenNotPaused());
            });

            it('should NOT throw being called after the pause', async () => {
                await increaseTime(PAUSE_DURATION + 60);

                let result = await pausable.testModifierWhenNotPaused();
                assert.equal(result, true);
            });

        });

    });

});
