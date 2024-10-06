// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO in production
import "hardhat/console.sol";
// import "@openzeppelin/contracts/";
// import "@openzeppelin/contracts/access/Ownable.sol";

interface SecretContract {
    function newSecretUser(uint256 secret) external returns (uint256);
    function linkPaymentRef(uint256 secret, string calldata ref) external returns (uint256);
    function pay(string calldata ref, uint256 amount) external returns (uint256);
    function payWithReceipt(string calldata ref, uint256 amount, uint256 userPubkey) external returns (uint256);
    function withdraw(string calldata secret, address withdrawalAddress) external returns (uint256);
    function retreivePubkey() external returns (uint256);
}

/**
 * @author
 */
contract NunyaBusiness {
    enum functionCallType {
        OTHER, NEW_USER, NEW_REF, PAY, WITHDRAW
    };

    address gateway;
    SecretContract secretContract;
    uint256 secretContractPubkey;
    mapping (uint256, functionCallType) expectedResult;

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
    function newSecretUser(uint256 _secret) public returns (uint256){
        uint256 requestId = secretContract.newSecretUser(_secret);
        expectedResult[requestId]==NEW_USER;
    }

    function newSecretUserCallback(uint256 requestId) public onlyGateway {
        require (expectedResult[requestId]==NEW_USER);
        // TODO: emit requestId
    }

    // Function wrapped in secret network payload encryption
    function linkPaymentRef(uint256 _secret, string calldata _ref) public returns (uint256){
        uint256 requestId = secretContract.linkPaymentRef(_secret, _ref);
        expectedResult[requestId]==NEW_REF;
    }

    function linkPaymentRefCallback(uint256 requestId) public onlyGateway{
        require (expectedResult[requestId]==NEW_REF);
        string memory ref = secretContract.linkPaymentRef(_secret, _ref);
    }
    
    // TODO: use ref encrypted with (user pubkey+salt)
    function pay(string calldata ref, uint256 _value) public payable returns (uint256) {
        // >= because we need gas for
        require (_value >= msg.value, "Naughty!");
        uint256 gasPaid = fundGateway();
        uint256 requestId = secretContract.pay(ref, msg.value-gasPaid);
        expectedResult[requestId]==PAY;
    }

    // TODO: use ref encrypted with (user pubkey+salt)
    function pay(string calldata ref, uint256 _value, uint256 _userPubkey) public payable returns (uint256) {
        // >= because we need gas for
        require (_value >= msg.value, "Naughty!");
        uint256 gasPaid = fundGateway();
        uint256 requestId = secretContract.payWithReceipt(ref, msg.value-gasPaid, _userPubkey);
        expectedResult[requestId]==PAY;
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

    function payCallback(uint256 requestId, bytes32 _receipt) public payable onlyGateway {
        // TODO : use ecrecover to check receipt is signed by secret contract
        require (expectedResult[requestId]==PAY);
        if uint256(_receipt!=0)
            emit receiptEmitted(_receipt);
    }

    receive() external payable {
        
    }

    // Function wrapped in secret network payload encryption
    function withdraw(string calldata secret, address payable withdrawalAddress) public returns (uint256) {
        require(amount > 0, "Account not found or empty.");
        uint256 requestId = secretContract.withdraw(secret, withdrawalAddress);
        // TODO: error check
        expectedResult[requestId]==WiTHDRAW;
    }

    function withdrawCallback(uint256 requestId) onlyGateway public {
        require (expectedResult[requestId]==WiTHDRAW);
        uint256 amount = secretContract.withdraw(secret, withdrawalAddress);
        require(amount > 0, "Account not found or empty.");
        withdrawalAddress.transfer(amount);
    }
}