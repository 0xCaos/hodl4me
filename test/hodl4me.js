const Hodl4me = artifacts.require('Hodl4me');
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Hodl4me', (accounts) => {
    let hodl4me;
    let nullAddress = '0x0000000000000000000000000000000000000000';
    beforeEach(async () => {
        hodl4me = await Hodl4me.new();
    });

    it('Should return releaseAll as false', async () => {
        const releaseAll = await hodl4me.releaseAll();
        console.log(releaseAll);
        assert(releaseAll === false);
    });

    it('Happy path: Toggle releaseAll, should return as true now', async () => {
        await hodl4me.toggleReleaseAll();
        const releaseAll = await hodl4me.releaseAll();
        console.log(releaseAll);
        assert(releaseAll === true);
    });

    it('Unhappy path: Calling toggleReleaseAll with unauthorised wallet', async () => {
        await expectRevert(
            hodl4me.toggleReleaseAll({from: accounts[1]}),
                'Ownable: caller is not the owner'
        );
    });
 
    it('Unhappy path: User creating Ether HODL Bank but not sending Ether', async () => {
        await expectRevert(
            hodl4me.hodlDeposit(accounts[0], nullAddress, 0, 1698965928),
                "Ether amount can't be zero"
        );
    });

    it('Unhappy path: User created Ether HODL Bank with 10 Ether but Unix timestamp is in the past', async () => {
        await expectRevert(
            hodl4me.hodlDeposit(accounts[0], nullAddress, 0, 0, {value: 10}),
                "Unlock time needs to be in the future"
        );
    });

    it('User created Ether HODL Bank with 10 Ether', async () => {
        await hodl4me.hodlDeposit(accounts[0], nullAddress, 0, 1698965928, {value: 10});
        const resulting = await hodl4me.getHodlBankInfo(accounts[0], 0);
        console.log(resulting);
    });

});