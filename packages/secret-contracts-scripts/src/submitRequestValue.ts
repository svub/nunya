import * as dotenv from "dotenv";
dotenv.config();
import { requestNunya } from "./functions/evm/requestNunya.js";
import { RequestParams } from "./types/index.js";

async function unsafeSubmitRequestValue() {
  const params: RequestParams = {
    requestFunctionName: "unsafeRequestValue",
    requestEthValue: "2.5000",
    secretContractRequestHandle: "request_value",
    secretContractRequestHandleArgs: { myArg: "123" },
    callbackSelectorName: "fulfilledValueCallback",
    callbackGasLimitAmount: 30000000,
  }

  await requestNunya(params);
}

async function main() {
  await unsafeSubmitRequestValue();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
