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
  bool releaseAll;

  /** 
  * @dev This struct contains the following members
  * tokenName: A string containing the ERC20 token Name
  * tokenAddress: Contains the ERC20 token's contract address
  * depositsAllowed: Boolean allowing for new deposits
  */
  struct HodlBankIdDetails { 
    string  tokenName; //Is it required?
    address tokenAddress;
    bool    depositsAllowed;
  }

  /** 
  * @dev This struct contains the following members
  * tokenName: A string containing the ERC20 token Name
  * tokenAddress: Contains the ERC20 token's contract address
  * lockedAmount: Amount of tokens locked 
  * lockedPeriod: Unix timestamp at which user can withdraw tokens
  */
  struct UserHodlBank { 
    uint    userHodlBankId;
    uint    lockedAmount;
    uint    lockedPeriod;
  }

  /** @dev Number of active Hodl Banks */
  uint activeHodlBanks;
  /** @dev ID mapping to HodlBankIdDetails struct containing Hodl Bank info */
  mapping(uint => HodlBankIdDetails) public HodlBankId;

  /** @dev User's address mapping to a Hodl Bank ID mapping contaning user's token HodlBank */
  // Q: Should I keep track of how many HodlBanks the user has or should I just let the front-end scan until
  // it reaches zeroes?
  mapping(address => mapping(uint => HodlBank)) public userWalletBalance;

  /** @dev Initialise contract with ETH piggy bank already allowed */
  constructor() {
    activeHodlBanks = 1;
    HodlBankId[0].tokenName = "ETH";
    HodlBankId[0].depositsAllowed = true;
  }

  /** @dev Allow users to withdraw funds before lockedPeriod is reached */
  function allowWithdrawals() public onlyOwner {
      releaseAll = !releaseAll;
  }

  /** 
  * @dev Contract owner can allow owners to withdraw funds before lockedPeriod is reached 
  * @param _hodlBankId ID to Hodl Bank to allow/block for new deposits
  */
  function allowDeposits(uint _hodlBankId) public onlyOwner {
      HodlBankId[activeHodlBanks].depositsAllowed = !HodlBankId[activeHodlBanks].depositsAllowed;
  }

  /**
    * @dev Function that creates a new Hodl Bank
    * @param _tokenName The name of the ERC20 Token //Q: Can I retrieve this info using tokenAddress?
    * @param _tokenAddress ERC20 token contract address
    * @param _depositsAllowed Allow/Block new deposits for particular token
    */
  function createHodlBank(string _tokenName, address _tokenAddress, bool _depositsAllowed) public onlyOwner {
    // Q: Should I iterate through activeHodlBanks to see if _tokenAddress already exists?
    HodlBankId[activeHodlBanks].tokenName = _tokenName;
    HodlBankId[activeHodlBanks].tokenAddress = _tokenAddress;
    HodlBankId[activeHodlBanks].depositsAllowed = _depositsAllowed;
    activeHodlBanks += 1;
  }

  /**
    * @dev Function for the deposit of tokens into Hodl Bank
    * @param _user The user address that will be allowed to withdraw funds in the future
    * @param _timestamp Unix timestamp until deposited funds are unlocked
    * Emits a {Deposited} event.
    */
  function hodlDeposit(address payable _user, uint _hodlBankId, uint _lockedAmount, uint _lockedPeriod) payable public {
      HodlBankId[] = 
      // Requires user to send Ether when using the function
      //require(msg.value > 0 ether, "Ether value sent to address has to be greater than zero");
      // Increment user balance
      //userWalletBalance[_user] += msg.value;
  }

  function hodlWithdrawal(address payable _receiver, uint _amount) public {
      // Requires enough balance in user's contract wallet 
      require(userWalletBalance[msg.sender] >= _amount, "Not enough balance in wallet");
      // Decrement sender's wallet balance
      userWalletBalance[msg.sender] -= _amount;
      // Send Ether to receiver wallet
      _receiver.transfer(_amount);
  }


  //Q: Not sure if required
  // function addNewToken() public onlyOwner {

  // }

}