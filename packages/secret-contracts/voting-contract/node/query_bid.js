import { SecretNetworkClient } from "secretjs";
import dotenv from "dotenv";
dotenv.config();

let query = async () => {
  const secretjs = new SecretNetworkClient({
    url: "https://lcd.testnet.secretsaturn.net",
    chainId: "pulsar-3",
  });

  const query_tx = await secretjs.query.compute.queryContract({
    contract_address: process.env.SECRET_ADDRESS,
    code_hash: process.env.CODE_HASH,
    query: { retrieve_bids: { key: 1 } },
  });
  console.log(query_tx);
};

query();
