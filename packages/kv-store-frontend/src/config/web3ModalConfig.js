// web3ModalConfig.js
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5/react";
import { projectId, metadata } from "./config";

// URL to your JSON file on GitHub (replace with your actual link)
const jsonUrl = "https://raw.githubusercontent.com/SecretFoundation/secretpath-config/refs/heads/master/config/chains.json";

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
  rpcUrl: "...",
  defaultChainId: 1,
});

export const initializeWeb3Modal = async () => {
  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch chain data");
    }

    const chainData = await response.json();

    // Extract mainnets and testnets dynamically from fetched JSON
    const mainnets = chainData.chains.mainnets;
    const testnets = chainData.chains.testnets;

    // Build the array of chains from the fetched data
    const chains = [
      ...Object.values(mainnets), // Spread the values of mainnets
      ...Object.values(testnets)  // Spread the values of testnets
    ];

    // Extract chain images dynamically
    const chainImages = Object.keys(mainnets).reduce((images, key) => {
      images[mainnets[key].chainId] = mainnets[key].image;
      return images;
    }, {});

    // Add testnet images to chainImages
    Object.keys(testnets).forEach((key) => {
      chainImages[testnets[key].chainId] = testnets[key].image;
    });

    // Initialize Web3Modal with dynamic chains and chain images
    createWeb3Modal({
      chainImages: {
        ...chainImages,
        // Optionally add any additional static chain images if needed
      },
      ethersConfig,
      chains,  // Use the dynamically fetched chains
      projectId,
      enableAnalytics: true, // Optional - defaults to your Cloud configuration
    });
  } catch (error) {
    console.error("Error initializing Web3Modal:", error);
  }
};