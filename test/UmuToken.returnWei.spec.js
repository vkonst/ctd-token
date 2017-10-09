import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import {increaseTimeTo} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import params from './helpers/UmuToken.params';

/*global artifacts, assert, beforeEach, afterEach*/

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

contract('UmuToken.returnWei()', (accounts) => {
    let token, preIcoOpeningTime, icoOpeningTime, icoClosingTime;

    let owner = accounts[0];
    let stranger = accounts[3];

    const OneWei = 1;
    const tenSeconds = 10;

    const returnWeiPauseInDays = 30;
    const returnWeiPauseInSecs = returnWeiPauseInDays * 24 * 3600;

    describe('returnWei() function', async () => {

        before(async () => {
            const timeNow = await latestTime();
            preIcoOpeningTime = timeNow + 6*tenSeconds;
            icoOpeningTime = preIcoOpeningTime + params.durationLimits.preIco;
            icoClosingTime = icoOpeningTime + params.durationLimits.mainIco;

            token = await UmuTokenMock.new(preIcoOpeningTime);

            await setMainIcoPhase();
        });

        it('should trow error if called by strangers', async () => {
            await expectThrows(token.returnWei.call({from: stranger}));
        });

        describe('if called by the owner...', () => {
            it('should throw error if ICO is not yet finished', async () => {
                await expectThrows(token.returnWei.call({from: owner}));
            });

            it(`should throw error if called within ${returnWeiPauseInDays} days since ICO finihed`,
                async () => {
                    await setAfterIcoPhase();
                    await increaseTimeTo(icoClosingTime + returnWeiPauseInSecs - 2*tenSeconds);
                    await expectThrows(token.returnWei.call({from: owner}));
                }
            );

            it(`should NOT throw error if called after ${returnWeiPauseInDays} days since ICO finished`,
                async () => {
                    await increaseTimeTo(icoClosingTime + returnWeiPauseInSecs + 2*tenSeconds);
                    let result = await (token.returnWei.call({from: owner}));
                    assert(result);
                }
            );

        });

    });

    async function setMainIcoPhase(fromAddr = stranger) {
        await increaseTimeTo(icoClosingTime - tenSeconds);
        await token.create({from: fromAddr, value: OneWei});
        await checkPhase(params.icoPhases.mainIco);
    }

    async function setAfterIcoPhase(fromAddr = stranger) {
        await increaseTimeTo(icoClosingTime + tenSeconds);
        await token.create({from: fromAddr, value: OneWei});
        await checkPhase(params.icoPhases.afterIco);
    }

    async function checkPhase(expectedPhase) {
        let phase = await token.phase.call();
        let actualPhase = (typeof phase === 'number') ? phase : phase.toNumber();
        assert.equal(actualPhase, expectedPhase);
    }

});
