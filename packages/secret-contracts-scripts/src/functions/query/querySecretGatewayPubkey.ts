import { SecretNetworkClient } from "secretjs";
import config from '../../config/config.js';

type EphemeralKeys = {
  encryption_key: string,
  verification_key: string,
}

export const querySecretGatewayPubkey = async (params: any) => {
  const secretjs = new SecretNetworkClient({
    url: params.endpoint,
    chainId: params.chainId,
  });
  const query_tx: EphemeralKeys = await secretjs.query.compute.queryContract({
    contract_address: params.contractAddress,
    code_hash: params.contractCodeHash,
    query: { get_public_keys: {} },
  });
  // console.log(query_tx);
  return query_tx;
}

async function main() {
  const { chainId, endpoint, secretGateway: { gatewayContractAddress, gatewayContractCodeHash } } =
    config.networkSettings.secret.network == "testnet"
    ? config.networkSettings.secret.testnet
    : config.networkSettings.secret.localhost;

  let params = {
    endpoint: endpoint,
    chainId: chainId,
    contractAddress: gatewayContractAddress,
    contractCodeHash: gatewayContractCodeHash,
  };

  // Chain the execution using promises
  await querySecretGatewayPubkey(params)
    .then(async (res) => {
      console.log('res querySecretGatewayPubkey: ', res);
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  process.exit()
}
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
