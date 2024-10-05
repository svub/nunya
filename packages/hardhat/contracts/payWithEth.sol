// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO in production
import "hardhat/console.sol";
// import "@openzeppelin/contracts/";
// import "@openzeppelin/contracts/access/Ownable.sol";

interface SecretContract {
    function makeRef(string calldata encrypteSecret) external returns (string memory);
    function pay(string calldata ref, uint256 amout) external returns (uint256);
    function withdraw(string calldata encrypteSecret, address withdrawalAddress) external returns (uint256);
}

/**
 * @author
 */
contract PayWithEth {

    SecretContract secretContact;

    function makeRef(string calldata encryptedSecret) public returns (string memory){
        string memory ref = secretContact.makeRef(encryptedSecret);
        return ref;
    }

    function pay(string calldata ref) public payable returns (uint256) {
        // TODO replace with proper type for proofs
        uint256 paymentProof = secretContact.pay(ref, msg.value);
        require(paymentProof > 0, "Payment reference not found");
        return paymentProof;
    }
    // useful? 
    // function payEncrypted(string EncryptedRef) payable {
    //     secretContact.pay()
    // }

    receive() external payable {}

    function withdraw(string calldata encryptedSecret, address payable withdrawalAddress) public {
        uint256 amount = secretContact.withdraw(encryptedSecret, withdrawalAddress);
        require(amount > 0, "Account not found or empty.");
        withdrawalAddress.transfer(amount);
    }
}