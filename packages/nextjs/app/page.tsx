"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import QRCode from "qrcode.react";
import { parseEther } from "viem";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { SupportedCurrencies, createPaymentLink } from "~~/utils/link";

declare global {
  interface Window {
    temp: unknown;
  }
}

const Home: NextPage = () => {
  // const { address: connectedAddress } = useAccount();
  const [secret, setSecret] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState<SupportedCurrencies>("ETH");
  const [returnAddress, setReturnAddress] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const { writeContractAsync } = useScaffoldWriteContract("NunyaBusiness");
  // const encoder: TextEncoder = new global.TextEncoder();
  // const decoder: TextDecoder = new global.TextDecoder();

  useScaffoldWatchContractEvent({
    contractName: "NunyaBusiness",
    eventName: "PaymentReferenceCreated",
    onLogs: logs => {
      logs.forEach(() => {
        // TODO decode the receipt struct as defined in NunyaBusiness.sol
        // const { referenceBytes } = log.args;
        const reference = "123"; // decoder.decode(referenceBytes as ArrayBuffer);
        console.log("📡 Reference " + reference + " created");
        setPaymentReference(reference);
      });
    },
  });

  useEffect(() => {
    const link = createPaymentLink(paymentReference, paymentAmount, paymentCurrency);
    setPaymentLink(link);
  }, [paymentReference, paymentAmount, paymentCurrency]);

  const handleWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();

    // const { writeContractAsync } = useScaffoldWriteContract("PayWithEth");
    // writeContractAsync({ functionName: "withdraw" });

    // const encryptedSecret: ArrayBuffer = await encrypt(encoder.encode(secret));
    await writeContractAsync({
      // TODO
      // functionName: "withdraw",
      functionName: "withdrawTo",
      // value: parseEther(returnAmount),
      // TODO args: [encoder.encode(secret) ...
      args: [secret, parseEther(returnAmount), returnAddress],
    });
  };

  return (
    <>
      <div className="bg-base-200 min-h-screen flex flex-col justify-center py-10 w-full">
        <h1 className="text-center">
          <span className="block text-5xl font-bold">Nunya.business</span>
          <span className="block text-3xl bg-base-100 mb-4">Receive Business Payments</span>
        </h1>
        <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row mb-8">
          <p className="my-2 font-medium text-base">... without revealing to other clients what you&apos;ve earned.</p>
        </div>

        <p className="text-base">Create a payment link and add it to your invoice to start receiving payments.</p>

        <h2 className="text-center text-2xl mt-8">Create Payment Link</h2>
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
              className="border bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={paymentAmount}
              placeholder="How much do you charge?"
              onChange={e => setPaymentAmount(e.target.value)}
            />
            <div className="flex flex-row space-x-3">
              <div>
                <input
                  type="radio"
                  id="ethCurrency"
                  checked={paymentCurrency == "ETH"}
                  name="currency"
                  onChange={() => setPaymentCurrency("ETH")}
                />
                <label htmlFor="ethCurrency" className="text-lg">
                  ETH
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  id="usdCurrency"
                  checked={paymentCurrency == "USD"}
                  name="currency"
                  onChange={() => setPaymentCurrency("USD")}
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
              Create new Payment Link
            </button>
          </div>
          {paymentReference ? (
            <div>
              <p className="text-center text-gray-600">
                Reference: {paymentReference}, amount: {paymentAmount}, currency: {paymentCurrency}, payment link:{" "}
                <a href={paymentLink} target="_blank">
                  {paymentLink}
                </a>
              </p>
              <p className="text-center text-gray-600">
                QR code: <QRCode value={paymentLink} size={256} />
              </p>
            </div>
          ) : (
            <></>
          )}
        </form>

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
              value={returnAmount}
              placeholder="Amount to withdraw..."
              onChange={e => setReturnAmount(e.target.value)}
            />
            <input
              className="border  bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={returnAddress}
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

        {/* Uncomment if needed
        <Link href="/debug" passHref className="link text-blue-500 hover:underline">
          Debug
        </Link>
        <BugAntIcon className="h-8 w-8 fill-secondary" />
        <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
        */}
      </div>
    </>
  );
};

export default Home;
