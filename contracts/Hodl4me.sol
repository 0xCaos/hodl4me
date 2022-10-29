// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HodlForMe
 * @author 0xCaos
 * @dev Hodl for Me is a contract that allows users to deposit ERC20 tokens into 
 * personal Piggy Banks and only permit the withdrawal after the chosen time has 
 * been reached (Unix timestamp)
 *
 * If the user's locked ERC20 token appreciates in value over a certain period of time, 
 * the user will be rewarded with HODL4ME tokens. These are liquid and can be redeemed
 * at any time.
 */
contract Hodl4me is Ownable{

  /** @notice Will release all Piggy Banks for withdrawal by their owners */ 
  bool public releaseAll;

  /** 
  * @dev This struct contains the following members
  * hodlToken: Contains the ERC20 token's contract address
  * tokenAmount: Amount of tokens locked 
  * timeOfDeposit: Unix timestamp of the moment of deposit
  * hodlPeriod: Unix timestamp at which user can withdraw tokens
  * active: Boolean that returns true if Hodl Bank holds funds
  */
  struct HodlBankDetails { 
    address hodlToken;
    uint    tokenAmount;
    uint    timeOfDeposit;
    uint    hodlPeriod;
    bool    active;
  }

  /** @dev An array of UserHodlBank structs */
  HodlBankDetails[] public hodlBanks;

  /** @dev User's address mapping to an array of hodlBanks */
  mapping(address => hodlBanks) public userHodlBanks;

  /**
    * @dev Events used by Front-end to easily list user's active Hodl Banks
    * @param user Owner's address of newly created Hodl Bank
    * @param hodlBankId Index of user's newly created HodlBankDetails
  */
  event NewDeposit(address indexed user, uint hodlBankId);
  /**
    * @dev Events used by Front-end to easily list user's active Hodl Banks
    * @param user User's address of Hodl Bank just withdrawn
    * @param hodlBankId HodlBankDetails Index that just got withdrawn
  */
  event NewWithdrawal(address indexed user, uint hodlBankId);

  /** @dev Allow all users to withdraw funds before lockedPeriod is reached */
  function allowWithdrawals() public onlyOwner {
      releaseAll = !releaseAll;
  }

  /**
    * @dev Function for the deposit of tokens into Hodl Bank
    * @param _user The user address that will be allowed to withdraw funds in the future
    * @param _hodlPeriod Unix timestamp until deposited funds are unlocked
    * @param _hodlToken: Contains the ERC20 token's contract address
    * @param _tokenAmount: Amount of tokens locked 
    * Emits a {Deposited} event.
    */
  function hodlDeposit(address payable _user, address _hodlToken, uint _tokenAmount, uint _hodlPeriod) payable public {
    require(_hodlPeriod > block.timestamp, "Unlock time needs to be in the future");

    /** @dev New index of Hodl Banks that the user has created ever */
    uint memory _hodlBankId = getHodlBankCount(_user).add(1);

    if (_hodlToken = 0) { // User is depositing Ether
      require(msg.value > 0, "Amount can't be zero");
      userHodlBanks[_user][userHodlBankCount].tokenAmount = msg.value;
    } else {  // Deposit ERC20
      require(_tokenAmount > 0, "Amount can't be zero");
      require(_isContract(_hodlToken) == true, "Address needs to be a contract");
      // TODO: require token transfer to be allowed (maybe done though FE?)
      // transfer funds to contract
      // set _tokenAmount AFTER transfer
      userHodlBanks[_user][userHodlBankCount].tokenAmount = _tokenAmount;
      userHodlBanks[_user][userHodlBankCount].hodlToken = _hodlToken;
    }

    // Set hodlPeriod, timeOfDeposit and active
    userHodlBanks[_user][userHodlBankCount].timeOfDeposit = block.timestamp;
    userHodlBanks[_user][userHodlBankCount].hodlPeriod = _hodlPeriod;
    userHodlBanks[_user][userHodlBankCount].active = true;
    allPairs.push(pair);
    emit NewDeposit(_user, _hodlBankId);
  }

  function hodlWithdrawal(address payable _receiver, uint _amount) public {
      // Requires enough balance in user's contract wallet 
      require(userWalletBalance[msg.sender] >= _amount, "Not enough balance in wallet");
      // Decrement sender's wallet balance
      userWalletBalance[msg.sender] -= _amount;
      // Send Ether to receiver wallet
      _receiver.transfer(_amount);
      emit NewWithdrawal(_user, _hodlBankId);
  }

  /** @notice Helper functions */

  /**
    * @dev Function that returns the number of Hodl Banks that the user has created regardless
    * if active or not
    * @param _user User to get the Hodl Bank count from
    * @return hodlBankCount Number of hodlBankCount the user has (regardless if active or not)
  */
  function getHodlBankCount(address _user) public view returns(uint hodlBankCount) {
    return userHodlBanks[_user].length;
  }

  /**
    * @dev Simple private function to verify whether given address is at least from a contract.
    * @notice This function only guarantees that given address is a contract, not necessarily
    * an ERC20 contract.
    * @param _hodlToken Contract address
    * @return isContract Returns true if the address given is from a contract
  */
  function _isContract(address _hodlToken) private returns (bool isContract) {    
    return addr.code.length > 0; 
  }


}