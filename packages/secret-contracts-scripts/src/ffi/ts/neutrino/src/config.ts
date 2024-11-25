export const GC_NEUTRINO = {
	/**
	 * Maximum time to wait in ms for a WebSocket connection before giving up and using LCD calls as a fallback
	 */
	WS_TIMEOUT: 10e3,

	/**
	 * Polling interval in ms when checking for completed transaction using LCD fallback
	 */
	POLLING_INTERVAL: 6e3,

	/**
	 * Pads all query messages to be multiples of this many bytes
	 */
	PAD_QUERY: 64,

	/**
	 * Pads all execution messages to be multiples of this many bytes
	 */
	PAD_EXEC: 0,
};
