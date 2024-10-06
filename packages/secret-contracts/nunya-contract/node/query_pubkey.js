import { SecretNetworkClient } from "secretjs";
import dotenv from "dotenv";
dotenv.config();

let query = async () => {
  const secretjs = new SecretNetworkClient({
    url: "https://api.pulsar3.scrttestnet.com",
    chainId: "pulsar-3",
  });

  const query_tx = await secretjs.query.compute.queryContract({
    contract_address: process.env.SECRET_ADDRESS,
    code_hash: process.env.CODE_HASH,
    query: { retrieve_pubkey_query: { key: 1 } },
  });
  console.log(query_tx);
};

query();
