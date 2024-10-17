// querySecret.js
import { SecretNetworkClient } from "secretjs";

const SECRET_ADDRESS = "secret1uwqdjnzrttepn86p2sjmnugfph7tz97hmcwjs3"
const CODE_HASH = "1af180cc6506af23fb3ee2c0f6ece37ab3ad32db82e061b6b30679fb8a3f1323"

export const queryPubkey = async () => {
  const secretjs = new SecretNetworkClient({
    url: "https://api.pulsar.scrttestnet.com",
    chainId: "pulsar-3",
  });

  try {
    const query_tx = await secretjs.query.compute.queryContract({
      contract_address: SECRET_ADDRESS,
      code_hash: CODE_HASH,
      query: { retrieve_pubkey: {} },
    });
    return query_tx; // Return the fetched
  } catch (error) {
    console.error("Error fetching pubkey:", error);
    return 1; // Return a default value in case of error
  }
};
