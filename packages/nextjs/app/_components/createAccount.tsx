import { useState } from "react";
import { useGlobalState } from "../../services/store/store";
import type { NextPage } from "next";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { convertToBigint, MAX_GAS_PER_CALL } from "~~/utils/helpers";

interface AccountCreationRequest {
  secret: string;
}

const CreateAccount: NextPage = () => {
  const [confirmation, setConfirmation] = useState<AccountCreationRequest | undefined>();
  const { writeContractAsync } = useScaffoldWriteContract("NunyaBusiness");

  const { secret, setSecret } = useGlobalState();
  const openRequests = new Map<bigint, AccountCreationRequest>();

  // create new nunya account for the given secret ////////////////////////////

  const handleCreateAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!secret) {
      // TODO UI feedback
      return console.error("Provide a secret.");
    }

    // const encryptedSecret: ArrayBuffer = await encrypt(encoder.encode(secret));
    const requestId = await writeContractAsync({
      functionName: "newSecretUser",
      value: MAX_GAS_PER_CALL,
      // FIXME encrypt parameters before sending
      args: [secret],
    });
    console.log("⚡ Requesting new account", requestId, secret);
    if (!requestId) {
      // TODO UI feedback
      return console.error("No request ID returned.");
    }
    // FIXME requestId should be bigint but the return type is `0x{string}`
    openRequests.set(convertToBigint(requestId), { secret });
  };

  // wait for the event confirming the account creation ///////////////////////

  useScaffoldWatchContractEvent({
    contractName: "NunyaBusiness",
    eventName: "AccountCreated",
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
        // @ts-ignore
        // FIXME - type error
        const request = openRequests.get(log.args.requestId);
        if (!request) {
          // TODO UI feedback
          return console.error("No pending request found.", log);
        }
        console.log("📡 Withdrawal completed: " + request);
        setConfirmation(request);
      });
    },
  });

  return (
    <>
      <h2 className="text-center text-2xl mt-8">Create Account</h2>
      <form onSubmit={handleCreateAccount} className="flex flex-col items-center mb-8 mx-5 space-y-4">
        <section className="flex flex-col space-y-3">
          <input
            className="border bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={secret}
            placeholder="Your secret..."
            onChange={e => setSecret(e.target.value)}
          />
          <button
            className="btn bg-blue-600 text-white hover:bg-blue-700 transition duration-200 p-3 rounded-md"
            type="submit"
          >
            Create Account
          </button>
        </section>
      </form>
      {confirmation ? (
        <section>
          <h3>Account creation confirmed</h3>
          <p>Secret: {confirmation.secret}.</p>
        </section>
      ) : (
        <></>
      )}
    </>
  );
};

export default CreateAccount;
