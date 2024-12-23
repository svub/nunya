// secretpath/getPublicClientAddress.js

// URL to your JSON file on GitHub (replace with your actual link)
const jsonUrl = "https://raw.githubusercontent.com/SecretFoundation/secretpath-config/refs/heads/master/config/chains.json";

// Cache to store chain data
let chainDataCache = null;

// Function to fetch chain data from the GitHub JSON file (only once)
async function fetchChainData() {
  if (chainDataCache) {
    return chainDataCache; // Return cached data if it exists
  }

  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch chain data");
    }
    const chainData = await response.json();
    chainDataCache = chainData; // Cache the chain data after fetching
    return chainData;
  } catch (error) {
    console.error("Error fetching chain data:", error);
    return null;
  }
}

// Function to get the public client address based on chainId
export async function getPublicClientAddress(chainId) {
  const chainData = await fetchChainData();
  if (!chainData) return null;

  const { mainnets, testnets } = chainData.chains;

  let publicClientAddress = null;

  // Helper function to match chainId and return publicClientAddress
  const findPublicClientAddress = (chains) => {
    for (let key in chains) {
      if (chains[key].chainId.toString() === chainId.toString()) {
        return chains[key].publicClientAddress;
      }
    }
    return null;
  };

  // First check mainnets, then testnets
  publicClientAddress = findPublicClientAddress(mainnets) || findPublicClientAddress(testnets);

  return publicClientAddress;
}
