import { SecretNetworkClient } from "secretjs";

type EphemeralKeys = {
  encryption_key: string,
  verification_key: string,
}

export const getSecretGatewayPubkey = async (params: any) => {
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

