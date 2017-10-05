import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';

/*global artifacts, assert, beforeEach, afterEach*/

const UmuTokenMock = artifacts.require('./helpers/UmuTokenMock.sol');

contract('UmuToken is StandardToken', (accounts) => {
    let token;

    let owner = accounts[0];
    let transferor = accounts[1];
    let transferee = accounts[2];

    const tokensOnSale = 100;

    beforeEach(async () => {
        const tenSeconds = 10;
        const timeNow = await latestTime();
        const preIcoOpeningTime = timeNow + tenSeconds;
        token = await UmuTokenMock.new(preIcoOpeningTime);
        await token.simulateNewTokens(transferor, tokensOnSale);

        assert.equal((await token.getTokenBalanceOf(transferor)).toNumber(), tokensOnSale);
    });

    describe('totalSupply', async () => {
        it('should return the correct totalSupply', async function() {
            assert.equal((await token.totalSupply()).toNumber(), tokensOnSale);
        });
    });

    describe('balanceOf(_owner)', async () => {
        it('should return the correct balances', async function() {
            assert.equal((await token.balanceOf(transferor)).toNumber(), tokensOnSale);
            assert.equal((await token.balanceOf(transferee)).toNumber(), 0);
        });
    });

    describe('transfer(_to, _value)', async () => {

        it('should transfer tokens within the balance', async function() {
            let balance = (await token.balanceOf(transferor)).toNumber();
            await token.transfer(transferee, balance - 1, {from: transferor});

            assert.equal((await token.balanceOf(transferor)).toNumber(), 1);
        });

        it('should throw an error when trying to transfer more than the balance', async function() {
            let balance = (await token.balanceOf(transferor)).toNumber();
            await expectThrows(token.transfer(transferee, balance + 1, {from: transferor}));
        });

        it('should throw an error when trying to transfer to null or 0 address', async function() {
            let balance = (await token.balanceOf(transferor)).toNumber();

            await expectThrows(token.transfer(0, balance - 1, {from: transferor}));
            await expectThrows(token.transfer(null, balance - 1, {from: transferor}));
        });

        describe('when trying to transfer 0 tokens ...', async () => {

            it('should NOT throw an error', async function() {
                await token.transfer(transferee, 0, {from: transferor});
                await token.transfer(transferee, null, {from: transferor});
            });

            it('should NOT change balances', async function() {
                let balanceFrom = (await token.balanceOf(transferor)).toNumber();
                let balanceTo = (await token.balanceOf(transferee)).toNumber();

                assert.equal(balanceFrom, tokensOnSale);
                assert.equal(balanceTo, 0);
            });

        });

        describe('on successful transfer ...', async () => {
            let result, tx, balanceBefore, paidTokens;
            const unpaidTokens = 3;

            beforeEach(async () => {
                balanceBefore = (await token.balanceOf(transferor)).toNumber();
                paidTokens = balanceBefore - unpaidTokens;
                // get result without writing to the network state
                result = await token.transfer.call(transferee, paidTokens, {from: transferor});
                // write to the network state
                tx = await token.transfer(transferee, paidTokens, {from: transferor});
            });


            it('should return true', async function() {
                assert(result);
            });

            it('should decrease the balance of the transferor', async function() {
                let balance = (await token.balanceOf(transferor)).toNumber();
                assert.equal(balance, unpaidTokens)
            });

            it('should increase the balance of the transferee', async function() {
                let balance = (await token.balanceOf(transferee)).toNumber();
                assert.equal(balance, paidTokens);
            });

            it('should emit event Transfer(indexed from, indexed to, value)', async function() {
                assert.lengthOf(tx.logs, 1);
                let event = tx.logs[0];

                assert.equal(event.event, 'Transfer');
                assert.equal(event.args.from, transferor);
                assert.equal(event.args.to, transferee);
                assert.equal(event.args.value.toNumber(), paidTokens);
            });

        });

    });

    describe('transferFrom(_from, _to, _value)', async () => {
        const unpaidTokens = 7;
        const payableTokens = tokensOnSale - unpaidTokens;

        describe('providing the allowance to the transferee is NOT enough ...', async () => {

            it('... should throw an error', async function() {
                await token.decreaseApproval(transferee, 1, {from: transferor});
                await expectThrows(token.transferFrom(transferor, transferee, payableTokens, {from: transferee}));
            });

        });

        describe('providing the allowance to the transferee is enough ...', async () => {

            beforeEach(async () => {
                await token.approve(transferee, payableTokens, {from: transferor});
                let allowance = await token.getTokenAllowance(transferor, transferee);
                assert.equal(allowance.toNumber(), payableTokens);
            });

            describe('... but the transferor\'s balance is NOT enough ...', async () => {

                it('... should throw an error', async function() {
                    await await token.transfer(transferee, unpaidTokens + 1, {from: transferor});
                    await expectThrows(token.transferFrom(transferor, transferee, payableTokens, {from: transferee}));
                });

            });

            describe('... if the transferor\'s balance is enough ...', async () => {

                describe('... but is called by the anybody else except transferee ...', async () => {
                    it('... should throw an error', async function() {
                        await expectThrows(token.transferFrom(transferor, transferee, payableTokens, {from: owner}));
                    });
                });

                describe('... and is called by the transferee ...', async () => {
                    let result, tx;

                    beforeEach(async () => {
                        result = await token.transferFrom.call(
                            transferor, transferee, payableTokens, {from: transferee}
                        );
                        tx = await token.transferFrom(
                            transferor, transferee, payableTokens, {from: transferee}
                        );
                    });

                    it('... should return true', async function() {
                        assert(result);
                    });

                    it('... should decrease the balance of the transferor', async function() {
                        let balance = (await token.balanceOf(transferor)).toNumber();
                        assert.equal(balance, unpaidTokens)
                    });

                    it('... should increase the balance of the transferee', async function() {
                        let balance = (await token.balanceOf(transferee)).toNumber();
                        assert.equal(balance, payableTokens);
                    });

                    it('... should emit event Transfer(indexed from, indexed to, value)', async function() {
                        assert.lengthOf(tx.logs, 1);
                        let event = tx.logs[0];

                        assert.equal(event.event, 'Transfer');
                        assert.equal(event.args.from, transferor);
                        assert.equal(event.args.to, transferee);
                        assert.equal(event.args.value.toNumber(), payableTokens);
                    });

                    it('... should throw an error if _to address is null or 0', async function() {
                        await expectThrows(token.transferFrom(0, transferee, payableTokens, {from: transferee}));
                        await expectThrows(token.transferFrom(null, transferee, payableTokens, {from: transferee}));
                    });

                });

            });

        });

    });

    describe('approve(_spender, _value)', async () => {
        const payableTokens = tokensOnSale - 1;

        it('should set the correct allowance and return true', async () => {
            let result = await token.approve.call(transferee, payableTokens, {from: transferor});
            await token.approve(transferee, payableTokens, {from: transferor});
            let allowance = await token.getTokenAllowance(transferor, transferee);
            assert(result);
            assert.equal(allowance.toNumber(), payableTokens);
        });

        it('should emit event Approval(indexed owner, indexed spender, value)', async () => {
            let tx = await token.approve(transferee, payableTokens, {from: transferor});
            assert.lengthOf(tx.logs, 1);
            let event = tx.logs[0];
            assert.equal(event.event, 'Approval');
            assert.equal(event.args.owner, transferor);
            assert.equal(event.args.spender, transferee);
            assert.equal(event.args.value.toNumber(), payableTokens);
        });
    });

    describe('allowance(_owner, _spender)', async () => {
        const payableTokens = tokensOnSale - 2;

        it('should return zero allowance before approval', async () => {
            let allowance = await token.allowance(transferor, transferee);
            assert.equal(allowance, 0);
        });

        it('should return the correct allowance after approval', async function() {
            await token.approve(transferee, payableTokens, {from: transferor});

            let allowance = await token.allowance(transferor, transferee);
            assert.equal(allowance.toNumber(), payableTokens);
        });
    });

    describe('increaseApproval(_spender, _addedValue)', async () => {
        let result, tx;
        const payableTokens = tokensOnSale - 5;
        const extraTokens = 4;

        beforeEach(async () => {
            await token.approve(transferee, payableTokens, {from: transferor});
            let allowance = await token.getTokenAllowance(transferor, transferee);
            result = await token.increaseApproval.call(transferee, extraTokens, {from: transferor});
            tx = await token.increaseApproval(transferee, extraTokens, {from: transferor});
            assert.equal(allowance.toNumber(), payableTokens);
        });

        it('should increase allowance and return true', async () => {
            let allowance = await token.getTokenAllowance(transferor, transferee);
            assert(result);
            assert.equal(allowance.toNumber(), payableTokens + extraTokens);
        });

        it('should emit event Approval(indexed owner, indexed spender, value)', async () => {
            assert.lengthOf(tx.logs, 1);
            let event = tx.logs[0];
            assert.equal(event.event, 'Approval');
            assert.equal(event.args.owner, transferor);
            assert.equal(event.args.spender, transferee);
            assert.equal(event.args.value.toNumber(), payableTokens + extraTokens);
        });

    });

    describe('decreaseApproval(_spender, _subtractedValue)', async () => {
        let result, tx;
        const payableTokens = tokensOnSale - 5;
        const extraTokens = 4;

        beforeEach(async () => {
            await token.approve(transferee, payableTokens, {from: transferor});
            let allowance = await token.getTokenAllowance(transferor, transferee);
            result = await token.decreaseApproval.call(transferee, extraTokens, {from: transferor});
            tx = await token.decreaseApproval(transferee, extraTokens, {from: transferor});

            assert.equal(allowance.toNumber(), payableTokens);
        });

        it('should decrease allowance and return true', async () => {
            let allowance = await token.getTokenAllowance(transferor, transferee);

            assert(result);
            assert.equal(allowance.toNumber(), payableTokens - extraTokens);
        });

        it('should set allowance to 0 if decrease exceeds available amount', async () => {
            await token.decreaseApproval(transferee, payableTokens - extraTokens + 1, {from: transferor});
            let allowance = await token.getTokenAllowance(transferor, transferee);

            assert.equal(allowance.toNumber(), 0);
        });

        it('should emit event Approval(indexed owner, indexed spender, value)', async () => {
            assert.lengthOf(tx.logs, 1);
            let event = tx.logs[0];

            assert.equal(event.event, 'Approval');
            assert.equal(event.args.owner, transferor);
            assert.equal(event.args.spender, transferee);
            assert.equal(event.args.value.toNumber(), payableTokens - extraTokens);
        });

    });

    describe('transactions sequence', async () => {

        it('should increase allowance by 50 then decrease by 10', async () => {
            let preApproved = await token.getTokenAllowance(transferor, transferee);

            await token.increaseApproval(transferee, 50, {from: transferor});
            let postIncrease = await token.allowance(transferor, transferee);

            await token.decreaseApproval(transferee, 10, {from: transferor});
            let postDecrease = await token.allowance(transferor, transferee);

            assert.equal(preApproved + 50, postIncrease.toNumber());
            assert.equal(postIncrease - 10, postDecrease.toNumber());
        })
    });

});
