import * as dotenv from "dotenv";
dotenv.config();
import { requestNunya } from "./requestNunya.js";
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

  const res = await requestNunya(params);
  console.log("res: ", res);
}

async function main() {
  await unsafeSubmitRequestValue();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
