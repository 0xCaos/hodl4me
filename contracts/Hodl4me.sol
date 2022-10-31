// SPDX-License-Identifier: MIT

pragma solidity ^0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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

/** @dev Custom error returns Unix timestamp at which Hodl Bank's witdrawal is authorised */
error StillLocked(uint required);

contract Hodl4me is Ownable{

  using SafeERC20 for IERC20;

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

  /** @dev User's address mapping to an array of HodlBankDetails objects */
  mapping(address => HodlBankDetails[]) internal userHodlBanks;

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
  event Withdraw(address indexed user, uint hodlBankId);

  /** @dev Allow all users to withdraw funds before lockedPeriod is reached */
  function allowWithdrawals() external onlyOwner {
      releaseAll = !releaseAll;
  }

  /**
    * @dev Function for the deposit of tokens into Hodl Bank
    * @param _user The user address that will be allowed to withdraw funds in the future
    * @param _hodlPeriod Unix timestamp until deposited funds are unlocked
    * @param _hodlToken Contains the ERC20 token's contract address
    * @param _tokenAmount Amount of tokens to be locked 
    * Emits a {Deposited} event.
    */
  function hodlDeposit(address _user, 
                      address _hodlToken, 
                      uint _tokenAmount, 
                      uint _hodlPeriod
  ) payable external {
    require(_hodlPeriod > block.timestamp, "Unlock time needs to be in the future");

    /** @dev New object to be pushed into userHodlBanks */
    HodlBankDetails memory _newHodlBank;

    if (_hodlToken = 0) { /** @dev Address zero assumes User is depositing Ether */
      require(msg.value > 0, "Ether amount can't be zero");
      _newHodlBank.tokenAmount = msg.value;
    } else {  /** @dev User depositing ERC20 token */
      require(_tokenAmount > 0, "Token amount can't be zero");
      require(_isContract(_hodlToken) == true, "Address needs to be a contract");
      // Sending tokens from function caller to Hodl Bank
      IERC20(_hodlToken).safeTransferFrom(msg.sender, address(this), _tokenAmount);
      _newHodlBank.tokenAmount = _tokenAmount;
      _newHodlBank.hodlToken = _hodlToken;
    }

    /** @dev Set hodlPeriod, timeOfDeposit and active */
    _newHodlBank.timeOfDeposit = block.timestamp;
    _newHodlBank.hodlPeriod = _hodlPeriod;
    _newHodlBank.active = true;

    /** @dev Index to new Hodl Bank created by user */
    uint memory _hodlBankId = getHodlBankCount(_user).add(1);
    /** @dev Push new _newHodlBank object into user's Hodl Bank mapping */
    userHodlBanks[_user].push(_newHodlBank);

    emit NewDeposit(_user, _hodlBankId);
  }

  /**
    * @dev Function to withdraw from a particular HODL Bank
    * @param _hodlBankId ID number of the HODL Bank the user wishes to withdraw from
    * Emits a {Withdraw} event.
    */
  function hodlWithdrawal(uint _hodlBankId) external {
    require(userHodlBanks[msg.sender][_hodlBankId].active == true, "User already withdrawn from this Hodl Bank");
    // Custom error message if Hodl Period hasn't been reached yet
    if (userHodlBanks[msg.sender][_hodlBankId].hodlPeriod > block.timestamp)
      revert StillLocked({
        required: userHodlBanks[msg.sender][_hodlBankId].hodlPeriod
      });

    if (userHodlBanks[msg.sender][_hodlBankId].hodlToken = 0) { /** @dev Hodl Bank contains Ether */
      // Sending Ether from Hodl Bank back to Hodler
      msg.sender.transfer(userHodlBanks[msg.sender][_hodlBankId].tokenAmount);
    } else {  /** @dev Hodl Bank contains ERC20 token */
      // Sending ERC20 token from Hodl Bank back to Hodler
      IERC20(_hodlToken).safeTransferFrom(msg.sender, address(this), _tokenAmount);
    }

    /** @dev Setting active variable of Hodl Bank to false, flagging user has already withdrawn from Hodl Bank */
    userHodlBanks[msg.sender][_hodlBankId].active == false;
    emit Withdraw(msg.sender, _hodlBankId);
  }

  /** @notice Public helper functions */

  /**
    * @dev Function that returns the number of Hodl Banks that the user has created regardless
    * if active or not - public function is called from within protocol
    * @param _user User to get the Hodl Bank count from
    * @return hodlBankCount Number of hodlBankCount the user has (regardless if active or not)
  */
  function getHodlBankCount(address _user) public view returns(uint hodlBankCount) {
    return userHodlBanks[_user].length;
  }

  /**
    * @dev This function returns values from user's Hodl Bank
    * @notice Function required: Solidity does not allow for returning array of objects
    * @param _user User's address to get the Hodl Bank info from
    * @param _hodlBankId ID of Hodl Bank to get info from
    * @return _hodlToken Contains the ERC20 token's contract address
    * @return _tokenAmount Amount of tokens locked
    * @return _timeOfDeposit Unix timestamp of the moment of deposit
    * @return _hodlPeriod Unix timestamp at which user can withdraw tokens
    * @return _active Boolean that returns true if Hodl Bank holds funds
  */
  function getHodlBankInfo(address _user, uint _hodlBankId) public view returns(address _hodlToken,
      uint _tokenAmount,
      uint _timeOfDeposit,
      uint _hodlPeriod,
      bool _active
  ) {
    return (userHodlBanks[_user][_hodlBankId].hodlToken,
            userHodlBanks[_user][_hodlBankId].tokenAmount,
            userHodlBanks[_user][_hodlBankId].timeOfDeposit,
            userHodlBanks[_user][_hodlBankId].hodlPeriod,
            userHodlBanks[_user][_hodlBankId].active);
  }

  /** @notice Private helper functions */

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