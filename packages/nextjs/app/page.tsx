"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { TextEncoder } from "util";
import { parseEther } from "viem";
import { EtherInput } from "~~/components/scaffold-eth";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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
  const [paymentReceipt, setPaymentReceipt] = useState("");
  const [latestReference, setLastestReference] = useState("");
  const [returnAddress, setReturnAddress] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const { writeContractAsync } = useScaffoldWriteContract("NunyaBusiness");

  const encoder: TextEncoder = new global.TextEncoder();
  const decoder: TextDecoder = new global.TextDecoder();

  useScaffoldWatchContractEvent({
    contractName: "NunyaBusiness",
    eventName: "reference-created",
    onLogs: logs => {
      logs.map(log => {
        const { referenceBytes } = log.args;
        const reference: string = decoder.decode(referenceBytes as ArrayBuffer);
        console.log("📡 Reference " + reference + " created");
        setLastestReference(reference);
      });
    },
  });

  const handlePay = async (event: React.FormEvent) => {
    event.preventDefault();

    await writeContractAsync({
      functionName: "pay",
      value: parseEther(paymentAmount),
      args: [encoder.encode(secret), returnAddress],
    });
  };

  useScaffoldWatchContractEvent({
    contractName: "NunyaBusiness",
    eventName: "payment-receipt-received",
    onLogs: logs => {
      logs.map(log => {
        const { receiptBytes } = log.args;
        // TODO extract the huamn readable part, show the bytes somehow (v2: show as QR code or write as file for book keeping)
        const receipt: string = decoder.decode(receiptBytes as ArrayBuffer);
        console.log("📡 Payment Receipt " + receipt + " created");
        setPaymentReceipt(receipt);
      });
    },
  });

  const handleWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();

    // const { writeContractAsync } = useScaffoldWriteContract("PayWithEth");
    // writeContractAsync({ functionName: "withdraw" });

    // const encryptedSecret: ArrayBuffer = await encrypt(encoder.encode(secret));
    await writeContractAsync({
      functionName: "withdraw",
      value: parseEther(returnAmount),
      args: [encoder.encode(secret), returnAddress],
    });
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen flex flex-col justify-center py-10">
        <h1 className="text-center">
          <span className="block text-5xl font-bold text-gray-800">Nunya.business</span>
          <span className="block text-3xl text-gray-600 mb-4">Receive Business Payments</span>
        </h1>
        <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row mb-8">
          <p className="my-2 font-medium text-gray-700">... while not revealing what you earned from others.</p>
        </div>

        <h3 className="text-center text-2xl text-gray-800 mt-8">Make a Payment</h3>
        <form onSubmit={handlePay} className="flex flex-col items-center mb-8 mx-5 space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <input
              className="border border-gray-300 bg-white text-gray-900 p-3 w-full md:w-1/2 lg:w-1/3 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={paymentReference}
              placeholder="Your secret..."
              onChange={e => setPaymentReference(e.target.value)}
            />
            <EtherInput value={paymentAmount} onChange={amount => setPaymentAmount(amount)} />
            <button
              className="btn bg-blue-600 text-white hover:bg-blue-700 transition duration-200 p-3 rounded-md"
              type="submit"
            >
              Pay Bill Now
            </button>
          </div>
          <p className="text-center text-gray-600">Receipt: {paymentReceipt}</p>
        </form>

        <p>Or start receiving your own payments now:</p>

        <h2 className="text-center text-2xl text-gray-800 mt-8">Create Reference</h2>
        <form onSubmit={handleWithdrawal} className="flex flex-col items-center mb-8 mx-5 space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <input
              className="border border-gray-300 bg-white text-gray-900 p-3 w-full md:w-1/2 lg:w-1/3 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={secret}
              placeholder="Your secret..."
              onChange={e => setSecret(e.target.value)}
            />
            <button
              className="btn bg-blue-600 text-white hover:bg-blue-700 transition duration-200 p-3 rounded-md"
              type="submit"
            >
              Create New Billing Reference
            </button>
          </div>
          <p className="text-center text-gray-600">Reference: {latestReference}</p>
        </form>

        <h2 className="text-center text-2xl text-gray-800 mt-8">Withdraw</h2>
        <form onSubmit={handleWithdrawal} className="flex flex-col items-center mb-8 mx-5 space-y-4">
          <div className="flex flex-col space-y-3">
            <input
              className="border border-gray-300 bg-white text-gray-900 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={secret}
              placeholder="Your secret..."
              onChange={e => setSecret(e.target.value)}
            />
            <input
              className="border border-gray-300 bg-white text-gray-900 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={returnAmount}
              placeholder="Amount to withdraw..."
              onChange={e => setReturnAmount(e.target.value)}
            />
            <input
              className="border border-gray-300 bg-white text-gray-900 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
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
