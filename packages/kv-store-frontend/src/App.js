import './App.css';
import MyImage from './secret-logo.png';
import React, { useState, useEffect } from "react";
import { initializeWeb3Modal } from './config/web3ModalConfig';
import { useInitEthereum } from "./functions/initEthereum";
import Encrypt from './components/Encrypt';
import QueryValue from './components/Query';

function App() {
  const [chainId, setChainId] = useState("");

  useEffect(() => {
    initializeWeb3Modal();
  }, []);

  useInitEthereum(setChainId);

  return (
    <>
    <div className="flex flex-col items-center px-6 py-12 lg:px-8 bg-brand-tan text-brand-orange min-h-screen">
    <div className="connect-wallet-button-container">
        <w3m-button className="connect-wallet-button" />
      </div>
      <p className="text-xl font-bold mt-4">EVM Cross-Chain Encryption Demo</p>
        
      <h6 className="text-xs hover:underline text-brand-blue">
        <a
          href="https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/usecases/storing-encrypted-data-on-secret-network/key-value-store-developer-tutorial"
          target="_blank"
          rel="noopener noreferrer"
        >
          [click here for docs]
        </a>
      </h6>
      <Encrypt />
      <QueryValue />
     
      <div className="flex justify-center transform scale-50 mt-4">
      <img
        src={MyImage}
        alt="Descriptive Text"
        className="w-18 h-12 mt-8 mb-4"
      />
      </div>
    </div>

  </>
  );
}

export default App;
