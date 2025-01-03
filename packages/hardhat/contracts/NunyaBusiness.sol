// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO remove in production
import "hardhat/console.sol";
// import "@openzeppelin/contracts/";
// import "@openzeppelin/contracts/access/Ownable.sol";
// TODO: replace with interface of "./Gateway.sol"
// import "./IDummyGateway.sol";
import "./IGateway.sol";

import "./JsmnSolLib.sol";

import "./JSONParser.sol";

import "./Utils.sol";

import "./Ownable.sol";

/**
 * @notice Gateway Receiver
 * @author
 */
contract NunyaBusiness is Ownable, Utils {

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

    /// @notice CustomGateway stores address to the Gateway contract to call the Secret contract
    address payable public CustomGateway;

    IGateway secretContract;

    uint256 public secretContractPubkey;

    mapping (uint256 => FunctionCallType) expectedResult;

    // TODO could an account be created the first time a user creates a ref?

    /// @notice Event that is emitted when a call was made (optional)
    /// @param isSet response of request
    event SetSecretContractInfo(bool isSet);

    /// @notice Event that is emitted when a call was made (optional)
    /// @param requestId requestId of the request. Contract can track a call that way
    event RequestedValue(uint256 requestId);
    // event FulfilledValue(uint256 requestId, uint256 value, uint16 code, address _nunya_business_contract_address);
    event FulfilledValue(uint256 requestId, bytes data);
    event RetrievePubkey(uint256 requestId);
    // event FulfilledPubkey(uint256 requestId, uint256 pubkey, uint16 code, address _nunya_business_contract_address);
    event FulfilledPubkey(uint256 requestId, bytes data);
    event AccountCreated(uint256 requestId, uint16 code);
    event PaymentReferenceCreated(uint256 requestId, uint16 code, string ref);
    event PaymentProcessed(uint256 requestId, uint16 code);
    event PaymentWithReceiptProcessed(uint256 requestId, uint16 code, Receipt receipt);
    event WithdrawalProcessed(uint256 requestId, uint16 code, uint256 amount);
    event SecretNetworkError(uint256 requestId, uint16 code, string message);

    constructor() payable {
        owner = msg.sender;

        console.log("------ NunyaBusiness - constructor: msg.value", msg.value);

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

    modifier existsGateway {
        require (address(CustomGateway) != address(0), "No gateway set");
        _;
    }

    modifier onlyGateway {
        require (address(CustomGateway) != address(0), "No gateway set");
        // Checks if the callback was called by the CustomGateway and not by any other address
        require (msg.sender == address(CustomGateway), "Only gateway can call callbacks. Use the user function instead");
        _;
    }

    modifier onlyNunyaBusinessContractMessageSender {
        // TODO - not for debugging, only production
        _;
    }

    modifier validateRequest(uint256 _id, FunctionCallType _type) {
        require (expectedResult[_id] == _type);
        delete expectedResult[_id];
        _;
    }

    /// @notice Sets the address to the Gateway contract 
    /// @param _CustomGateway address of the gateway
    function setGatewayAddress(address payable _CustomGateway) public payable onlyOwner {
        // https://docs.soliditylang.org/en/latest/types.html#address
        CustomGateway = payable(address(_CustomGateway));
        fundGateway(0); // send all funds to the gateway
    }

    /// @notice Potentially not necessary since we can set these values directly into the gateway contract
    /// instead of via the NunyaBusiness contract
    function unsafeSetSecretContractInfo(string memory _routingInfo, string memory _routingCodeHash) public payable onlyOwner returns (bool) {
        // Get the CustomGateway contract interface 
        IGateway customGateway = IGateway(CustomGateway);

        require(compStr(_routingInfo, "") == false, "Invalid Secret contract address");
        require(compStr(_routingCodeHash, "") == false, "Invalid Secret contract code hash");

        // Call the CustomGateway for a specific request
        // Returns requestId of the request. A contract can track the call that way.
        bool isSet = customGateway.setSecretContractInfo{value: msg.value}(_routingInfo, _routingCodeHash);
        console.log("------ NunyaBusiness - unsafeSetSecretContractInfo");

        // Emit the event
        emit SetSecretContractInfo(isSet);

        return isSet;
    }

    /// @notice Demo function on how to implement a call
    // Note that we keep this function instead of just directly calling `send` in the Gateway.sol
    // so that we can easily keep track of the original requestId by emitting a custom event here
    // testing function - DO NOT KEEP IN PROD!
    function unsafeRequestValue(
        bytes32 _payloadHash,
        address _userAddress,
        string calldata _routingInfo,
        ExecutionInfo calldata _info
    ) public payable existsGateway onlyOwner {
        // Get the CustomGateway contract interface 
        IGateway customGateway = IGateway(CustomGateway);

        // Call the CustomGateway for a specific request
        // Returns requestId of the request. A contract can track the call that way.
        uint256 requestId = customGateway.send{value: msg.value}(_payloadHash, _userAddress, _routingInfo, _info);
        console.log("------ NunyaBusiness - unsafeRequestValue - requestId=", requestId);

        // Emit the event
        emit RequestedValue(requestId);
    }

    /// @notice Callback by the CustomGateway with the requested value
    /// @param _requestId requestId of the request that was initally called
    /// @param data Value in bytes in base64 representation
    function fulfilledValueCallback(uint256 _requestId, bytes calldata data) external onlyGateway {
        console.log("------ NunyaBusiness - fulfilledValueCallback - _requestId: ", _requestId);
        console.log("------ NunyaBusiness - fulfilledValueCallback - data.length: ", data.length);
        // Example `data` value: {"_request_id":{"network":"31337","task_id":"10"},"_key":[78,85,78,89,65],"_code":0,"_nunya_business_contract_address":"0xAFFF311821C3F3AF863C7103BB17BDC1Ba04603D"}
        console.log("------ NunyaBusiness - fulfilledValueCallback - data: ");
        console.logBytes(data);

        // emit FulfilledValue(_requestId, _value, _code, _nunya_business_contract_address);
        emit FulfilledValue(_requestId, data);

        // TODO - move to start of callback function after debugging
        // console.log("fulfilledValueCallback - address(this)", address(this));
        // require(address(this) == _nunya_business_contract_address);
    }

    /// @notice Demo function on how to implement a call
    // e.g. callbackGaslimit of 300000
    // testing function - DO NOT KEEP IN PROD!
    function unsafeRequestSecretContractPubkey (
        bytes32 _payloadHash,
        address _userAddress,
        string calldata _routingInfo,
        ExecutionInfo calldata _info
    ) public payable existsGateway onlyOwner {
        // Get the CustomGateway contract interface 
        IGateway customGateway = IGateway(CustomGateway);

        uint256 requestId = customGateway.send{value: msg.value}(_payloadHash, _userAddress, _routingInfo, _info);
        console.log("------ NunyaBusiness - unsafeRequestSecretContractPubkey - requestId=", requestId);

        // Emit the event
        emit RetrievePubkey(requestId);
    }

    /// @notice Callback by the CustomGateway with the requested value
    /// @param _requestId requestId of the request that was initally called
    // TODO: Add other args to doc comments: _key Public key of the custom Secret contract deployed on the Secret network
    function fulfilledSecretContractPubkeyCallback (uint256 _requestId, bytes calldata data) external onlyGateway {
    // function fulfilledSecretContractPubkeyCallback (uint256 _requestId, uint256 _key, uint16 _code, address _nunya_business_contract_address) public onlyGateway validateRequest(_requestId, FunctionCallType.GET_KEY) {
        console.log("------ NunyaBusiness - fulfilledSecretContractPubkeyCallback - _requestId: ", _requestId);
        console.log("------ NunyaBusiness - fulfilledSecretContractPubkeyCallback - data.length: ", data.length);
        console.log("------ NunyaBusiness - fulfilledSecretContractPubkeyCallback - data: ");
        console.logBytes(data);
        // Note: `Transaction ran out of gas` error if try to parse JSON response that has been prepared in the private Secret contract.
        // To prevent it from out of gas errors then try sending it as the first key and converting the value into a fixed-length hash using Keccak256
        // so it is easy to find the start and end of the `result` by index.

        // JSONParser parser = new JSONParser();
        // secretContractPubkey = parser.extractKeyArray(data);
        // // https://github.com/NomicFoundation/hardhat/issues/2043
        // for (uint i=0; i<secretContractPubkey.length; i++) {
        //     console.log("------ NunyaBusiness - fulfilledSecretContractPubkeyCallback - secretContractPubkey: ", i);
        // }

        // emit FulfilledPubkey(_requestId, secretContractPubkey);
        emit FulfilledPubkey(_requestId, data);

        // TODO: Implement the below instead when get working with `data` response initially
        
        // require (secretContractPubkey==0, "Key already set");
        // Make sure it's our secret contract setting the key, not some interloper
        // (will fail one time in 2^96 ;)
        // require (secretContractPubkey  < 2**160, "Only the contract constructor can trigger this function");

        // IDEA customGateway.retrievePubkey() could return the requestId as a result, which could be stored in the contructor and then compared here, only when it mateches, the key will be accepted.
        // IDEA turned this into a modifier, leaving the code for discussion and then removal
        // require (expectedResult[_requestId] == FunctionCallType.GET_KEY);
        // delete expectedResult[_requestId];
        // secretContractPubkey = _key;

        // console.log("------ NunyaBusiness - fulfilledSecretContractPubkeyCallback - requestId", _requestId);
        // console.log("------ NunyaBusiness - fulfilledSecretContractPubkeyCallback - key", _key);
        // console.log("------ NunyaBusiness - fulfilledSecretContractPubkeyCallback - code", _code);
        // console.log("------ NunyaBusiness - fulfilledSecretContractPubkeyCallback - nunya_business_contract_address", _nunya_business_contract_address);

        // emit FulfilledPubkey(_requestId, _key, _code, _nunya_business_contract_address);

        // // TODO - move to start of callback function after debugging
        // console.log("------ NunyaBusiness - fulfilledSecretContractPubkeyCallback - address(this)", address(this));
        // require(address(this) == _nunya_business_contract_address);
    }

    // Function wrapped in secret network payload encryption
    // TODO needed? or could a new account be created on the fly when creating the first payment ref?
    function newSecretUser(string calldata _secret) public payable existsGateway returns (uint256){
        // Get the CustomGateway contract interface 
        IGateway customGateway = IGateway(CustomGateway);

        // TODO make sure the funding is high enough to pay for fees calling the contract.
        fundGateway(100000); // TODO find out how much gas is needed to call customGateway.newSecretUser(_secret)
        uint256 requestId = customGateway.newSecretUser(_secret);
        expectedResult[requestId] = FunctionCallType.NEW_USER;
        console.log("------ NunyaBusiness - newSecretUser requestId: ", requestId);
        return(requestId);
    }

    function newSecretUserCallback(uint256 _requestId, uint16 _code) public onlyGateway validateRequest(_requestId, FunctionCallType.NEW_USER) {
        emit AccountCreated(_requestId, _code);
    }

    // Function wrapped in secret network payload encryption
    // IDEA have the ref being created inside the secret contract, this way we avoid any potential collisions with already existing references.
    function createPaymentReference(string calldata _secret, string calldata _ref) public payable existsGateway returns (uint256){
        // Get the CustomGateway contract interface 
        IGateway customGateway = IGateway(CustomGateway);

        fundGateway(50000); // TODO 50000 is the minimum, need to adjust to a good estimate
        // IDEA the requestId could be created here and forwarded to the gateway. This way, the gateway becames very slim, just forwarding calls and callbacks while all logic is handled here.
        uint256 requestId = customGateway.createPaymentReference(_secret, _ref);
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
    function pay(string calldata _valueJson, string calldata _ref, uint256 _value, string calldata _denomination) public payable existsGateway returns (uint256) {
        // Get the CustomGateway contract interface 
        IGateway customGateway = IGateway(CustomGateway);

        // >= because we need gas for fees
        uint256 gasPaid = fundGateway(50000); // TODO 50000 is the minimum, need to adjust to a good estimate
        require(msg.value >= _value + gasPaid, "Not enough value sent to pay for gas.");

        // fix pseudocode!
        // Token claimedPayment = parse(_valueJson);
        // require (msg.value === claimedPayment, "incorrect payment value - ensure _valueJson is in the format {amount: paymentAmount, ... } and that msg.value == paymentAmount exactly.");

        uint256 requestId = customGateway.pay(_valueJson, _ref, msg.value - gasPaid, _denomination);
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
    function payWithReceipt(string calldata _secret, string calldata _ref, uint256 _value, string calldata _denomination, uint256 _userPubkey) public payable existsGateway returns (uint256) {
        // Get the CustomGateway contract interface 
        IGateway customGateway = IGateway(CustomGateway);

        uint256 gasPaid = fundGateway(50000); // TODO 50000 is the minimum, need to adjust to a good estimate
        require(msg.value >= _value + gasPaid, "Not enough value sent to pay for gas.");
        // QUESTION why is the user's pubkey required? How about the secret contact signs with it's pk and the user can validate using the secret contacts pubkey?
        uint256 requestId = customGateway.payWithReceipt(_secret, _ref, msg.value - gasPaid, _denomination, _userPubkey);
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
    //     // Get the CustomGateway contract interface 
    //     IGateway customGateway = IGateway(CustomGateway);
    //
    //     customGateway.pay();
    // }

    // Function wrapped in secret network payload encryption
    // TODO: `string calldata secret` or `uint256 secret`
    function withdrawTo(string calldata _secret, uint256 _amount, string calldata _denomination, address _withdrawalAddress) public payable existsGateway returns (uint256) {
        // Get the CustomGateway contract interface 
        IGateway customGateway = IGateway(CustomGateway);

        // IDEA _amount == 0 could signal I want all funds available; alternatively, sending max value could also work
        require((_amount > 0), "Need to provide the amount you want to withdraw.");
        fundGateway(50000); // TODO 50000 is the minimum, need to adjust to a good estimate
        // IDEA we could store the withdrawal address in this contract instead of sending it forth and back. 
        uint256 requestId = customGateway.withdrawTo(_secret, _amount, _denomination, _withdrawalAddress);
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

    function fundGateway(uint256 keepGas) internal existsGateway returns (uint256) {
        console.log("------ NunyaBusiness - fundGateway() keepGas: ", keepGas);
        uint256 txGas = 21000; // seems the default for a normal TX, TODO confirm
        require(keepGas <= 30000000, "Keep more than maximum per block?!");
        uint256 totalGasReserved = txGas + keepGas;
        console.log("------ NunyaBusiness - fundGateway", msg.value, totalGasReserved);
        // require (msg.value >= totalGasReserved , string(abi.encodePacked("You need to send enough to cover the forward fees. Sent: ", uint2str(msg.value), " required for fees: ", uint2str(totalGasReserved))));
        require (msg.value >= totalGasReserved , "You need to send enough to cover the forward fees.");
        uint256 value = msg.value - totalGasReserved;
        CustomGateway.transfer(value);
        return totalGasReserved;
    }

    /// @notice Payout the paid balance to the owner
    function payoutBalance() external onlyOwner {
        payable(owner).transfer(address(this).balance);
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

    fallback() external payable {
        console.log("------ NunyaBusiness - fallback() msg.value:", msg.value);
    }

    receive() external payable {
        console.log("------ NunyaBusiness - receive() msg.value:", msg.value);
    }
}
