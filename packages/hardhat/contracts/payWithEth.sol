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
    function retrievePubkey() external returns (uint256);
}

/**
 * @author
 */
contract NunyaBusiness {

    enum FunctionCallType {
        OTHER, NEW_USER, NEW_REF, PAY, WITHDRAW, ERROR
    }

    struct Receipt {
        uint256 paymentRef;
        uint256 amount;
        bytes32 sig;
    }

    address gateway;
    SecretContract secretContract;
    uint256 secretContractPubkey;
    mapping (uint256 => FunctionCallType) expectedResult;

    event ReceiptEmitted(Receipt);
    event RequestSuccess(uint256 requestId);
    event Error(string message);

    constructor(address _gateway) {
        gateway = _gateway;
        secretContract = SecretContract(_gateway);
        // Lock secretContractPubkey to requestId so that only that request cn set it.
        // TODO: make it better - if call fails, contract is stuck and needs redploy :P
        secretContractPubkey = secretContract.retrievePubkey();
    }

    modifier onlyGateway {
        require (gateway!=address(0), "No gateway set");
        require (msg.sender==gateway, "Only gateway can call callbacks. Use the user function instead");
        _;
    }

    function setSecretContractPubkeyCallback (uint256 requestId, uint256 _key) public onlyGateway {
        // require (secretContractPubkey==0, "Key already set");
        require (secretContractPubkey==requestId, "Only the contract constructor can trigger this function");
        // TODO: Make sure it's our secret contract setting the key, not some interloper
        secretContractPubkey=_key;
    }

    // Function wrapped in secret network payload encryption
    function newSecretUser(uint256 _secret) public returns (uint256){
        uint256 requestId = secretContract.newSecretUser(_secret);
        expectedResult[requestId]==FunctionCallType.NEW_USER;
        return(requestId);
    }

    function newSecretUserCallback(uint256 requestId) public onlyGateway {
        require (expectedResult[requestId]==FunctionCallType.NEW_USER);
        emit RequestSuccess(requestId);
    }

    // Function wrapped in secret network payload encryption
    function linkPaymentRef(uint256 _secret, string calldata _ref) public returns (uint256){
        uint256 requestId = secretContract.linkPaymentRef(_secret, _ref);
        expectedResult[requestId]=FunctionCallType.NEW_REF;
        return(requestId);
    }

    function linkPaymentRefCallback(uint256 requestId) public onlyGateway{
        require (expectedResult[requestId]==FunctionCallType.NEW_REF);
        emit RequestSuccess(requestId);
    }
    
    // TODO: use ref encrypted with (user pubkey+salt)
    function pay(string calldata ref, uint256 _value) public payable returns (uint256) {
        // >= because we need gas for
        require (_value >= msg.value, "Naughty!");
        uint256 gasPaid = fundGateway();
        uint256 requestId = secretContract.pay(ref, msg.value-gasPaid);
        expectedResult[requestId]=FunctionCallType.PAY;
        return(requestId);
    }

    // TODO: use ref encrypted with (user pubkey+salt)
    function pay(string calldata ref, uint256 _value, uint256 _userPubkey) public payable returns (uint256) {
        // >= because we need gas for
        require (_value >= msg.value, "Naughty!");
        uint256 gasPaid = fundGateway();
        uint256 requestId = secretContract.payWithReceipt(ref, msg.value-gasPaid, _userPubkey);
        expectedResult[requestId]==FunctionCallType.PAY;
        return(requestId);
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

    function payCallback(uint256 requestId, Receipt calldata _receipt) public payable onlyGateway {
        // TODO : use ecrecover to check receipt is signed by secret contract
        require (expectedResult[requestId]==FunctionCallType.PAY);
        if (uint256(_receipt.sig)!=0)
            emit ReceiptEmitted(_receipt);
        emit RequestSuccess(requestId);
    }

    receive() external payable {
        
    }

    // Function wrapped in secret network payload encryption
    function withdrawTo(string calldata secret, uint256 amount, address withdrawalAddress) public returns (uint256) {
        require((amount > 0), "Account not found or empty.");
        uint256 requestId = secretContract.withdraw(secret, withdrawalAddress);
        // TODO: error check
        expectedResult[requestId]=FunctionCallType.WITHDRAW;
        return(requestId);
    }

    function withdrawToCallback(uint256 requestId, uint256 amount, address payable withdrawalAddress) onlyGateway public {
        require (expectedResult[requestId]==FunctionCallType.WITHDRAW);
        require(amount > 0, "Account not found or empty.");
        withdrawalAddress.transfer(amount);
        emit RequestSuccess(requestId);
    }

    function secretNetworkError(uint256 requestId, string memory _message) public onlyGateway {
        emit Error(_message);
    }
}
