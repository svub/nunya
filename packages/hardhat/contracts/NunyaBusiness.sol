// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO remove in production
import "hardhat/console.sol";
// import "@openzeppelin/contracts/";
// import "@openzeppelin/contracts/access/Ownable.sol";
// TODO: replace with interface of "./Gateway.sol"
// import "./ISecretContract.sol";
import "./IGateway.sol";

import "./JsmnSolLib.sol";

/**
 * @author
 */
contract NunyaBusiness {

    enum FunctionCallType {
        OTHER, GET_KEY, NEW_USER, NEW_REF, PAY, WITHDRAW, ERROR
    }

    // payment receipt
    uint16 constant SUCCESS = 0;
    uint16 constant ERROR_NOT_SIGNED = 1;
    // withdrawal
    uint16 constant ERROR_NO_FUNDS = 2;
    uint16 constant ERROR_NOT_ENOUGH_FUNDS = 3;
    uint16 constant ERROR_UNKNOWN = 4;

    struct Receipt {
        uint256 paymentRef;
        uint256 amount;
        uint256 denomination;
        bytes32 sig;
    }

    address payable gateway;
    IGateway secretContract;
    uint256 secretContractPubkey;
    mapping (uint256 => FunctionCallType) expectedResult;

    // TODO could an account be created the first time a user creates a ref?
    event AccountCreated(uint256 requestId, uint16 code);
    event PaymentReferenceCreated(uint256 requestId, uint16 code, string ref);
    event PaymentProcessed(uint256 requestId, uint16 code);
    event PaymentWithReceiptProcessed(uint256 requestId, uint16 code, Receipt receipt);
    event WithdrawalProcessed(uint256 requestId, uint16 code, uint256 amount);
    event SecretNetworkError(uint256 requestId, uint16 code, string message);

    constructor(address payable _gateway) payable {
        gateway = _gateway;
        secretContract = IGateway(_gateway);
        console.log("constructor: msg.value", msg.value);
        fundGateway(0); // send all funds to the gateway

        // TODO: only uncomment when hardhat has gateway deployed
        // TODO can we test if it's deployed and call then automatically? 
        // IDEA use requestId to make sure nobody else is calling the callback, see below.
        // Note: It may be necessary to call using snake case.
        // const requestId = secretContract.retrievePubkey();
        // expectedResult[requestId] = FunctionCallType.GET_KEY;

        // Lock secretContractPubkey to Owner. After it is set it cannot be reset.
        // QUESTION: the msg.sender is the address of the sender, not the pubkey
        // secretContractPubkey = uint256(uint160(msg.sender));
    }

    modifier onlyGateway {
        require (gateway != address(0), "No gateway set");
        require (msg.sender == gateway, "Only gateway can call callbacks. Use the user function instead");
        _;
    }

    modifier validateRequest(uint256 _id, FunctionCallType _type) {
        require (expectedResult[_id] == _type);
        delete expectedResult[_id];
        _;
    }

    // testing function - DO NOT KEEP IN PROD!
    function unsafeGetSecretContractPubkey () public {
        secretContract = IGateway(gateway);
        uint256 requestId = secretContract.retrievePubkey();
        console.log("requested secret contract pubkey - requestId=", requestId);
    }

    function setSecretContractPubkeyCallback (uint256 _requestId, uint256 _key) public onlyGateway validateRequest(_requestId, FunctionCallType.GET_KEY) {
        // require (secretContractPubkey==0, "Key already set");
        // Make sure it's our secret contract setting the key, not some interloper
        // (will fail one time in 2^96 ;)
        // require (secretContractPubkey  < 2**160, "Only the contract constructor can trigger this function");

        // IDEA secretContract.retrievePubkey() could return the requestId as a result, which could be stored in the contructor and then compared here, only when it mateches, the key will be accepted.
        // IDEA turned this into a modifier, leaving the code for discussion and then removal
        // require (expectedResult[_requestId] == FunctionCallType.GET_KEY);
        // delete expectedResult[_requestId];
        secretContractPubkey = _key;
    }

    // Function wrapped in secret network payload encryption
    // TODO needed? or could a new account be created on the fly when creating the first payment ref?
    function newSecretUser(string calldata _secret) public payable returns (uint256){
        // TODO make sure the funding is high enough to pay for fees calling the contract.
        fundGateway(100000); // TODO find out how much gas is needed to call secretContract.newSecretUser(_secret)
        uint256 requestId = secretContract.newSecretUser(_secret);
        expectedResult[requestId] = FunctionCallType.NEW_USER;
        console.log("----- NunyaBusiness.sol newSecretUser requestId: ", requestId);
        return(requestId);
    }

    function newSecretUserCallback(uint256 _requestId, uint16 _code) public onlyGateway validateRequest(_requestId, FunctionCallType.NEW_USER) {
        emit AccountCreated(_requestId, _code);
    }

    // Function wrapped in secret network payload encryption
    // IDEA have the ref being created inside the secret contract, this way we avoid any potential collisions with already existing references.
    function createPaymentReference(string calldata _secret, string calldata _ref) public payable returns (uint256){
        fundGateway(50000); // TODO 50000 is the minimum, need to adjust to a good estimate
        // IDEA the requestId could be created here and forwarded to the gateway. This way, the gateway becames very slim, just forwarding calls and callbacks while all logic is handled here.
        uint256 requestId = secretContract.createPaymentReference(_secret, _ref);
        expectedResult[requestId] = FunctionCallType.NEW_REF;
        return(requestId);
    }

    function createPaymentReferenceCallback(uint256 _requestId, uint16 _code, string calldata _reference) public onlyGateway validateRequest(_requestId, FunctionCallType.NEW_REF) {
        if (_code != 0) {
            emitSecretNetworkError(_requestId, ERROR_UNKNOWN, "Error with paymentReference - unknown");
        }
        
        emit PaymentReferenceCreated(_requestId, _code, _reference);
    }

    // TODO: use ref encrypted with (user pubkey+salt)
    // TODO: `string calldata secret` or `uint256 secret`
    function pay(string calldata _valueJson, string calldata _ref, uint256 _value, string calldata _denomination) public payable returns (uint256) {
        // >= because we need gas for fees
        uint256 gasPaid = fundGateway(50000); // TODO 50000 is the minimum, need to adjust to a good estimate
        require(msg.value >= _value + gasPaid, "Not enough value sent to pay for gas.");

        // fix pseudocode!
        // Token claimedPayment = parse(_valueJson);
        // require (msg.value === claimedPayment, "incorrect payment value - ensure _valueJson is in the format {amount: paymentAmount, ... } and that msg.value == paymentAmount exactly.");

        uint256 requestId = secretContract.pay(_valueJson, _ref, msg.value - gasPaid, _denomination);
        expectedResult[requestId] = FunctionCallType.PAY;
        return(requestId);
    }

    function payCallback(uint256 _requestId, uint16 _code) public payable onlyGateway validateRequest(_requestId, FunctionCallType.PAY) {
        if (_code != 0) {
            emitSecretNetworkError(_requestId, ERROR_UNKNOWN, "Error with pay - unknown");
        }
        emit PaymentProcessed(_requestId, _code);
    }


    // TODO: use ref encrypted with (user pubkey+salt)
    // TODO: `string calldata secret` or `uint256 secret`
    function payWithReceipt(string calldata _secret, string calldata _ref, uint256 _value, string calldata _denomination, uint256 _userPubkey) public payable returns (uint256) {
        uint256 gasPaid = fundGateway(50000); // TODO 50000 is the minimum, need to adjust to a good estimate
        require(msg.value >= _value + gasPaid, "Not enough value sent to pay for gas.");
        // QUESTION why is the user's pubkey required? How about the secret contact signs with it's pk and the user can validate using the secret contacts pubkey?
        uint256 requestId = secretContract.payWithReceipt(_secret, _ref, msg.value - gasPaid, _denomination, _userPubkey);
        expectedResult[requestId] = FunctionCallType.PAY;
        return(requestId);
    }

    function payWithReceiptCallback(uint256 _requestId, uint16 _code , Receipt calldata _receipt) public payable onlyGateway validateRequest(_requestId, FunctionCallType.PAY) {
        // TODO : use ecrecover to check receipt is signed by secret contract
        if (uint256(_receipt.sig) != 0) {
            _code = ERROR_NOT_SIGNED;
            emitSecretNetworkError(_requestId, ERROR_NOT_SIGNED, "Error with payWithReceipt - not signed");
        }
        if (_code != 0) {
            emitSecretNetworkError(_requestId, ERROR_UNKNOWN, "Error with payWithReceipt - unknown");
        }
        emit PaymentWithReceiptProcessed(_requestId, _code, _receipt);
    }


    // useful? 
    // IDEA I don't see a reason to have this, if the ref is generated as random bytes in the secret contract and doesn't reveil anything.
    // function payEncrypted(string EncryptedRef) payable {
    //     secretContract.pay()
    // }

    fallback() external payable {
        console.log("----- NunyaBusiness.sol fallback() msg.value:", msg.value);
    }

    receive() external payable {
        console.log("----- NunyaBusiness.sol receive() msg.value:", msg.value);
    }

    // Function wrapped in secret network payload encryption
    // TODO: `string calldata secret` or `uint256 secret`
    function withdrawTo(string calldata _secret, uint256 _amount, string calldata _denomination, address _withdrawalAddress) public payable returns (uint256) {
        // IDEA _amount == 0 could signal I want all funds available; alternatively, sending max value could also work
        require((_amount > 0), "Need to provide the amount you want to withdraw.");
        fundGateway(50000); // TODO 50000 is the minimum, need to adjust to a good estimate
        // IDEA we could store the withdrawal address in this contract instead of sending it forth and back. 
        uint256 requestId = secretContract.withdrawTo(_secret, _amount, _denomination, _withdrawalAddress);
        // TODO: error check
        expectedResult[requestId] = FunctionCallType.WITHDRAW;
        return(requestId);
    }

    function withdrawToCallback(uint256 _requestId, uint16 _code, uint256 _amount, string calldata _denomination, address payable _withdrawalAddress) onlyGateway validateRequest(_requestId, FunctionCallType.WITHDRAW) public {
        // TODO: handle returning more specific errors in Secret contract
        if (_code == 0 && _amount == 0) {
            _code = ERROR_NO_FUNDS;
            emitSecretNetworkError(_requestId, ERROR_NO_FUNDS, "Error with withdraw - no funds");
        } 
        if (_code != 0) {
            emitSecretNetworkError(_requestId, ERROR_UNKNOWN, "Error with withdraw - unknown");
        }
        if (_code == 0 && _amount > 0) {
            // TODO: only if the `_denomination` is "ETH"?
            _withdrawalAddress.transfer(_amount);

            emit WithdrawalProcessed(_requestId, _code, _amount);
        } else {
            emitSecretNetworkError(_requestId, ERROR_UNKNOWN, "Error with withdraw - transfer");
        }
    }

    function fundGateway(uint256 keepGas) internal returns (uint256) {
        console.log("----- NunyaBusiness.sol fundGateway() keepGas: ", keepGas);
        uint256 txGas = 21000; // seems the default for a normal TX, TODO confirm
        require(keepGas <= 30000000, "Keep more than maximum per block?!");
        uint256 totalGasReserved = txGas + keepGas;
        console.log("fundGateway", msg.value, totalGasReserved);
        // require (msg.value >= totalGasReserved , string(abi.encodePacked("You need to send enough to cover the forward fees. Sent: ", uint2str(msg.value), " required for fees: ", uint2str(totalGasReserved))));
        require (msg.value >= totalGasReserved , "You need to send enough to cover the forward fees.");
        uint256 value = msg.value - totalGasReserved;
        gateway.transfer(value);
        return totalGasReserved;
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }

    function emitSecretNetworkError(uint256 _requestId, uint16 _code, string memory _message) public onlyGateway {
        emit SecretNetworkError(_requestId, _code, _message);
    }
}
