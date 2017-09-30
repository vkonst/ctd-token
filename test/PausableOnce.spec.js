import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import increaseTime from './lib/zeppelin-solidity/test/helpers/increaseTime';
import {duration} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';

const Pausable = artifacts.require('../contracts/UmuToken.sol');

contract('PausableOnce', (accounts) => {
    let pausable;

    let owner = accounts[0];
    let master = accounts[1];
    let stranger = accounts[2];

    beforeEach(async () => {
        const tenSeconds = 10;
        const timeNow = await latestTime();
        // const timeNow = parseInt(new Date() / 1000);
        const preIcoOpeningTime = timeNow + tenSeconds;
        pausable = await Pausable.new(preIcoOpeningTime);
    });

    describe('construction', async () => {

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

        it('should not allow changing the pauseMaster to non-owners', async () => {
            assert((await pausable.owner()) != stranger);
            await expectThrows(pausable.setPauseMaster(master, {from: stranger}));
        });

        it('should not allow changing the owner to null or 0 address', async () => {
            await expectThrows(pausable.setPauseMaster(null, {from: owner}));
            await expectThrows(pausable.setPauseMaster(0, {from: owner}));
        });

    });
    describe('pause()', async () => {
        const PAUSE_DURATION = duration.days(14);

        beforeEach(async () => {
            await pausable.setPauseMaster(master, {from: owner});
            assert.equal(await pausable.pauseMaster(), master);
            // let the new block(s) to mine
             await increaseTime(60);
        });

        it('beforeEach shall set pauseMaster', async () => {
            assert.equal(await pausable.pauseMaster(), master);
            let expectedPauseEnd = await latestTime();
        });

        /*
        it('should assign pauseEnd being called by the pause master', async () => {
            await pausable.pause({from: master});
            let expectedPauseEnd = await latestTime();
            expectedPauseEnd += PAUSE_DURATION;
            assert.equal(await pausable.pauseEnd(), expectedPauseEnd);
        });

                it('should emit Paused on success', async () => {
                    let result = await pausable.pause(null, {from: master});

                    assert.lengthOf(result.logs, 1);
                    let event = result.logs[0];
                    assert.equal(event.event, 'Paused');
                });
        */

    });
});
