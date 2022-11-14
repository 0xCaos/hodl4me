const Hodl4me = artifacts.require('Hodl4me');
const Hodl4MeToken = artifacts.require('Hodl4MeToken');
const { web3 } = require('@openzeppelin/test-helpers/src/setup'); // Importing web3 library
const { expectRevert, time, snapshot, BN } = require('@openzeppelin/test-helpers');
const { current } = require('@openzeppelin/test-helpers/src/balance');

contract('Hodl4me', (accounts) => {
    let hodl4me, hodl4MeToken;
    let nullAddress = '0x0000000000000000000000000000000000000000';
    beforeEach(async () => {
        hodl4me = await Hodl4me.new();
        hodl4MeToken = await Hodl4MeToken.new();
    });

    /** 
     * Happy path: Checking if releaseAll() function returns the expected boolean 
     * value after deployment (false)
     */ 
    it('Should return releaseAll as false', async () => {
        const releaseAll = await hodl4me.releaseAll();
        console.log((await hodl4MeToken.balanceOf(accounts[0])).toString());
        
        assert(releaseAll === false);
    });

    /** 
     * Happy path: Using toggleReleaseAll() function to toggle releaseAll to true
     */ 
    it('Toggle releaseAll, should return as true now', async () => {
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
        const desiredHodlPeriod = 1698965928; // Some time in 2023
        let txHash;
        await hodl4me.hodlDeposit(accounts[0], nullAddress, 0, desiredHodlPeriod, {value: web3.utils.toWei('10', "ether")})
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
        assert(web3.utils.fromWei(_tokenAmount).toString() === '10');
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
        const desiredHodlPeriod = 1698965928; // Some time in 2023
        await expectRevert(            
            hodl4me.hodlDeposit(accounts[0], accounts[1], 100, desiredHodlPeriod),
                "Address needs to be a contract"
        );
    });
    
    /**
     * Unhappy path: User did not send ERC20 Tokens when creating an ERC20 HODL Bank
     */
    it('Unhappy path: User creating ERC20 HODL Bank but not sending Tokens', async () => {
        let holdTokenAddress = (await hodl4MeToken.address).toString();
        await expectRevert(
            hodl4me.hodlDeposit(accounts[0], holdTokenAddress, 0, 1698965928),
                "Token amount can't be zero"
        );
    });

    /**
     * Happy path: User creating ERC20 Token HODL bank successfully
     */
     it('User created Ether HODL Bank with 10 Ether', async () => {
        const desiredHodlPeriod = 1698965928; // Some time in 2023
        let holdTokenAddress = (await hodl4MeToken.address).toString();
        let txHash;
        await hodl4me.hodlDeposit(accounts[0], holdTokenAddress, web3.utils.toWei('100', "ether"), desiredHodlPeriod)
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
        assert(_hodlToken.toString() === holdTokenAddress);
        assert(web3.utils.fromWei(_tokenAmount).toString() === '100');
        assert(_timeOfDeposit.toNumber() === blockInfo.timestamp);
        assert(_hodlPeriod.toNumber() === desiredHodlPeriod);
        assert(_active === true);
    });

    /********************************
     * Testing hodlWithdrawal() function with HODL Bank containing Ether
     */

    /**
     * Unhappy path: User trying to withdraw from invalid HODL Bank 
     */
    it('Unhappy path: Invalid HODL Bank', async () => {
        try {
            await hodl4me.hodlWithdrawal(1);
          }
          catch(err) {
            assert(err.reason === "Panic: Index out of bounds");
          }
    });

    /**
     * Unhappy path: User trying to withdraw from HODL Bank that's still locked
     */
    it('Unhappy path: HODL Bank is locked for withdrawals', async () => {
        const desiredHodlPeriod = 1698965928; // Some time in 2023
        await hodl4me.hodlDeposit(accounts[0], nullAddress, 0, desiredHodlPeriod, {value: 10});
        // Not sure how to test a custom error
        // await expectRevert(
        //     hodl4me.hodlWithdrawal(0),
        //         `required: ${desiredHodlPeriod}`
        // );
    });

    /**
     * Happy path: User successfully withdraws from Ether HODL Bank containing 10 Ether
     */
    it('User withdrawing 10 Ether from HODL Bank successfully', async () => {
        const desiredHodlPeriod = 1698965928; // Some time in 2023
        // Create Ether HODL Bank with 10 Ether
        await hodl4me.hodlDeposit(accounts[0], nullAddress, 0, desiredHodlPeriod, {value: web3.utils.toWei('10', 'ether')});

        // Get number of seconds until unlock to go travel in the future
        let currentTimestamp = await time.latest();
        currentTimestamp = currentTimestamp.toNumber();
        secondsUntilUnlock = (desiredHodlPeriod - currentTimestamp);

        // Take a snapshot of current Timestamp to revert at the end of test
        const snapshotA = await snapshot();

        // Travel in the future where HODL Bank will be available to withdraw from
        await time.increase(secondsUntilUnlock);
        currentTimestamp = await time.latest();
        currentTimestamp = currentTimestamp.toNumber();

        // Get user balance before withdrawing from bank
        const balanceBefore = await web3.eth.getBalance(accounts[0]);

        // At this point in time HODL Bank should be unlocked
        await hodl4me.hodlWithdrawal(0);

        // Get user balance after withdrawing from bank
        const balanceAfter = await web3.eth.getBalance(accounts[0]);

        //Revert blockchain Timestamp to initial time
        await snapshotA.restore();

        // Balance now should have 10 Ether more than before withdrawal
        assert(Math.ceil((web3.utils.fromWei(balanceAfter, 'ether') - web3.utils.fromWei(balanceBefore, 'ether'))) === 10);
    });

    /**
     * Unhappy path: User trying to withdraw from HODL Bank twice - Already withdrawn
     */
    it('Unhappy path: User withdrawing from HODL Bank twice', async () => {
        const desiredHodlPeriod = 1698965928; // Some time in 2023
        // Create Ether HODL Bank with 10 Ether
        await hodl4me.hodlDeposit(accounts[0], nullAddress, 0, desiredHodlPeriod, {value: web3.utils.toWei('10', 'ether')});

        // Get number of seconds until unlock to go travel in the future
        let currentTimestamp = await time.latest();
        currentTimestamp = currentTimestamp.toNumber();
        secondsUntilUnlock = (desiredHodlPeriod - currentTimestamp);

        // Take a snapshot of current Timestamp to revert at the end of test
        const snapshotA = await snapshot();

        // Travel in the future where HODL Bank will be available to withdraw from
        await time.increase(secondsUntilUnlock);
        currentTimestamp = await time.latest();
        currentTimestamp = currentTimestamp.toNumber();

        // Get user balance before withdrawing from bank
        const balanceBefore = await web3.eth.getBalance(accounts[0]);

        // At this point in time HODL Bank should be unlocked
        await hodl4me.hodlWithdrawal(0);

        // Get user balance after withdrawing from bank
        const balanceAfter = await web3.eth.getBalance(accounts[0]);

        // Balance now should have 10 Ether more than before withdrawal
        assert(Math.ceil((web3.utils.fromWei(balanceAfter, 'ether') - web3.utils.fromWei(balanceBefore, 'ether'))) === 10);

        await expectRevert(            
            hodl4me.hodlWithdrawal(0),
                "User already withdrawn from this HODL Bank"
        );

        //Revert blockchain Timestamp to initial time
        await snapshotA.restore();

    });

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