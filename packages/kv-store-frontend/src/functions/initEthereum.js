// initEthereum.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";

export const useInitEthereum = (setChainId) => {
  useEffect(() => {
    const handleChainChanged = (_chainId) => {
      const numericChainId = parseInt(_chainId, 16);
      setChainId(numericChainId.toString());
      console.log("Network changed to chain ID:", numericChainId);
    };

    const initEthereum = async () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.on("chainChanged", handleChainChanged);

        const fetchChainId = async () => {
          const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
          const { chainId } = await provider.getNetwork();
          setChainId(chainId.toString());
          console.log("Current Chain ID:", chainId);
        };

        await fetchChainId();
      } else {
        console.error("MetaMask is not installed");
      }
    };

    window.addEventListener("load", initEthereum);

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [setChainId]);
};