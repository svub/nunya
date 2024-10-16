import { useState } from "react";
import { PaymentReference, useGlobalState } from "../../services/store/store";
import type { NextPage } from "next";
import QRCode from "qrcode.react";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { MAX_GAS_PER_CALL, convertToBigint } from "~~/utils/helpers";
import { SupportedCurrencies, createPaymentLink } from "~~/utils/link";
import { Hash } from "viem";

const CreatePaymentReference: NextPage = () => {
  const [desiredReference, setDesiredReference] = useState("");
  const [amount, setAmount] = useState<number>(0.0);
  const [currency, setCurrency] = useState<SupportedCurrencies>("ETH");
  const { writeContractAsync } = useScaffoldWriteContract("NunyaBusiness");

  const { secret, setSecret, references, addReference } = useGlobalState();
  const openRequests = new Map<bigint, PaymentReference>();

  // create payment reference /////////////////////////////////////////////////

  const handleCreatePaymentReference = async (event: React.FormEvent) => {
    event.preventDefault();
    let failed = false;
    let requestId: Hash | undefined;
    try {
      requestId = await writeContractAsync({
        functionName: "createPaymentReference",
        // FIXME: estimate the amount of gas required for forward fees
        value: MAX_GAS_PER_CALL,
        // FIXME args: [encoder.encode(secret) ...
        args: [secret, desiredReference],
      });
      console.log("⚡ Payment reference created", requestId, secret, amount, currency, desiredReference);
      if (!requestId) {
        // TODO UI feedback
        return console.error("No request ID returned.");
      }
      // FIXME returned requestId should be bigint but return type of writeContractAsync(...) is `0x{string}`
      openRequests.set(convertToBigint(requestId), { amount, currency, reference: "loading..." });
    } catch (e) {
      failed = true;
    }
    setTimeout(() => {
      if (failed || !requestId || openRequests.has(convertToBigint(requestId))) {
        // FIXME if the request fails or times out, show demo data
        addReference({ amount, currency, reference: desiredReference });
      }
    }, 5000);
  };

  // watch for an event that confirms that the reference has been created /////

  useScaffoldWatchContractEvent({
    contractName: "NunyaBusiness",
    eventName: "PaymentReferenceCreated",
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
        const request = openRequests.get(log.args.requestId);
        if (!request) {
          // TODO UI feedback
          return console.error("No pending request found", log);
        }
        openRequests.delete(log.args.requestId);
        const reference = log.args.ref; // needs decoding? decoder.decode(referenceBytes as ArrayBuffer);
        if (!reference) {
          // TODO UI feedback
          return console.error("No reference returned", log);
        }
        console.log("📡 Payment reference created: " + reference);
        request.reference = reference;
        addReference(request);
      });
    },
  });

  return (
    <>
      <h2 className="text-center text-2xl mt-8">Create Payment Reference</h2>
      <form onSubmit={handleCreatePaymentReference} className="flex flex-col items-center mb-8 mx-5 space-y-4">
        <section className="flex flex-col space-y-3">
          <input
            className="border bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={secret}
            placeholder="Your secret..."
            onChange={e => setSecret(e.target.value)}
          />
          <input
            className="border bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number"
            step="any"
            value={amount}
            placeholder="How much do you charge?"
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) setAmount(v);
            }}
          />
          <input
            className="border bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={desiredReference}
            placeholder="Desired reference (optional, will fail if it already exists)"
            onChange={e => setDesiredReference(e.target.value)}
          />
          <div className="flex flex-row space-x-3">
            <div>
              <input
                type="radio"
                id="ethCurrency"
                checked={currency == "ETH"}
                name="currency"
                onChange={() => setCurrency("ETH")}
              />
              <label htmlFor="ethCurrency" className="text-lg">
                ETH
              </label>
            </div>
            <div>
              <input
                type="radio"
                id="usdCurrency"
                checked={currency == "USD"}
                name="currency"
                onChange={() => setCurrency("USD")}
              />
              <label htmlFor="usdCurrency" className="text-lg">
                USD
              </label>
            </div>
          </div>
          <button
            className="btn bg-blue-600 text-white hover:bg-blue-700 transition duration-200 p-3 rounded-md"
            type="submit"
          >
            Create New Payment Reference
          </button>
        </section>
      </form>
      {references.length > 0 ? (
        <section>
          <h3 className="text-center text-xl mt-8">Your payment references</h3>
          <ul>
            {references.map((ref, index) => (
              <li key={index}>
                <p>Reference <b>{ref.reference}</b> for {ref.amount} {ref.currency}</p>
                <p className="text-center">Payment link and QR code:{" "}
                  <a href={createPaymentLink(ref)} target="_blank" className="block">
                    {createPaymentLink(ref)}
                  </a>
                  <QRCode value={createPaymentLink(ref)} size={256} className="inline-block" />
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <></>
      )}
    </>
  );
};

export default CreatePaymentReference;
