import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import params from './helpers/UmuToken.params';

/*global artifacts, assert, beforeEach, afterEach*/

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

contract('UmuToken Pre-Start Phase', (accounts) => {
    let token, preIcoOpeningTime;

    let owner = accounts[0];
    let stranger = accounts[3];
    let bounty = accounts[4];

    const OneEth = 1e18;
    const tenSeconds = 10;

    beforeEach(async () => {
        const timeNow = await latestTime();
        preIcoOpeningTime = timeNow + 6*tenSeconds;

        token = await UmuTokenMock.new(preIcoOpeningTime);
        await token.setBounty(bounty);
    });

    describe('a call of create()', async () => {

        beforeEach(async () => {
            await checkPhase(params.icoPhases.preStart);
        });

        it('should throw error if a stranger called it', async () => {
            await expectThrows(token.create.call({from: stranger, value: OneEth}));
        });

        it('should throw error if the owner called it', async () => {
            await expectThrows(token.create.call({from: owner, value: OneEth}));
        });

        it('should throw error if the bounty called it', async () => {
            await expectThrows(token.create.call({from: bounty, value: OneEth}));
        });

        async function checkPhase(expectedPhase) {
            let phase = await token.phase.call();
            let actualPhase = (typeof phase === 'number') ? phase : phase.toNumber();
            assert.equal(actualPhase, expectedPhase);
        }

    });

});
