import { SecretNetworkClient } from "secretjs";
import config from '../../config/deploy.js';

export const queryPubkey = async (params: any) => {
  const secretjs = new SecretNetworkClient({
    url: params.endpoint,
    chainId: params.chainId,
  });
  const query_tx: Uint32Array = await secretjs.query.compute.queryContract({
    contract_address: params.contractAddress,
    code_hash: params.contractCodeHash,
    query: { get_public_keys: {} },
  });
  // console.log(query_tx);
  return query_tx;
}

async function main() {
  const { chainId, endpoint, secretGateway: { gatewayContractAddress, gatewayContractCodeHash } } =
    config.secret.network == "testnet"
    ? config.secret.testnet
    : config.secret.localhost;

  let params = {
    endpoint: endpoint,
    chainId: chainId,
    contractAddress: gatewayContractAddress,
    contractCodeHash: gatewayContractCodeHash,
  };

  // Chain the execution using promises
  await queryPubkey(params)
    .then(async (res) => {
      console.log('res queryPubkey: ', res);
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
