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
  const [returnAddress, setReturnAddress] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const [latestReference, setLastestReference] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReceipt, setPaymentReceipt] = useState("");
  const { writeContractAsync } = useScaffoldWriteContract("PayWithEth");

  const encoder: TextEncoder = new global.TextEncoder();
  const decoder: TextDecoder = new global.TextDecoder();

  useScaffoldWatchContractEvent({
    contractName: "nunya",
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
    contractName: "nunya",
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
      <h1 className="text-center">
        <span className="block text-4xl font-bold">Nunya.business</span>
        <span className="block text-2xl mb-2">Receive Business Payments</span>
      </h1>
      <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
        <p className="my-2 font-medium">... while not reveiling what you earned from others.</p>
      </div>

      <h2 className="text-center text-xl mt-8">Make a payment</h2>
      <p className="text-center text-lg">
        <form onSubmit={handlePay} className="flex items-center justify-end mb-5 space-x-3 mx-5">
          <input
            className="border-primary bg-base-100 text-base-content p-2 mr-2 w-full md:w-1/2 lg:w-1/3 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
            type="text"
            value={paymentReference}
            placeholder="Your secret..."
            onChange={e => setPaymentReference(e.target.value)}
          />
          <EtherInput value={paymentAmount} onChange={amount => setPaymentAmount(amount)} />
          <button className="btn btn-sm btn-primary" type="submit">
            Pay bill now.
          </button>
        </form>
      </p>
      <p>Receipt: {paymentReceipt}</p>

      <h2 className="text-center text-xl mt-8">Create reference</h2>
      <p className="text-center text-lg">
        <form onSubmit={handleWithdrawal} className="flex items-center justify-end mb-5 space-x-3 mx-5">
          <input
            className="border-primary bg-base-100 text-base-content p-2 mr-2 w-full md:w-1/2 lg:w-1/3 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
            type="text"
            value={secret}
            placeholder="Your secret..."
            onChange={e => setSecret(e.target.value)}
          />
          <button className="btn btn-sm btn-primary" type="submit">
            Create new billing reference
          </button>
        </form>
      </p>
      <p>Reference: {latestReference}</p>

      <h2 className="text-center text-xl mt-8">Withdraw</h2>
      <p className="text-center text-lg">
        <form onSubmit={handleWithdrawal} className="flex items-center justify-end mb-5 space-x-3 mx-5">
          <input
            className="border-primary bg-base-100 text-base-content p-2 mr-2 w-full md:w-1/2 lg:w-1/3 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
            type="text"
            value={secret}
            placeholder="Your secret..."
            onChange={e => setSecret(e.target.value)}
          />
          <input
            className="border-primary bg-base-100 text-base-content p-2 mr-2 w-full md:w-1/2 lg:w-1/3 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
            type="text"
            value={returnAmount}
            placeholder="Amount to withdraw..."
            onChange={e => setReturnAmount(e.target.value)}
          />
          <input
            className="border-primary bg-base-100 text-base-content p-2 mr-2 w-full md:w-1/2 lg:w-1/3 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
            type="text"
            value={returnAddress}
            placeholder="Return address..."
            onChange={e => setReturnAddress(e.target.value)}
          />
          <button className="btn btn-sm btn-primary" type="submit">
            Withdraw
          </button>
        </form>
      </p>

      {/* <Link href="/debug" passHref className="link">Debug</Link>
      <BugAntIcon className="h-8 w-8 fill-secondary" />
      <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" /> */}
    </>
  );
};

export default Home;
