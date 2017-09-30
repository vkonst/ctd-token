import expectThrows from './lib/zeppelin-solidity/test/helpers/expectThrows';
const Ownable = artifacts.require('../contracts/UmuToken.sol');

contract('Ownable', (accounts) => {
    let ownable;

    let owner = accounts[0];
    let newOwner = accounts[1];
    let stranger = accounts[2];

    beforeEach(async () => {
        const tenSeconds = 10;
        const timeNow = parseInt(new Date() / 1000);
        const preIcoOpeningTime = timeNow + tenSeconds;
        ownable = await Ownable.new(preIcoOpeningTime);
    });

    describe('construction', async () => {
        it('should have an owner', async () => {
            assert.equal(await ownable.owner(), owner);
        });
    });

    describe('transferOwnership()', async () => {

        it('should assign the new owner being called by the old owner', async () => {
            await ownable.transferOwnership(newOwner, {from: owner});
            assert.equal(await ownable.owner(), newOwner);
        });

        it('should not allow changing the owner to non-owners', async () => {
            assert((await ownable.owner()) != stranger);
            await expectThrows(ownable.transferOwnership(newOwner, {from: stranger}));
        });

        it('should not allow changing the owner to null or 0 address', async () => {
            await expectThrows(ownable.transferOwnership(null, {from: owner}));
            await expectThrows(ownable.transferOwnership(0, {from: owner}));

            assert.equal(owner, await ownable.owner());
        });

        it('should emit Ownable on succesful transfer', async () => {
            let result = await ownable.transferOwnership(newOwner);

            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'OwnershipTransferred');
            assert.equal(event.args.previousOwner, owner);
            assert.equal(event.args.newOwner, newOwner);
        });
    });
});
