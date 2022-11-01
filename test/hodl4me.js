const { assert } = require("console");

const Hodl4me = artifacts.require('Hodl4me');

contract('Hodl4me', (accounts) => {
    let hodl4me;
    beforeEach(async () => {
        hodl4me = await hodl4me.new();
    });

    it('Should return releaseAll as false', async () => {
        const releaseAll = await hodl4me.releaseAll();
        console.log(releaseAll);
        assert(releaseAll === false);
    });

});