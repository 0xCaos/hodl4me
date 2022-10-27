// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract HODL4METoken is ERC20 {
    constructor(uint256 initialSupply) ERC20("HodlForMe", "HODL4ME") {
        _mint(msg.sender, initialSupply);
    }
}