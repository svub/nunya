// IDEA Maybe it should be called GatewayContract? Or GatewayInterface
interface ISecretContract {
    function newSecretUser(uint256 secret) external returns (uint256);
    function createPaymentReference(uint256 secret) external returns (uint256);
    function pay(string calldata ref, uint256 amount) external returns (uint256);
    function payWithReceipt(string calldata ref, uint256 amount, uint256 userPubkey) external returns (uint256);
    function withdraw(string calldata secret, uint256 amount, address withdrawalAddress) external returns (uint256);
    function retrievePubkey() external returns (uint256);
}
