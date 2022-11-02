const Hodl4me = artifacts.require('Hodl4me');
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Hodl4me', (accounts) => {
    let hodl4me;
    beforeEach(async () => {
        hodl4me = await Hodl4me.new();
    });

    it('Should return releaseAll as false', async () => {
        const releaseAll = await hodl4me.releaseAll();
        console.log(releaseAll);
        assert(releaseAll === false);
    });

    it('Happy path: Toggle releaseAll, should return as true now', async () => {
        await hodl4me.allowWithdrawals();
        const releaseAll = await hodl4me.releaseAll();
        console.log(releaseAll);
        assert(releaseAll === true);
    });

    it('Unhappy path: Calling allowWithdrawals with unauthorised wallet', async () => {
        expectRevert(
            hodl4me.allowWithdrawals({from: accounts[0]}),
                'Ownable: caller is not the owner'
        );
    });
 
});