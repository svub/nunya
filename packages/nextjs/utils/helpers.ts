// FIXME just a hack, remove everywhere and make SC function calls return requestId as bigint (uint256)
export function convertToBigint(requestId: string) {
  console.warn("convertToBigint called with", requestId);
  return 0n;
}

export const MAX_GAS_PER_BLOCK = 30000000n;
export const MAX_GAS_PER_CALL = MAX_GAS_PER_BLOCK / 100n;
