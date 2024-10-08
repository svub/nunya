"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { EtherInput } from "~~/components/scaffold-eth";
import { useScaffoldWatchContractEvent, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { fetchPriceFromUniswap } from "~~/utils/scaffold-eth";

declare global {
  interface Window {
    temp: unknown;
  }
}

type PageProps = {
  params: {
    paymentReference: string;
    amount: number;
    currency: string;
  };
};

const PaymentPage: NextPage<PageProps> = ({ params }: PageProps) => {
  const paymentReferenceParam = params?.paymentReference as string;
  const amountParam = params?.amount as number;
  const currencyParam = params?.currency as string;

  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  // const [currency, setCurrency] = useState("ETH");
  const [receipt, setReceipt] = useState(""); // TODO define struct of receipt
  // const { writeContractAsync } = useScaffoldWriteContract("NunyaBusiness");
  const { targetNetwork } = useTargetNetwork();
  // const encoder: TextEncoder = new global.TextEncoder();

  useEffect(() => {
    setReference(paymentReferenceParam);

    if (currencyParam === "USD") {
      // convert amount to ETH
      fetchPriceFromUniswap(targetNetwork).then(price => {
        console.log("Convert to ETH", amountParam, price, amountParam / price);
        if (price > 0) setAmount(amountParam / price + "");
        else console.error("Couldn't fetch ETH price.");
      });
    } else {
      setAmount(amountParam + "");
    }

    // setCurrency(currencyParam || "ETH");
  }, []);

  const handlePay = async (event: React.FormEvent) => {
    event.preventDefault();

    // TODO
    // await writeContractAsync({
    //   functionName: "pay",
    //   value: parseEther(amount),
    //   args: [encoder.encode(reference)],
    // });
  };

  useScaffoldWatchContractEvent({
    contractName: "NunyaBusiness",
    // TODO
    // eventName: "payment-receipt-received",
    eventName: "RequestSuccess",
    onLogs: logs => {
      logs.forEach(() => {
        // const { receiptBytes } = log.args;
        // TODO extract the huamn readable part, show the bytes somehow (v2: show as QR code or write as file for book keeping)
        const receipt = "123"; // decoder.decode(receiptBytes as ArrayBuffer);
        console.log("📡 Payment Receipt " + receipt + " created");
        setReceipt(receipt);
      });
    },
  });

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

        <h3 className="text-center text-2xl mt-8">Make a Payment</h3>
        <form onSubmit={handlePay} className="flex flex-col items-center mb-8 mx-5 space-y-4">
          <div className="flex flex-col items-center justify-center space-y-3">
            <input
              className="border bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={reference}
              placeholder="Your payment reference..."
              onChange={e => setReference(e.target.value)}
            />
            <EtherInput value={amount} onChange={amount => setAmount(amount)} />
            <button
              className="btn bg-blue-600 text-white hover:bg-blue-700 transition duration-200 p-3 rounded-md"
              type="submit"
            >
              Pay Bill Now
            </button>
          </div>
          {receipt ? (
            <>
              <p className="text-center">Receipt: {receipt}</p>
            </>
          ) : (
            <></>
          )}
        </form>
      </div>
    </>
  );
};

export default PaymentPage;
