import * as dotenv from "dotenv";
dotenv.config();
import { requestNunya } from "./requestNunya.js";
import { RequestParams } from "./types/index.js";

async function unsafeSubmitRequestPubkey() {
  const params: RequestParams = {
    requestFunctionName: "unsafeRequestSecretContractPubkey",
    requestEthValue: "2.5000",
    // TODO: Rename to "retrieve_pubkey" in all relevant locations
    secretContractRequestHandle: "retrievePubkey",
    secretContractRequestHandleArgs: {},
    callbackSelectorName: "fulfilledSecretContractPubkeyCallback",
    callbackGasLimitAmount: 30000000,
  }

  const res = await requestNunya(params);
  console.log("res: ", res);
}

async function main() {
  await unsafeSubmitRequestPubkey();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
