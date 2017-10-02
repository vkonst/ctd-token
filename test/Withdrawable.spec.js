import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';


//  c(drawer, weiAmount) // returns bool
//  withdraw() // returns bool

const Withdrawable = artifacts.require('./helpers/UmuTokenMock.sol');


contract('Ownable', (accounts) => {
    let withdrawable;

    let owner = accounts[0];
    let drawer = accounts[1];
    let stranger = accounts[2];

    let amount = 17 * 1e18;

    beforeEach(async () => {
        const tenSeconds = 10;
        const timeNow = await latestTime();
        const preIcoOpeningTime = timeNow + tenSeconds;
        withdrawable = await Withdrawable.new(preIcoOpeningTime);
    });

    describe('withdrawal()', async () => {

        it("can NOT be called externally", async function () {
            assert.isUndefined(withdrawable.withdrawal);
        });

        it('should not allow adding balances to null or 0 address', async () => {
            let result = await withdrawable.testFnWithdrawal.call(null, amount);
            assert.equal(result, false);

            result = await withdrawable.testFnWithdrawal.call(0, amount);
            assert.equal(result, false);
        });

        it('should allow adding balance to a valid address', async () => {
            let result = await withdrawable.testFnWithdrawal.call(drawer, amount);
            assert.equal(result, true);
        });

        // FIXME: make it green
        xit('should allow adding balances to multiple valid addresses', async () => {
            let resultA = await withdrawable.testFnWithdrawal.call(drawer, amount);
            let resultB = await withdrawable.testFnWithdrawal.call(stranger, amount);

            let actAmountA = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});
            let actAmountB = await withdrawable.testPendingWithdrawalAmount.call({from: stranger});

            assert.equal(resultA, true);
            assert.equal(resultB, true);
            assert.equal(actAmountA.toNumber(), amount);
            assert.equal(actAmountB.toNumber(), amount);
        });

        describe('on successful adding the balance ...', async () => {
            let result, event;

            beforeEach(async () => {
                result = await withdrawable.testFnWithdrawal(drawer, amount);
                assert.lengthOf(result.logs, 1);
                event = result.logs[0];
                let actAmount = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});
                assert.equal(actAmount.toNumber(), amount);
            });

            it('... should emit Withdrawal event', async () => {
                assert.equal(event.event, 'Withdrawal');
                // assert.equal(event.args.drawer, drawer);
                assert.equal(event.args.weiAmount.toNumber(), amount);
            });

            it('... should allow adding balance again', async () => {
                let result = await withdrawable.testFnWithdrawal(drawer, 100);
                let actAmount = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});
                assert.equal(actAmount.toNumber(), amount + 100);
            });

        });

    });

    // FIXME: add tests for withdraw()
    describe('withdraw()', async () => {

        describe('... before balance is added', async () => {

            it('... should throw if called by the owner', async () => {
                await expectThrows(withdrawable.withdraw.call({from: owner}));
            });

            it('... should throw if called by non-owners', async () => {
                await expectThrows(withdrawable.withdraw.call({from: stranger}));
            });

        });

        describe('... after balance is successfully added to a drawer', async () => {
            let result, event;

            beforeEach(async () => {
                result = await withdrawable.testFnWithdrawal(drawer, amount);
                let actAmount = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});
                assert.equal(actAmount.toNumber(), amount);
            });

            it('... should throw if called by the owner', async () => {
                await expectThrows(withdrawable.withdraw.call({from: owner}));
            });

            it('... should throw if called by non-owners', async () => {
                await expectThrows(withdrawable.withdraw.call({from: stranger}));
            });

            // FIXME: make the code follow the description
            it('... should NOT throw if called by the drawer', async () => {
                let actAmount = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});
                assert.equal(actAmount.toNumber(), amount);
            });

        });

    });

});
