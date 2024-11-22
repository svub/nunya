import { SecretNetworkClient } from "secretjs";
import config from '../../config/deploy';

export const queryPubkey = async (params: any) => {
  const secretjs = new SecretNetworkClient({
    url: params.endpoint,
    chainId: params.chainId,
  });
  const query_tx: Uint32Array = await secretjs.query.compute.queryContract({
    contract_address: params.contractAddress,
    code_hash: params.contractCodeHash,
    query: { retrieve_pubkey: {} },
  });
  console.log(query_tx);
  return query_tx;
}

async function main() {
  const { chainId, codeId, contractCodeHash, endpoint, secretContractAddress } =
    config.secret.network == "testnet"
    ? config.secret.testnet
    : config.secret.local;

  // Replace with deployed Secret contract details
  const SECRET_ADDRESS = secretContractAddress;
  const CONTRACT_CODE_HASH = contractCodeHash;

  let params = {
    endpoint: endpoint,
    chainId: chainId,
    contractAddress: SECRET_ADDRESS,
    contractCodeHash: CONTRACT_CODE_HASH,
  };

  // Chain the execution using promises
  await queryPubkey(params)
    .then(async (res) => {
      console.log('res: ', res);
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
