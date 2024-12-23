// constructPayload.js
import { bytes_to_base64 } from "@blake.regalia/belt";
import { arrayify } from "ethers/lib/utils";

export function constructPayload(
  data,
  routing_contract,
  routing_code_hash,
  myAddress,
  userPublicKeyBytes,
  callbackAddress,
  callbackSelector,
  callbackGasLimit
) {
  const payload = {
    data: data,
    routing_info: routing_contract,
    routing_code_hash: routing_code_hash,
    user_address: myAddress,
    user_key: bytes_to_base64(userPublicKeyBytes),
    callback_address: bytes_to_base64(arrayify(callbackAddress)),
    callback_selector: bytes_to_base64(arrayify(callbackSelector)),
    callback_gas_limit: callbackGasLimit,
  };

  return payload;
}