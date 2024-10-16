"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { EtherInput } from "~~/components/scaffold-eth";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { MAX_GAS_PER_CALL } from "~~/utils/helpers";
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
  const [receipt, setReceipt] = useState(""); // TODO define struct of receipt
  const { writeContractAsync } = useScaffoldWriteContract("NunyaBusiness");
  const { targetNetwork } = useTargetNetwork();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setReference(paymentReferenceParam);

    if (currencyParam === "USD") {
      // converting requested amount from USD to ETH //////////////////////////

      fetchPriceFromUniswap(targetNetwork).then(price => {
        console.log("Convert to ETH", amountParam, price, amountParam / price);
        if (price > 0) setAmount(amountParam / price + "");
        else {
          console.error("Couldn't fetch ETH price.");
          // TODO assuming a price for development - remove from production
          setAmount(amountParam / 2412.65183726 + "");
        }
      });
    } else {
      console.log("Inital amount", amountParam);
      setAmount(amountParam + "");
    }
  });

  const handlePay = async (event: React.FormEvent) => {
    event.preventDefault();

    // TODO estimate proper fees
    const toPay = parseEther(amount);
    const value = toPay + MAX_GAS_PER_CALL;
    const pubKey = 0n;
    await writeContractAsync({
      // TODO enable payments w/t receipt
      functionName: "payWithReceipt",
      value,
      // FIXME The user paying doesn't know the secret
      args: ["unknown", reference, toPay, "ETH", pubKey],
    });
  };

  useScaffoldWatchContractEvent({
    contractName: "NunyaBusiness",
    eventName: "PaymentWithReceiptProcessed",
    onLogs: logs => {
      logs.forEach(() => {
        // TODO extract the huamn readable part, show the bytes somehow (v2: show as QR code or write as file for book keeping)
        const receipt = "123"; // decoder.decode(log.args.receipt as ArrayBuffer);
        console.log("📡 Payment Receipt received.", receipt);
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
        <form onSubmit={(e) => {e.preventDefault();}} className="flex flex-col items-center mb-8 mx-5 space-y-4">
          <section className="flex flex-col items-center justify-center space-y-3">
            <p>Your payment reference:</p>
            {/* TODO format into a nice form */}
            <input
              className="border bg-base-100 p-3 w-full rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={reference}
              placeholder="Your payment reference..."
              onChange={e => setReference(e.target.value)}
            />
            <p>The amount to be paid:</p>
            <EtherInput value={amount} onChange={amount => setAmount(amount)} />
            <p>Final amount in ETH {amount}</p>
            <button
              className="btn bg-blue-600 text-white hover:bg-blue-700 transition duration-200 p-3 rounded-md"
              onClick={handlePay}
            >
              Pay Bill Now
            </button>
          </section>
        </form>
        {receipt ? (
          <section>
            <p className="text-center">Receipt: {receipt}</p>
          </section>
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default PaymentPage;
