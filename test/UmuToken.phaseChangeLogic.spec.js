import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import {increaseTimeTo} from './lib/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import params from './helpers/UmuToken.params';
import {DUMP, dumper, toUmuMio} from "./helpers/UmuToken.utils";

/*global artifacts, assert, beforeEach, afterEach*/

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

contract('UmuToken Phases', (accounts) => {
    let token, preIcoOpeningTime, icoOpeningTime, icoClosingTime;

    let owner = accounts[0];
    let buyer = accounts[1];
    let stranger = accounts[3];

    const OneWei = 1;
    const OneEth = 1e18;
    const tenSeconds = 10;

    const preIcoLimitMio = toUmuMio(params.tokenQtyLimits.preIco);
    const allIcoLimitMio = toUmuMio(params.tokenQtyLimits.total);

    let dump;

    beforeEach(async () => {
        const timeNow = await latestTime();
        preIcoOpeningTime = timeNow + 6*tenSeconds;
        icoOpeningTime = preIcoOpeningTime + params.durationLimits.preIco;
        icoClosingTime = icoOpeningTime + params.durationLimits.mainIco;
        token = await UmuTokenMock.new(preIcoOpeningTime);

        if (DUMP) {
            dump = await dumper(token, {owner, buyer});
        }

    });

    describe('Phase of the Campaign', async () => {

        it('should change its state by first call of "create()" if conditions met', async () => {
            await checkPhase(params.icoPhases.preStart);
            await increaseTimeTo(preIcoOpeningTime + tenSeconds);
            await callCreate({value: OneWei});
            await checkPhase(params.icoPhases.preIcoA);
        });

        it('should NOT change its state on create() if conditions unmet', async () => {
            await checkPhase(params.icoPhases.preStart);
            await increaseTimeTo(preIcoOpeningTime - tenSeconds);
            await expectThrows(callCreate({value: OneWei}));
            await checkPhase(params.icoPhases.preStart);
        });
    });

    describe('Pre-start Phase', async () => {

        beforeEach(async () => {
            if (DUMP) await dump('*** >0.x');
        });

        it('should start on contract deployment', async () => {
            await checkPhase(params.icoPhases.preStart);
        });

        it('should NOT switch until the "preIcoOpeningTime"', async () => {
            await increaseTimeTo(preIcoOpeningTime - tenSeconds);
            await expectThrows(callCreate({value: OneWei}));

            await checkPhase(params.icoPhases.preStart);
            if (DUMP) await dump('*** =0.1');
        });

        it('should switch to "Pre-ICO Phase A" at the "preIcoOpeningTime"', async () => {
            await increaseTimeTo(preIcoOpeningTime + tenSeconds);
            await checkPhase(params.icoPhases.preStart);

            await callCreate({value: OneWei});
            await checkPhase(params.icoPhases.preIcoA);
            if (DUMP) await dump('*** =0.2');
        });

        it('should switch to "Main ICO" on first call of create() after "icoOpeningTime"', async () => {
            await increaseTimeTo(icoOpeningTime + tenSeconds);
            await checkPhase(params.icoPhases.preStart);

            await callCreate({value: OneWei});
            await checkPhase(params.icoPhases.mainIco);
            if (DUMP) await dump('*** =0.3');
        });

        it('should switch to "After ICO" on first call of create() after "icoClosingTime"', async () => {
            await increaseTimeTo(icoClosingTime + tenSeconds);
            await checkPhase(params.icoPhases.preStart);

            await callCreate({value: OneWei});
            await checkPhase(params.icoPhases.afterIco);
            if (DUMP) await dump('*** =0.4');
        });

    });

    describe('Pre-ICO Phase A', async () => {

        beforeEach(async () => {
            await increaseTimeTo(preIcoOpeningTime + tenSeconds);
            await callCreate({value: OneWei});

            await checkPhase(params.icoPhases.preIcoA);
            if (DUMP) await dump('*** >1.x');
        });

        it(`should switch to "Phase B" if ${preIcoLimitMio}M tokens sold out before "icoOpeningTime"`, async () => {
            await callCreate({value: params.maxIcoPhaseWei + OneEth});
            await checkPhase(params.icoPhases.preIcoB);
            if (DUMP) await dump('*** =1.1');
        });

        it(`should switch to "(Main) ICO" at "icoOpeningTime" if ${preIcoLimitMio}M tokens unsold`, async () => {
            await increaseTimeTo(icoOpeningTime + tenSeconds);
            await callCreate({value: OneWei});

            await checkPhase(params.icoPhases.mainIco);
            if (DUMP) await dump('*** =1.2');
        });

        it(`should NOT switch before "icoOpeningTime" if ${preIcoLimitMio}M tokens unsold`, async () => {
            await increaseTimeTo(icoOpeningTime - tenSeconds);
            await callCreate({value: OneWei});

            await checkPhase(params.icoPhases.preIcoA);
            if (DUMP) await dump('*** =1.3');
        });

    });

    describe('Pre-ICO Phase B', async () => {
        beforeEach(async () => {
            // switch to Phase B
            await increaseTimeTo(preIcoOpeningTime + tenSeconds);
            await callCreate({from: buyer, value: params.maxIcoPhaseWei + OneEth});

            await checkPhase(params.icoPhases.preIcoB);
            if (DUMP) await dump('*** 2.x');
        });

        it(`should switch to "After ICO" if ${allIcoLimitMio}M tokens sold out before "icoOpeningTime"`, async () => {
            await callCreate({from: buyer, value: params.maxPreIcoBPhaseWei + OneEth});
            await checkPhase(params.icoPhases.afterIco);
            if (DUMP) await dump('*** =2.1');
        });

        it(`should switch to "(Main) ICO" at "icoOpeningTime" if ${allIcoLimitMio}M tokens unsold`, async () => {
            await increaseTimeTo(icoOpeningTime + tenSeconds);
            await callCreate({value: OneWei});

            await checkPhase(params.icoPhases.mainIco);
            if (DUMP) await dump('*** =2.2');
        });

        it(`should NOT switch before "icoOpeningTime" if ${allIcoLimitMio}M tokens unsold`, async () => {
            await increaseTimeTo(icoOpeningTime - tenSeconds);
            await callCreate({value: OneWei});

            await checkPhase(params.icoPhases.preIcoB);
            if (DUMP) await dump('*** =2.3');
        });

    });

    describe('(Main) ICO Phase', async () => {

        beforeEach(async () => {
            // switch to Main ICO Phase
            await increaseTimeTo(icoOpeningTime + tenSeconds);
            await callCreate(OneWei);

            await checkPhase(params.icoPhases.mainIco);
            if (DUMP) await dump('*** >3.x');
        });


        it(`should switch to "After ICO" if ${allIcoLimitMio}M tokens sold out before "icoClosingTime"`, async () =>  {
            await callCreate({from: buyer, value: params.maxPreIcoBPhaseWei + params.maxIcoPhaseWei + OneEth});
            await checkPhase(params.icoPhases.afterIco);
            if (DUMP) await dump('*** =3.1');
        });

        it(`should NOT switch before "icoClosingTime" if ${allIcoLimitMio}M tokens unsold`, async () =>  {
            await increaseTimeTo(icoClosingTime - tenSeconds);
            await callCreate({value: OneWei});

            await checkPhase(params.icoPhases.mainIco);
            if (DUMP) await dump('*** =3.2');
        });

        it(`should switch to "After ICO" at "icoClosingTime" if ${allIcoLimitMio}M tokens unsold`, async () => {
            await increaseTimeTo(icoClosingTime + tenSeconds);
            await callCreate({value: OneWei});

            await checkPhase(params.icoPhases.afterIco);
            if (DUMP) await dump('*** =3.3');
        });
    });

    describe('After-ICO Phase', async () => {

        beforeEach(async () => {
            if (DUMP) await dump('*** >4.x');
        });

        it(`should never end if ${allIcoLimitMio}M tokens sold out`, async () =>  {
            const allTokensWeiAtMainIcoRate = params.tokenQtyLimits.total
                .divToInt(params.tokenRates.mainIco.total)
                .add(OneEth);

            await increaseTimeTo(icoOpeningTime + tenSeconds);
            await callCreate({from: stranger, value: allTokensWeiAtMainIcoRate});
            await checkPhase(params.icoPhases.afterIco);

            await expectThrows(callCreate({from: stranger, value: OneWei}));
            await checkPhase(params.icoPhases.afterIco);

            await increaseTimeTo(icoClosingTime + tenSeconds);
            await expectThrows(callCreate({from: stranger, value: OneWei}));
            await checkPhase(params.icoPhases.afterIco);
            if (DUMP) await dump('*** =4.1');
        });

        it('should never end after "icoClosingTime"', async () =>  {
            await increaseTimeTo(icoClosingTime + tenSeconds);
            callCreate({value: OneEth});
            await checkPhase(params.icoPhases.afterIco);

            await increaseTimeTo(icoClosingTime + tenSeconds*6);
            await expectThrows(callCreate({value: OneWei}));
            await checkPhase(params.icoPhases.afterIco);

            if (DUMP) await dump('*** =4.2');
        });

    });

    async function checkPhase(expectedPhase) {
        let phase = await token.phase.call();
        let actualPhase = (typeof phase === 'number') ? phase : phase.toNumber();
        assert.equal(actualPhase, expectedPhase);
    }

    async function callCreate({from = buyer, value = OneWei}) {
        await token.create({from, value});
    }

});
