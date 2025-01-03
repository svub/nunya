// SPDX-License-Identifier: Apache-2.0
// Version: 0.2.5
pragma solidity ^0.8.26;

// https://github.com/ltfschoen/benzcoin/blob/master/contracts/Owned.sol
contract Ownable {
    address internal owner;

    modifier onlyOwner {
      require(msg.sender == owner, "UNAUTHORIZED");
      _;
    }

    constructor() { 
      owner = msg.sender;
    }
}
