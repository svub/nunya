// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO in production
import "hardhat/console.sol";
// import "@openzeppelin/contracts/";
// import "@openzeppelin/contracts/access/Ownable.sol";

interface SecretContract {
    function newSecretUser(uint256 secret) external returns (string memory);
    function linkPaymentRef(uint256 secret, string calldata ref) external returns (string memory);
    function pay(string calldata ref, uint256 amount) external returns (uint256);
    function payWithReceipt(string calldata ref, uint256 amount, uint256 userPubkey) external returns (uint256);
    function withdraw(string calldata secret, address withdrawalAddress) external returns (uint256);
    function retreivePubkey() external returns (uint256);
}

/**
 * @author
 */
contract NunyaBusiness {
    address gateway;
    SecretContract secretContract;
    uint256 secretContractPubkey;

    event receiptEmitted(bytes32);

    constructor(address _gateway) {
        gateway = _gateway;
        secretContract = SecretContract(_gateway);
        secretContract.retreivePubkey();
    }

    modifier onlyGateway {
        require (gateway!=address(0), "No gateway set");
        require (msg.sender==gateway, "Only gateway can call callbacks. Use the user function instead");
        _;
    }

    function setSecretContractPubkey (uint256 _key) public onlyGateway {
        require (secretContractPubkey==0, "Key already set");
        // TODO: Make sure it's our secret contract setting the key, not some interloper
        secretContractPubkey=_key;        
    }

    // Function wrapped in secret network payload encryption
    function newSecretUser(uint256 _secret) public returns (string memory){
        string memory ref = secretContract.newSecretUser(_secret);
    }

    function newSecretUserCallback(uint256 _secret) public onlyGateway {
        // TODO: emit requestId
    }

    // Function wrapped in secret network payload encryption
    function linkPaymentRef(uint256 _secret, string calldata _ref) public returns (string memory){
        string memory ref = secretContract.linkPaymentRef(_secret, _ref);
    }

    function linkPaymentRefCallback(uint256 _secret) public onlyGateway{
        string memory ref = secretContract.linkPaymentRef(_secret, _ref);
    }
    
    // TODO: use ref encrypted with (user pubkey+salt)
    function pay(string calldata ref, uint256 _value) public payable {
        // >= because we need gas for
        require (_value >= msg.value, "Naughty!");
        uint256 gasPaid = fundGateway();
        secretContract.pay(ref, msg.value-gasPaid);
    }

    // TODO: use ref encrypted with (user pubkey+salt)
    function pay(string calldata ref, uint256 _value, uint256 _userPubkey) public payable {
        // >= because we need gas for
        require (_value >= msg.value, "Naughty!");
        uint256 gasPaid = fundGateway();
        secretContract.payWithReceipt(ref, msg.value-gasPaid, _userPubkey);
    }
    // useful? 
    // function payEncrypted(string EncryptedRef) payable {
    //     secretContract.pay()
    // }

    function fundGateway() internal returns (uint256) {
        uint256 gas=1;
        // TODO: write the function
        return gas;
    }

    function payCallback(bytes32 _receipt) public payable onlyGateway {
        // TODO : use ecrecover to check receipt is signed by secret contract
        emit receiptEmitted(_receipt);
    }

    receive() external payable {
        
    }

    // Function wrapped in secret network payload encryption
    function withdraw(string calldata secret, address payable withdrawalAddress) public {
        uint256 amount = secretContract.withdraw(secret, withdrawalAddress);
        require(amount > 0, "Account not found or empty.");
        withdrawalAddress.transfer(amount);
    }

    function withdrawCallback(string calldata secret, address payable withdrawalAddress) onlyGateway public {
        uint256 amount = secretContract.withdraw(secret, withdrawalAddress);
        require(amount > 0, "Account not found or empty.");
        withdrawalAddress.transfer(amount);
    }
}