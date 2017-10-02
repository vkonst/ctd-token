import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';

const Withdrawable = artifacts.require('./helpers/UmuTokenMock.sol');

contract('Withdrawable', (accounts) => {
    let withdrawable;

    let owner = accounts[0];
    let drawer = accounts[1];
    let stranger = accounts[2];

    const amount = 17 * 1e18;
    const contractOpeningBalance = amount * 3;

    beforeEach(async () => {
        const tenSeconds = 10;
        const timeNow = await latestTime();
        const preIcoOpeningTime = timeNow + tenSeconds;
        withdrawable = await Withdrawable.new(preIcoOpeningTime, {value: contractOpeningBalance});
        await checkContractBalance();
    });

    describe('withdrawal()', async () => {

        it("can NOT be called externally", async function () {
            assert.isUndefined(withdrawable.withdrawal);
        });

        it('should not add balances to null or 0 address', async () => {
            // get function result without updating the network state
            let resultA = await withdrawable.testFnWithdrawal.call(null, amount);
            let resultB = await withdrawable.testFnWithdrawal.call(0, amount);
            // update the network state
            await withdrawable.testFnWithdrawal(null, amount);
            await withdrawable.testFnWithdrawal(0, amount);
            // obtain the updated state
            let actAmountA = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});
            let actAmountB = await withdrawable.testPendingWithdrawalAmount.call({from: stranger});

            assert.equal(resultA, false);
            assert.equal(resultB, false);
            assert.equal(actAmountA.toNumber(), 0);
            assert.equal(actAmountB.toNumber(), 0);
        });

        it('should add adding balance to a valid address', async () => {
            // get function result without updating the network state
            let result = await withdrawable.testFnWithdrawal.call(drawer, amount);
            // update the network state
            await withdrawable.testFnWithdrawal(drawer, amount);
            // obtain the updated state
            let actAmount = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});

            assert.equal(result, true);
            assert.equal(actAmount.toNumber(), amount);
        });

        it('should add balances to multiple valid addresses', async () => {
            // get function result without updating the network state
            let resultA = await withdrawable.testFnWithdrawal.call(drawer, amount);
            let resultB = await withdrawable.testFnWithdrawal.call(stranger, amount);
            // update the network state
            await withdrawable.testFnWithdrawal(drawer, amount);
            await withdrawable.testFnWithdrawal(stranger, amount);
            // obtain the updated state
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
                await withdrawable.testFnWithdrawal(drawer, 100);
                let actAmount = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});
                assert.equal(actAmount.toNumber(), amount + 100);
            });

        });

    });

    describe('withdraw()', async () => {

        describe('before balance is added ...', async () => {

            it('... should throw if called by the owner', async () => {
                await expectThrows(withdrawable.withdraw.call({from: owner}));
                await checkContractBalance();
            });

            it('... should throw if called by non-owners', async () => {
                await expectThrows(withdrawable.withdraw.call({from: stranger}));
                await checkContractBalance();
            });

        });

        describe('after balance is successfully added to a drawer ...', async () => {
            let result, pendingAmount;

            beforeEach(async () => {
                result = await withdrawable.testFnWithdrawal(drawer, amount);
                pendingAmount = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});

                assert.equal(pendingAmount.toNumber(), amount);
            });

            it('... should throw if called by the owner', async () => {
                await expectThrows(withdrawable.withdraw.call({from: owner}));
                await checkContractBalance();
            });

            it('... should throw if called by non-owners', async () => {
                await expectThrows(withdrawable.withdraw.call({from: stranger}));
                await checkContractBalance();
            });

            it('... should send ETH balance to the drawer at the his (her) call', async () => {
                let oldWeiBalance = await withdrawable.getBalanceAt.call(drawer, {from: drawer});
                let result =  await withdrawable.withdraw.call({from: drawer});
                await withdrawable.withdraw({from: drawer});
                let newWeiBalance = await withdrawable.getBalanceAt.call(drawer, {from: drawer});
                let weiReceived = newWeiBalance.sub(oldWeiBalance);

                assert.equal(result, true);
                assert(Math.abs(weiReceived.toNumber() - amount)  < 1e16);
            });

            describe('sending ETH balance to the drawer ...', async () => {
                let result, newPendingAmount;

                beforeEach(async () => {
                    result = await withdrawable.withdraw({from: drawer});
                });

                it('... should set the pending amount to 0', async () => {
                    newPendingAmount = await withdrawable.testPendingWithdrawalAmount.call({from: drawer});
                    assert.equal(newPendingAmount.toNumber(), 0);
                });

                it('... should decrease the contract ETH balance by the paid amount', async () => {
                    await checkContractBalance(contractOpeningBalance - amount);
                });

                it('... should emit Withdraw event', async () => {
                    let event = result.logs[0];
                    assert.equal(event.event, 'Withdraw');
                    assert.equal(event.args.drawer, drawer);
                    assert.equal(event.args.weiAmount.toNumber(), amount);
                });

            });

        });

    });

    async function checkContractBalance(expectedWei) {
        if (!expectedWei) expectedWei = contractOpeningBalance;
        let balance = await withdrawable.getBalance.call();
        assert(balance.toNumber(), expectedWei);
    }

});
