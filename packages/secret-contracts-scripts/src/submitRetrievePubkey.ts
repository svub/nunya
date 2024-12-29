import * as dotenv from "dotenv";
dotenv.config();
import { requestNunya } from "./functions/evm/requestNunya.js";
import { RequestParams } from "./types/index.js";

async function unsafeSubmitRetrievePubkey() {
  const params: RequestParams = {
    requestFunctionName: "unsafeRequestSecretContractPubkey",
    requestEthValue: "2.5000",
    // TODO: Rename to "retrieve_pubkey" in all relevant locations
    secretContractRequestHandle: "retrievePubkey",
    secretContractRequestHandleArgs: {},
    callbackSelectorName: "fulfilledSecretContractPubkeyCallback",
    callbackGasLimitAmount: 30000000,
  }

  await requestNunya(params);
}

async function main() {
  await unsafeSubmitRetrievePubkey();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
