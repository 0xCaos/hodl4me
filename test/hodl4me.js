const Hodl4me = artifacts.require('Hodl4me');
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Hodl4me', (accounts) => {
    let hodl4me;
    let nullAddress = '0x0000000000000000000000000000000000000000';
    beforeEach(async () => {
        hodl4me = await Hodl4me.new();
    });

    /** 
     * Happy path: Checking if releaseAll() function returns the expected boolean 
     * value after deployment (false)
     */ 
    it('Should return releaseAll as false', async () => {
        const releaseAll = await hodl4me.releaseAll();
        assert(releaseAll === false);
    });

    /** 
     * Happy path: Using toggleReleaseAll() function to toggle releaseAll to true
     */ 
    it('Happy path: Toggle releaseAll, should return as true now', async () => {
        await hodl4me.toggleReleaseAll();
        const releaseAll = await hodl4me.releaseAll();
        assert(releaseAll === true);
    });

    /** 
     * Unhappy path: Using toggleReleaseAll() function with an unauthorised wallet
     */ 
    it('Unhappy path: Calling toggleReleaseAll with unauthorised wallet', async () => {
        await expectRevert(
            hodl4me.toggleReleaseAll({from: accounts[1]}),
                'Ownable: caller is not the owner'
        );
    });
    
    /********************************
     * Testing hodlDeposit() function with Ether
     */

    /**
     * Unhappy path: User did not send Ether when creating and Ether HODL Bank
     */
    it('Unhappy path: User creating Ether HODL Bank but not sending Ether', async () => {
        await expectRevert(
            hodl4me.hodlDeposit(accounts[0], nullAddress, 0, 1698965928),
                "Ether amount can't be zero"
        );
    });

    /**
     * Unhappy path: User creating HODL bank with unlock Unix timestamp in the past
     */
    it('Unhappy path: User created Ether HODL Bank with 10 Ether but Unix timestamp is in the past', async () => {
        await expectRevert(
            hodl4me.hodlDeposit(accounts[0], nullAddress, 0, 0, {value: 10}),
                "Unlock time needs to be in the future"
        );
    });

    /**
     * Happy path: User creating HODL bank successfully
     */
    it('User created Ether HODL Bank with 10 Ether', async () => {
        const desiredHodlPeriod = 1698965928;
        let txHash;
        await hodl4me.hodlDeposit(accounts[0], nullAddress, 0, desiredHodlPeriod, {value: 10})
         .on('transactionHash', function(hash){ //retrieve txHash
            txHash = hash;
        });
        // Use txHash to retrieve tx blockNumber
        let txInfo = await web3.eth.getTransaction(txHash);
        // Use blockNumber to retrieve epoch
        let blockInfo = await web3.eth.getBlock(txInfo.blockNumber);

        const result = await hodl4me.getHodlBankInfo(accounts[0], 0);
        const {0: _hodlToken, 1: _tokenAmount, 2: _timeOfDeposit,
                3: _hodlPeriod, 4: _active} = result;
        assert(_hodlToken === nullAddress);
        assert(_tokenAmount.toNumber() === 10);
        assert(_timeOfDeposit.toNumber() === blockInfo.timestamp);
        assert(_hodlPeriod.toNumber() === desiredHodlPeriod);
        assert(_active === true);
    });

    /********************************
     * Testing hodlDeposit() function with ERC20 token
     */

    /**
     * Unhappy path: User creating HODL bank but hodlToken is not a valid contract address
     */
     it('Unhappy path: User creating HODL Bank with non-contract address', async () => {
        await expectRevert(
            hodl4me.hodlDeposit(accounts[0], accounts[1], 100, 1698965928),
                "Address needs to be a contract"
        );
    });
    
    /**
     * Unhappy path: User did not send Ether when creating and Ether HODL Bank
     */
    //require(_tokenAmount > 0, "Token amount can't be zero");

    /**
     * Happy path: User creating HODL bank successfully
     */
    
    /********************************
     * Testing hodlWithdrawal() function with HODL Banks containing Ether
     */

    /**
     * Unhappy path: User trying to withdraw from invalid HODL Bank 
     */

    /**
     * Unhappy path: User trying to withdraw from HODL Bank that's still locked
     */

    /**
     * Happy path: User successfully withdraws from Ether HODL Bank containing 10 Ether
     */

    /**
     * Unhappy path: User trying to withdraw from HODL Bank twice - Already withdrawn
     */

    /********************************
     * Testing hodlWithdrawal() function with HODL Banks containing ERC20 Token
     */

    /**
     * Unhappy path: User trying to withdraw from HODL Bank that's still locked
     */

    /**
     * Happy path: User successfully withdraws from Ether HODL Bank containing 10 Ether
     */

    /**
     * Unhappy path: User trying to withdraw from HODL Bank twice - Already withdrawn
     */

});