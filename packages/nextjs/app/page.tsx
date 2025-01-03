"use client";

import RetrievePubkey from "./_components/retrievePubkey";
import CreateAccount from "./_components/createAccount";
import CreatePaymentReference from "./_components/createPaymentReference";
import Withdraw from "./_components/withdraw";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <>
      <div className="bg-base-200 min-h-screen flex flex-col justify-center py-10 w-full">
        <h1 className="text-center mb-12">
          <span className="block text-5xl font-bold">Nunya.business</span>
          <span className="block text-3xl mb-4">Receive Business Payments</span>
          <p className="block bg-base-100 my-2 p-2 font-medium text-base italic">
            ... without revealing to other what you&apos;ve earned.
          </p>
        </h1>

        <p className="text-base">Create a payment link and add it to your invoice to start receiving payments.</p>

        <RetrievePubkey></RetrievePubkey>
        <CreateAccount></CreateAccount>
        <CreatePaymentReference></CreatePaymentReference>
        <Withdraw></Withdraw>
      </div>
    </>
  );
};

export default Home;
