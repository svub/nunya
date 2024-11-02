import { SecretNetworkClient } from "secretjs";

// Replace with deployed Secret contract details
const SECRET_ADDRESS = "secret1uwqdjnzrttepn86p2sjmnugfph7tz97hmcwjs3"
const CODE_HASH = "1af180cc6506af23fb3ee2c0f6ece37ab3ad32db82e061b6b30679fb8a3f1323"

let query_pubkey = async (secretjs, params) => {
  const query_tx = await secretjs.query.compute.queryContract({
    contract_address: params.contractAddress,
    code_hash: params.contractCodeHash,
    query: { retrieve_pubkey: {} },
  });
  console.log(query_tx);
  return query_tx;
}

async function main() {
  let contractParams = {
    contractAddress: SECRET_ADDRESS,
    contractCodeHash: CODE_HASH,
  };

  const secretjs = new SecretNetworkClient({
    url: "https://lcd.testnet.secretsaturn.net",
    chainId: "pulsar-3",
  });

  // Chain the execution using promises
  await query_pubkey(secretjs, contractParams)
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
