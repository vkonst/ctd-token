import latestTime from './lib/zeppelin-solidity/test/helpers/latestTime';
import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
import {DUMP, dumper} from "./helpers/CtdToken.utils";

/*global artifacts, assert, before, beforeEach, afterEach, web3*/

const CtdTokenMock = artifacts.require('./helpers/CtdTokenMock.sol');
const UpgradeAgentMock = artifacts.require('./helpers/UpgradeAgentMock.sol');

const BigNumber = web3.BigNumber;

contract('CtdToken is Upgradable', (accounts) => {
    let token, agent, preIcoOpeningTime;
    let dump;

    const oneToken = new BigNumber("1e+18");

    const owner = accounts[0];
    const buyer = accounts[1];
    const bounty = accounts[3];
    const master = accounts[4];

    const balances = {
        buyer:  new BigNumber("500e24"),
        owner:  new BigNumber("100e24"),
        bounty: new BigNumber("10e24")
    };
    balances.total = balances.buyer
        .add(balances.owner)
        .add(balances.bounty);

    const revision = 324;

    beforeEach(async () => {
        const tenSeconds = 10;
        const timeNow = await latestTime();
        preIcoOpeningTime = timeNow + tenSeconds;

        token = await CtdTokenMock.new(preIcoOpeningTime);
        // await token.setPauseMaster(master);

        agent = await UpgradeAgentMock.new(revision, balances.total.toString());

        await setBalances();

        if (DUMP) {
            dump = await dumper(token, {owner, buyer, bounty});
        }

    });

    describe('setUpgradeMaster()', async () => {

        it('should assign the upgrade master being called by the owner', async () => {
            await setUpgradeMaster();
        });

        it('should throw error if called by non-owners', async () => {
            assert(owner != buyer);
            await expectThrows(token.setUpgradeMaster(master, {from: buyer}));
        });

        it('should throw error if called with null or 0 address', async () => {
            await expectThrows(token.setUpgradeMaster(null, {from: owner}));
            await expectThrows(token.setUpgradeMaster(0, {from: owner}));
        });

    });

    describe('setUpgradeAgent()', async () => {

        beforeEach(async () => {
           await setUpgradeMaster();
        });

        it('should throw error if called by owners', async () => {
            assert(owner != master);
            await expectThrows(token.setUpgradeAgent(agent.address, revision, {from: owner}));
        });

        it('should throw error if called by non-owners', async () => {
            assert(buyer != master);
            await expectThrows(token.setUpgradeAgent(agent.address, revision, {from: buyer}));
        });

        describe('if called by the upgrade master...', async () => {

            it('... should throw error if invalid revision provided', async () => {
                await expectThrows(token.setUpgradeAgent(agent.address, revision - 1, {from: master}));
            });

            it('... should throw error if the agent provides invalid revision', async () => {
                let invalidAgent = await UpgradeAgentMock.new(revision - 1, balances.total.toString());
                await expectThrows(token.setUpgradeAgent(invalidAgent.address, revision, {from: master}));
            });

            it('... should throw error if the agent provides invalid total supply', async () => {
                let invalidAgent = await UpgradeAgentMock.new(revision, balances.total.sub(1).toString());
                await expectThrows(token.setUpgradeAgent(invalidAgent.address, revision, {from: master}));
            });

            it('... should set the agent if it provides correct revision and total supply', async () => {
                await setValidAgent();
            });


            it('... should allow setting the agent once only', async () => {
                await setValidAgent();
                let anotherAgent = await UpgradeAgentMock.new(revision, balances.total.toString());
                await expectThrows(token.setUpgradeAgent(anotherAgent.address, revision, {from: master}));
            });

        });

    });

    describe('upgrade()', async () => {

        beforeEach(async () => {
            await setUpgradeMaster();
        });

        it('should throw error if called by the owner before the agent is set', async () => {
            await expectThrows(token.upgrade(oneToken.toString(), {from: owner}));
        });

        it('should throw error if called by the buyer before the agent is set', async () => {
            await expectThrows(token.upgrade(oneToken.toString(), {from: buyer}));
        });

        it('should throw error if called by the buyer before the agent is set', async () => {
            await expectThrows(token.upgrade(oneToken.toString(), {from: buyer}));
        });

        it('should NOT throw error if called by the buyer after the agent is set', async () => {
            await setValidAgent();
            let tx = await token.upgrade(oneToken.toString(), {from: buyer});
            assert(!!tx);
        });

    });

    describe('upgrade() called after the agent is correctly set', async () => {
        let dumped;

        beforeEach(async () => {
            await setUpgradeMaster();
            await setValidAgent();

            if (DUMP && !dumped) await dump('*** >1');

            await token.upgrade(oneToken.toString(), {from: buyer});

            if (DUMP && !dumped) {
                dumped = true;
                await dump('*** =1');
            }
        });

        it('should decrease balance of the holder on the contract being upgraded from', async () => {
            let actual = await token.balanceOf.call(buyer);
            let expected = balances.buyer.sub(oneToken);
            assert(actual.equals(expected));
        });

        it('should decrease totalSupply of the contract being upgraded from', async () => {
            let actual = await token.totalSupply.call();
            let expected = balances.total.sub(oneToken);
            assert(actual.equals(expected));
        });

        it('should increase totalUpgraded of the contract being upgraded from', async () => {
            let actual = await token.totalUpgraded.call();
            let expected = oneToken;
            assert(actual.equals(expected));
        });

        it('should increase balance of the holder on the contract being upgraded to', async () => {
            let actual = await agent.balanceOf.call(buyer);
            let expected = oneToken;
            assert(actual.equals(expected));
        });

        it('should throw error if called by non-holders', async () => {
            await expectThrows(token.upgrade(oneToken.toString(), {from: master}));
        });

        it('should set the balance of the holder on the old contract to 0 if all tokens upgraded', async () => {
            await token.upgrade(balances.buyer.sub(oneToken).toString(), {from: buyer});
            let actual = await token.balanceOf.call(buyer);
            let expected = 0;
            if (DUMP) await dump('*** =2');
            assert(actual.equals(expected));
        });

        it('should throw error on upgarding more tokens then the balance is', async () => {
            await expectThrows(token.upgrade(balances.buyer.add(oneToken).toString(), {from: buyer}));
        });

        it('should set totalSupply to 0 when tokens of all holders upgraded', async () => {
            await token.upgrade(balances.buyer.sub(oneToken).toString(), {from: buyer});
            await token.upgrade(balances.owner.toString(), {from: owner});
            await token.upgrade(balances.bounty.toString(), {from: bounty});
            let actual = await token.totalSupply.call();
            let expected = 0;
            assert(actual.equals(expected));
        });

        it('should set totalUpgraded to the original supply when tokens of all holders upgraded', async () => {
            await token.upgrade(balances.buyer.sub(oneToken).toString(), {from: buyer});
            await token.upgrade(balances.owner.toString(), {from: owner});
            await token.upgrade(balances.bounty.toString(), {from: bounty});
            let actual = await token.totalUpgraded.call();
            let expected = balances.total;
            assert(actual.equals(expected));
        });

        it('should throw errow if called when tokens of all holders upgraded', async () => {
            await token.upgrade(balances.buyer.sub(oneToken).toString(), {from: buyer});
            await token.upgrade(balances.owner.toString(), {from: owner});
            await token.upgrade(balances.bounty.toString(), {from: bounty});
            await expectThrows(token.upgrade(oneToken.toString(), {from: buyer}));
        });

    });


    async function setBalances() {
        await token.simulateNewTokens(buyer, balances.buyer);
        await token.simulateNewTokens(owner, balances.owner);
        await token.simulateNewTokens(bounty, balances.bounty);
    }

    async function setUpgradeMaster() {
        await token.setUpgradeMaster(master, {from: owner});
        assert.equal(await token.upgradeMaster(), master);
    }

    async function setValidAgent() {
        await token.setUpgradeAgent(agent.address, revision, {from: master});
        assert.equal(await token.upgradeAgent.call(), agent.address);
    }
});
