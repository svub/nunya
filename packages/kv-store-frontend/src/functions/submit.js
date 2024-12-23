import { ethers } from "ethers";
import abi from "../config/abi";
import { generateKeys } from "../functions/secretpath/generateKeys";
import { getPublicClientAddress } from "../functions/secretpath/getPublicClientAddress";
import { constructPayload } from "../functions/secretpath/constructPayload";
import { encryptPayload } from "../functions/secretpath/encryptPayload";
import { hexlify } from "ethers/lib/utils";

export async function handleSubmit(e, key, value, viewing_key) {
  e.preventDefault();

  const routing_contract = process.env.REACT_APP_SECRET_ADDRESS;
  const routing_code_hash = process.env.REACT_APP_CODE_HASH;
  const iface = new ethers.utils.Interface(abi);
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  const [myAddress] = await provider.send("eth_requestAccounts", []);

  const { userPrivateKeyBytes, userPublicKeyBytes, sharedKey } =
    await generateKeys();

  const callbackSelector = iface.getSighash(
    iface.getFunction("upgradeHandler")
  );

  console.log("callbackSelector: ", callbackSelector);

  const callbackGasLimit = 90000;
  // The function name of the function that is called on the private contract
  const handle = "store_value";

  // Data are the calldata/parameters that are passed into the contract
  const data = JSON.stringify({
    key: key,
    value: value,
    viewing_key: viewing_key
  });

  const chainId = (await provider.getNetwork()).chainId.toString();

  const publicClientAddress = await getPublicClientAddress(chainId);

  const callbackAddress = publicClientAddress.toLowerCase();
  console.log("callback address: ", callbackAddress);

  // Payload construction
  const payload = constructPayload(
    data,
    routing_contract,
    routing_code_hash,
    myAddress,
    userPublicKeyBytes,
    callbackAddress,
    callbackSelector,
    callbackGasLimit
  );

  const {
    ciphertext,
    payloadHash,
    payloadSignature,
    _info,
  } = await encryptPayload(
    payload,
    sharedKey,
    provider,
    myAddress,
    userPublicKeyBytes,
    routing_code_hash,
    handle,
    callbackGasLimit,
    iface,
    callbackSelector
  );

  const functionData = iface.encodeFunctionData("send", [
    payloadHash,
    myAddress,
    routing_contract,
    _info,
  ]);

  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  const gasFee =
    maxFeePerGas && maxPriorityFeePerGas
      ? maxFeePerGas.add(maxPriorityFeePerGas)
      : await provider.getGasPrice();
      let amountOfGas; 
      let my_gas = 150000;
      
      if (chainId === "4202") {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
      } else if (chainId === "128123") {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
        my_gas = 15000000;
      } else if (chainId === "1287") {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
        my_gas = 15000000;
      } else if (chainId === "300") {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(100000).div(2);
        my_gas = 15000000;
      } else if (chainId === "5003") {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(1000000).div(2);
        my_gas = 1500000000;
      } else if (chainId === "80002") {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
        console.log("amountOfGas: ", amountOfGas);
      } else if (chainId === "1995") {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
        my_gas = 200000;
      } 
      else if (chainId === "713715") {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
        my_gas = 200000;
      } 

      else if (chainId === "421614") {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(25).div(2);
        my_gas = 300000;
      } 
      else {
        amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);
      }
      
      const tx_params = {
        gas: hexlify(my_gas),
        to: publicClientAddress,
        from: myAddress,
        value: hexlify(amountOfGas),
        data: functionData,
      };
      
      console.log("tx_params: ", tx_params.value);
      
      const txHash = await provider.send("eth_sendTransaction", [tx_params]);
      console.log(`Transaction Hash: ${txHash}`);

}