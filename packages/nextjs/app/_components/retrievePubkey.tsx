import type { NextPage } from "next";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { MAX_GAS_PER_CALL, convertToBigint } from "~~/utils/helpers";
import { Hash } from "viem";

const RetrievePubkey: NextPage = () => {
  const { writeContractAsync } = useScaffoldWriteContract("NunyaBusiness");
  const handleRetrievePubkey = async (event: React.FormEvent) => {
    event.preventDefault();
    let failed = false;
    let requestId: Hash | undefined;
    try {
      // TODO: Replicate ./packages/secret-contracts-scripts/src/submitRetrievePubkey.ts
      // similar to:
      // - https://github.com/writersblockchain/evm-kv-store-demo/blob/main/kv-store-frontend/src/functions/submit.js
      // - https://github.com/SecretFoundation/VRFDemo/blob/6f396e7174fcad297e26455e11b1fa3814ceea16/src/submit.ts#L124
      requestId = await writeContractAsync({
        functionName: "unsafeRequestSecretContractPubkey",
        value: MAX_GAS_PER_CALL,
        args: [],
      });
      console.log("⚡ Request ID: ", requestId);
      if (!requestId) {
        return console.error("No request ID returned.");
      }
    } catch (e) {
      failed = true;
    }
  };

  useScaffoldWatchContractEvent({
    contractName: "NunyaBusiness",
    eventName: "RetrievePubkey",
    onLogs: logs => {
      logs.forEach(log => {
        if (log.args.code != 0) {
          return console.error("creating failed", log);
        }
        if (!log.args.requestId) {
          return console.error("No request ID returned", log);
        }
        console.log("📡 Request ID: " + log.args.requestId);
      });
    },
  });

  return (
    <>
      <h2 className="text-center text-2xl mt-8">Retrieve Pubkey</h2>
      <form onSubmit={handleRetrievePubkey} className="flex flex-col items-center mb-8 mx-5 space-y-4">
        <section className="flex flex-col space-y-3">
          <button
            className="btn bg-blue-600 text-white hover:bg-blue-700 transition duration-200 p-3 rounded-md"
            type="submit"
          >
            Retrieve Pubkey
          </button>
        </section>
      </form>
    </>
  );
};

export default RetrievePubkey;
