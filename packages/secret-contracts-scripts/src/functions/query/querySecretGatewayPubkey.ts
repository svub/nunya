import { SecretNetworkClient } from "secretjs";
import { loadDeployed } from "../../loadDeployed.js";

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
  let deployed = await loadDeployed();
  let varsDeployedSecret;
  if (deployed.data.secret.network == "testnet") {
    varsDeployedSecret = deployed.data.secret.testnet;
  } else if (deployed.data.secret.network == "localhost") {
    varsDeployedSecret = deployed.data.secret.localhost;
  } else {
    throw new Error(`Unsupported network.`)
  }
  const { chainId: secretChainId, endpoint: secretEndpoint, secretGateway: { gatewayContractAddress, gatewayContractCodeHash } } = varsDeployedSecret;

  let params = {
    endpoint: secretEndpoint,
    chainId: secretChainId,
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
