// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO in production
import "hardhat/console.sol";
// import "@openzeppelin/contracts/";
// import "@openzeppelin/contracts/access/Ownable.sol";

interface SecretContract {
    function makeRef(string calldata secret) external returns (string memory);
    function pay(string calldata ref, uint256 amout) external returns (uint256);
    function withdraw(string calldata secret, address withdrawalAddress) external returns (uint256);
}

/**
 * @author
 */
contract PayWithEth {
    address gateway;
    SecretContract secretContract;

    event receiptEmmited(bytes32);

    constructor(address _gateway) {
        gateway == _gateway;
    }

    modifier onlyGateway () {
        require (gateway, "No gateway set");
        require (msg.sender==gateway, "Only gateway can call callbacks. Use the user function instead");
        _;
    }

    function makeRef(string calldata secret) public returns (string memory){
        string memory ref = secretContract.makeRef(secret);
        return ref;
    }

    function makeRefCallback(string calldata secret) public returns (string memory){
        string memory ref = secretContract.makeRef(secret);
        return ref;
    }

    function pay(string calldata ref) public payable returns (uint256) {
        // TODO replace with proper type for proofs
        uint256 receipt = secretContract.pay(ref, msg.value);
        require(receipt > 0, "Payment reference not found");
        return receipt;
    }
    // useful? 
    // function payEncrypted(string EncryptedRef) payable {
    //     secretContract.pay()
    // }

    function payCallback(string calldata ref) public payable returns (uint256) {
        // TODO replace with proper type for proofs
        uint256 receipt = secretContract.pay(ref, msg.value);
        require(receipt > 0, "Payment reference not found");
        return receipt;
    }

    receive() external payable {

    }

    function withdraw(string calldata secret, address payable withdrawalAddress) public {
        uint256 amount = secretContract.withdraw(secret, withdrawalAddress);
        require(amount > 0, "Account not found or empty.");
        withdrawalAddress.transfer(amount);
    }

    function withdrawCallback(string calldata secret, address payable withdrawalAddress) public {
        uint256 amount = secretContract.withdraw(secret, withdrawalAddress);
        require(amount > 0, "Account not found or empty.");
        withdrawalAddress.transfer(amount);
    }
}