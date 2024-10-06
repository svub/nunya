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

    address payable gateway;
    SecretContract secretContract;
    uint256 secretContractPubkey;
    mapping (uint256 => FunctionCallType) expectedResult;

    event ReceiptEmitted(Receipt);
    event Request_success(uint256 requestId);
    event SecretNetworkError(uint256 requestId, string message);
    event HackingAttemptError(uint256 requestId);

    constructor(address payable _gateway) payable {
        gateway = _gateway;
        secretContract = SecretContract(_gateway);
        // Lock secretContractPubkey to requestId so that only that request cn set it.
        // TODO: make it better - if call fails, contract is stuck and needs redploy :P
        fundGateway(msg.value);
        secretContractPubkey = secretContract.retrievePubkey();
    }

    modifier onlyGateway {
        require (gateway!=address(0), "No gateway set");
        require (msg.sender==gateway, "Only gateway can call callbacks. Use the user function instead");
        _;
    }

    function setSecretContractPubkeyCallback (uint256 _requestId, uint256 _key) public onlyGateway {
        // require (secretContractPubkey==0, "Key already set");
        require (secretContractPubkey==_requestId, "Only the contract constructor can trigger this function");
        // TODO: Make sure it's our secret contract setting the key, not some interloper
        secretContractPubkey=_key;
    }

    // Function wrapped in secret network payload encryption
    function newSecretUser(uint256 _secret) public payable returns (uint256){
        fundGateway(msg.value);
        uint256 requestId = secretContract.newSecretUser(_secret);
        expectedResult[requestId]==FunctionCallType.NEW_USER;
        return(requestId);
    }

    function newSecretUserCallback(uint256 _requestId, bool _success) public onlyGateway {
        require (expectedResult[_requestId]==FunctionCallType.NEW_USER);
        if (!_success)
            emit SecretNetworkError(_requestId, "Error paying - duplicate user?");
        emit Request_success(_requestId);
    }

    // Function wrapped in secret network payload encryption
    function linkPaymentRef(uint256 _secret, string calldata _ref) public payable returns (uint256){
        fundGateway(msg.value);
        uint256 requestId = secretContract.linkPaymentRef(_secret, _ref);
        expectedResult[requestId]=FunctionCallType.NEW_REF;
        return(requestId);
    }

    function linkPaymentRefCallback(uint256 _requestId, bool _success) public onlyGateway{
        require (expectedResult[_requestId]==FunctionCallType.NEW_REF);
        if (!_success)
            emit SecretNetworkError(_requestId, "Error paying - no user found?");
        emit Request_success(_requestId);
    }
    
    // TODO: use ref encrypted with (user pubkey+salt)
    function pay(string calldata _ref, uint256 _value) public payable returns (uint256) {
        // >= because we need gas for
        require (_value >= msg.value, "Naughty!");
        uint256 gasPaid = fundGateway();
        uint256 requestId = secretContract.pay(_ref, msg.value-gasPaid);
        expectedResult[requestId]=FunctionCallType.PAY;
        return(requestId);
    }

    // TODO: use ref encrypted with (user pubkey+salt)
    function pay(string calldata _ref, uint256 _value, uint256 _userPubkey) public payable returns (uint256) {
        // >= because we need gas for
        require (_value >= msg.value, "Naughty!");
        uint256 gasPaid = fundGateway();
        uint256 requestId = secretContract.payWithReceipt(_ref, msg.value-gasPaid, _userPubkey);
        expectedResult[requestId]==FunctionCallType.PAY;
        return(requestId);
    }

    // useful? 
    // function payEncrypted(string EncryptedRef) payable {
    //     secretContract.pay()
    // }

    function fundGateway(uint256 _gas) internal returns (uint256) {
        gateway.transfer(_gas);
        return _gas;
    }

    function fundGateway() internal returns (uint256) {
        // TODO: calculate gas better than this!
        uint256 gas=1;
        gateway.transfer(gas);
        return gas;
    }

    function payCallback(uint256 _requestId, bool _success) public payable onlyGateway {
        require (expectedResult[_requestId]==FunctionCallType.PAY);
        if (!_success)
            emit SecretNetworkError(_requestId, "Error paying - wrong payment ref?");
        emit Request_success(_requestId);
    }

    function payCallback(uint256 _requestId, bool _success, Receipt calldata _receipt) public payable onlyGateway {
        // TODO : use ecrecover to check receipt is signed by secret contract
        require (expectedResult[_requestId]==FunctionCallType.PAY);
        if (!_success)
            emit SecretNetworkError(_requestId, "Error paying - wrong payment ref?");
        if (uint256(_receipt.sig)!=0)
            emit ReceiptEmitted(_receipt);
        emit Request_success(_requestId);
    }

    receive() external payable {
        
    }

    // Function wrapped in secret network payload encryption
    function withdrawTo(string calldata _secret, uint256 _amount, address _withdrawalAddress) public payable returns (uint256) {
        require((_amount > 0), "Account not found or empty.");
        fundGateway(msg.value);
        uint256 requestId = secretContract.withdraw(_secret, _withdrawalAddress);
        // TODO: error check
        expectedResult[requestId]=FunctionCallType.WITHDRAW;
        return(requestId);
    }

    function withdrawToCallback(uint256 _requestId, bool _success, uint256 _amount, address payable _withdrawalAddress) onlyGateway public {
        require (expectedResult[_requestId]==FunctionCallType.WITHDRAW);
        if (!_success)
            emit SecretNetworkError(_requestId, "Error withdrawing - out of funds?");
        require(_amount > 0, "Account not found or empty.");
        _withdrawalAddress.transfer(_amount);
        emit Request_success(_requestId);
    }

    function emitSecretNetworkError(uint256 _requestId, string memory _message) public onlyGateway {
        emit SecretNetworkError(_requestId, _message);
    }
}
