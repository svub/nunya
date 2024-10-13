"use client";

import CreateAccount from "./createAccount";
import CreatePaymentReference from "./createPaymentReference";
import Withdraw from "./withdraw";
import type { NextPage } from "next";

declare global {
  interface Window {
    temp: unknown;
  }
}

const Home: NextPage = () => {
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

        <CreateAccount></CreateAccount>
        <CreatePaymentReference></CreatePaymentReference>
        <Withdraw></Withdraw>

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
