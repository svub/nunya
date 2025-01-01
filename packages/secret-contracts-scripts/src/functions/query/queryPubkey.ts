import { SecretNetworkClient } from "secretjs";
import config from '../../config/config.js';
import { loadDeployed } from "../../loadDeployed.js";

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
  // console.log(query_tx);
  return query_tx;
}

async function main() {
  let deployed = await loadDeployed();
  let varsDeployedSecret;
  if (deployed.data.secret.network == "testnet") {
    varsDeployedSecret = deployed.data.secret.testnet;
  } else if (deployed.data.secret.network == "localhost") {
    varsDeployedSecret = deployed.data.secret.localhost;
  } else {
    throw new Error(`Unsupported network.`)
  }
  const { chainId: secretChainId, endpoint: secretEndpoint, secretNunya: { nunyaContractCodeId, nunyaContractAddress, nunyaContractCodeHash } } = varsDeployedSecret;

  
  let params = {
    endpoint: secretEndpoint,
    chainId: secretChainId,
    contractAddress: nunyaContractAddress,
    contractCodeHash: nunyaContractCodeHash,
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
