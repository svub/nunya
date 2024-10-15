import { useState } from "react";
import { useGlobalState } from "../services/store/store";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { convertToBigint } from "~~/utils/convert";

interface WithdrawalRequest {
  amount: string;
  address: bigint;
}

const Withdraw: NextPage = () => {
  const [amount, setAmount] = useState("");
  const [address, setReturnAddress] = useState("");
  const [confirmation, setConfirmation] = useState<WithdrawalRequest | undefined>();
  const { writeContractAsync } = useScaffoldWriteContract("NunyaBusiness");
  // const encoder: TextEncoder = new global.TextEncoder();
  // const decoder: TextDecoder = new global.TextDecoder();

  const { secret, setSecret } = useGlobalState();
  const openRequests = new Map<bigint, WithdrawalRequest>();

  const handleWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();

    // const encryptedSecret: ArrayBuffer = await encrypt(encoder.encode(secret));
    const requestId = await writeContractAsync({
      functionName: "withdrawTo",
      // TODO args: [encoder.encode(secret) ...
      args: [secret, parseEther(amount), convertToBigint(address), "ETH"],
    });
    console.log("⚡ Requesting new account", requestId, secret, parseEther(amount), address);
    if (!requestId) {
      return console.error("No request ID returned.");
    }
    openRequests.set(convertToBigint(requestId), { amount, address: convertToBigint(address) });
  };

  useScaffoldWatchContractEvent({
    contractName: "NunyaBusiness",
    eventName: "WithdrawalProcessed",
    onLogs: logs => {
      logs.forEach(log => {
        if (log.args.code != 0) {
          // TODO UI feedback
          return console.error("creating failed", log);
        }
        if (!log.args.requestId) {
          // TODO UI feedback
          return console.error("No request ID returned", log);
        }
        // FIXME args.requestId is bigint, but the return type of writeContractAsync(...) is `0x{string}`
        const request = openRequests.get(log.args.requestId);
        if (!request) {
          // TODO UI feedback
          return console.error("No pending request found.", log);
        }

        if (!log.args.amount) {
          // TODO UI feedback
          return console.error("No withdrawal amount returned.", log);
        }

        request.amount = formatEther(log.args.amount);
        console.log("📡 Withdrawal completed: " + request);
        setConfirmation(request);
      });
    },
  });

  return (
    <>
      <h2 className="text-center text-2xl mt-8">Withdraw</h2>
      <form onSubmit={handleWithdrawal} className="flex flex-col items-center mb-8 mx-5 space-y-4">
        <div className="flex flex-col space-y-3">
          <input
            className="border bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={secret}
            placeholder="Your secret..."
            onChange={e => setSecret(e.target.value)}
          />
          <input
            className="border  bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={amount}
            placeholder="Amount to withdraw..."
            onChange={e => setAmount(e.target.value)}
          />
          <input
            className="border  bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={address}
            placeholder="Return address..."
            onChange={e => setReturnAddress(e.target.value)}
          />
          <button
            className="btn bg-blue-600 text-white hover:bg-blue-700 transition duration-200 p-3 rounded-md"
            type="submit"
          >
            Withdraw
          </button>
        </div>
      </form>
      {confirmation ? (
        <>
          <h3>Withdrawal confirmed</h3>
          <p>
            Address: {confirmation.address}, amount: {confirmation.amount} ETH.
          </p>
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default Withdraw;
