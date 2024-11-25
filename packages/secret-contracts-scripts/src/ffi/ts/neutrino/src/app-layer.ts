/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/naming-convention */

import type {O} from 'ts-toolbelt';

import type {CreateQueryArgsAndAuthParams} from './inferencing';
import type {SecretContract} from './secret-contract';
import type {EventUnlistener} from './tendermint-event-filter';
import type {TendermintWs} from './tendermint-ws';
import type {AuthSecret, LcdRpcWsStruct, CosmosQueryError, JsonRpcResponse, MsgQueryPermit, PermitConfig, TxResultWrapper, WeakSecretAccAddr} from './types';
import type {Wallet} from './wallet';

import type {JsonObject, Nilable, Promisable, NaiveJsonString, Dict} from '@blake.regalia/belt';

import type {ContractInterface} from '@solar-republic/contractor';

import type {CosmosBaseAbciTxResponse} from '@solar-republic/cosmos-grpc/cosmos/base/abci/v1beta1/abci';
import type {CosmosTxGetTxResponse} from '@solar-republic/cosmos-grpc/cosmos/tx/v1beta1/service';
import type {TendermintAbciExecTxResult} from '@solar-republic/cosmos-grpc/tendermint/abci/types';
import type {SecretQueryPermit, SlimCoin, WeakAccountAddr, TrustedContextUrl, CwAccountAddr, WeakUint128Str, WeakUintStr} from '@solar-republic/types';

import {__UNDEFINED, bytes_to_base64, timeout, base64_to_bytes, bytes_to_text, parse_json_safe, timeout_exec, die, assign, hex_to_bytes, is_number, stringify_json, try_async, is_error, defer, keys} from '@blake.regalia/belt';
import {safe_base64_to_bytes} from '@solar-republic/cosmos-grpc';
import {decodeCosmosBaseAbciTxMsgData} from '@solar-republic/cosmos-grpc/cosmos/base/abci/v1beta1/abci';
import {XC_PROTO_COSMOS_TX_BROADCAST_MODE_SYNC, queryCosmosTxGetTx, submitCosmosTxBroadcastTx} from '@solar-republic/cosmos-grpc/cosmos/tx/v1beta1/service';
import {decodeSecretComputeMsgExecuteContractResponse} from '@solar-republic/cosmos-grpc/secret/compute/v1beta1/msg';

import {GC_NEUTRINO} from './config.js';
import {exec_fees} from './secret-app.js';
import {F_TEF_RESTART_ANY_ERRORS, SX_QUERY_TM_EVENT_TX, TendermintEventFilter} from './tendermint-event-filter.js';
import {index_abci_events} from './util.js';
import {create_and_sign_tx_direct, sign_amino} from './wallet.js';

/**
 * A synthetic struct for carrying metadata associated with a transaction that may have succeeded or failed.
 * The underlying source of data may have come from either {@link TendermintAbciExecTxResult} (Tendermint event)
 * or {@link CosmosBaseAbciTxResponse} (Cosmos LCD tx query response).
 */
export type TxMeta = {
	height: WeakUintStr;
	gas_wanted: WeakUintStr;
	gas_used: WeakUintStr;
	txhash: string;
	log?: string | undefined;
	code?: number;
	codespace?: string;
};

/**
 * Encapsulates the canonicalized result of transaction, regardless of whether it came from websocket or RPC query
 */
export type TxResultTuple = [
	xc_code: number,
	sx_res: string,
	g_meta?: TxMeta | undefined,
	atu8_data?: Uint8Array | undefined,
	h_events?: Dict<string[]> | undefined,
];

export type RetryParams = [
	xt_wait: number,
];

/**
 * Generic utility function to retry a given task
 * @param f_task - the task to retry having signature `(c_attempts: number) => Promisable<out>`
 * @param f_handle - handler function that determines how to proceed. return `[xt_wait: number]`
 * to indicate how long to wait before retry, or falsy to stop retrying and throw
 * @param c_attempts - reserved. do not use
 * @returns the resolved value on success, or the last error to be thrown on maximum failure
 */
export const retry = async<w_out>(
	f_task: (c_attempts: number) => Promisable<w_out>,
	f_handle: (z_error: unknown, c_attempts: number) => Promisable<RetryParams | Nilable<void>>,
	c_attempts=0
): Promise<w_out> => {
	// attempt to perform the task and return its result
	try {
		return await f_task(c_attempts);
	}
	// an error was thrown
	catch(z_rejection) {
		// forward rejection and attempt count to handler
		const a_retry = await f_handle(z_rejection, ++c_attempts);

		// caller wants to retry
		if(a_retry) {
			// observe timeout
			await timeout(a_retry[0] || 0);

			// retry
			return await retry(f_task, f_handle, c_attempts);
		}

		// throw
		die('Retried '+c_attempts+'x: '+f_task+'\n'+(is_error(z_rejection)? z_rejection.stack || z_rejection.message: ''), z_rejection);
	}
};


/**
 * Opens a new Tendermint JSONRPC WebSocket and immediately subscribes using the given query.
 * Returns a Promise that resolves once a subscription confirmation message is received.
 * Users should close the WebSocket when no longer needed
 * @param p_rpc - RPC endpoint as an HTTPS base URL without trailing slash, e.g., "https://rpc.provider.net"
 * @param sx_query - the Tendermint query to filter events by, e.g., "tm.event='Tx'"
 * @param fk_message - callback for each message
 * @returns - the WebSocket instance
 */
export const subscribe_tendermint_events = (
	p_rpc: TrustedContextUrl | `wss://${string}`,
	sx_query: string,
	fk_message: (d_event: MessageEvent<NaiveJsonString>) => any,
	dc_ws=WebSocket
): Promise<WebSocket> => new Promise((fk_resolve, fe_reject) => assign(
	// normalize protocol from http(s) => ws and append /websocket to path
	new dc_ws('ws'+p_rpc.replace(/^(http|ws)/, '')+'/websocket'), {
		// first message should be subscription confirmation
		onmessage(g_msg) {
			// parse message
			const g_data = parse_json_safe<JsonRpcResponse<Record<string, never>>>(g_msg.data as NaiveJsonString);

			// expect confirmation
			if('0' !== g_data?.id || '{}' !== stringify_json(g_data?.result)) {
				// reject
				fe_reject(g_data);

				// close socket
				return this.close();
			}

			// each subsequent message
			this.onmessage = fk_message;

			// resolve now that subscription has been confirmed
			fk_resolve(this);
		},

		// open event
		onopen() {
			// subscribe to event
			this.send(stringify_json({
				id: '0',
				method: 'subscribe',
				params: {
					query: sx_query,
				},
			}));
		},
	} as Pick<WebSocket, 'onmessage' | 'onopen'>));


/**
 * Starts monitoring the chain in anticipation of a new transaction with the given hash
 */
const monitor_tx = async(
	gc_node: LcdRpcWsStruct,
	si_txn: string,
	z_stream?: TendermintEventFilter | TendermintWs | undefined,
	xt_wait_before_polling=GC_NEUTRINO.WS_TIMEOUT*3
): Promise<[
	fk_unlisten: EventUnlistener,
	dp_monitor: Promise<TxResultTuple>,
	fke_monitor: {
		(w_return: TxResultTuple): void;
		(w_return: Nilable<void>, e_reject: Error): void;
	},
	f_set_res: (sx_override: string) => void,
]> => {
	// create deferred promise
	const [dp_monitor, fke_monitor] = defer<TxResultTuple>();

	// event filter unlistener
	let f_unlisten: EventUnlistener | undefined;

	// if set, indicates that LCD query should be repeated with this timeout value
	let xt_polling: number | undefined;

	// fallback timeout
	let i_fallback: number | NodeJS.Timeout | undefined;

	// teardown
	let f_teardown = () => {
		// unlisten events filter
		f_unlisten?.();

		// created socket ad-hoc
		if(!z_stream) {
			// socket exists
			const d_ws = k_tef?.ws();
			if(d_ws) {
				// prevent closure handling
				d_ws.onclose = null;

				// close ad-hoc socket
				d_ws.close();
			}
		}
	};

	// shutdown
	// eslint-disable-next-line no-sequences
	let f_shutdown = (w_resolve: Nilable<TxResultTuple>, e_reject?: Nilable<Error>) => (f_teardown(), fke_monitor(w_resolve as void, e_reject as Error));

	// polling fallback using LCD query
	let attempt_fallback_lcd_query = async() => {
		// submit query request
		const [a_resolved, e_thrown] = await try_async(() => queryCosmosTxGetTx(gc_node.lcd, si_txn));

		// timeout was cancelled while querying; silently exit
		if(!i_fallback) return;

		// network error; reject outer promise
		if(e_thrown) return f_shutdown(null, e_thrown as Error);

		// destructure resolved value
		const [d_res, s_res, g_res] = a_resolved!;

		// response body present
		if(g_res) {
			// successful
			if(d_res.ok) {
				// make fields compulsory
				const g_tx_res = g_res.tx_response as O.Compulsory<CosmosBaseAbciTxResponse>;

				// resolve
				return f_shutdown(g_tx_res? [
					g_tx_res.code ?? 0,
					s_res,
					assign({
						log: g_tx_res.raw_log,
						txhash: g_tx_res.txhash,
					}, g_tx_res),
					g_tx_res.data? hex_to_bytes(g_tx_res.data): __UNDEFINED,
					index_abci_events(g_tx_res.events),
				]: [
					-1,
					s_res,
				]);
			}

			// destructure parsed response body
			const {
				code: xc_code,
				message: s_msg,
			} = g_res as CosmosQueryError;

			// anything other than tx not found indicates a possible node error
			if(!/tx not found/.test(s_msg || '')) {
				// reject Promise
				return f_shutdown(null, Error(`Unexpected query error to <${gc_node.lcd.origin}>: ${stringify_json(g_res)}`));
			}
		}

		// repeat
		if(xt_polling) i_fallback = setTimeout(attempt_fallback_lcd_query, xt_polling);
	};

	// prep event filter
	let k_tef = z_stream as TendermintEventFilter;

	// normalize stream arg into event filter
	if(!(z_stream as TendermintEventFilter | undefined)?.when) {
		// attempt to create filter
		const [k_tef_local] = await timeout_exec(
			GC_NEUTRINO.WS_TIMEOUT,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			() => TendermintEventFilter(gc_node.ws || gc_node.rpc.origin, SX_QUERY_TM_EVENT_TX, F_TEF_RESTART_ANY_ERRORS, z_stream as TendermintWs | undefined)
		);

		// timed out waiting to connect; start polling
		if(!k_tef_local) {
			i_fallback = setTimeout(attempt_fallback_lcd_query, xt_polling=GC_NEUTRINO.POLLING_INTERVAL);
		}
		// succeeded; set filter
		else {
			k_tef = k_tef_local!;
		}
	}

	// in case WebSocket is silently dead and polling hasn't already been scheduled
	if(!i_fallback) {
		// set polling rate
		xt_polling = GC_NEUTRINO.POLLING_INTERVAL;

		// start attempting fallback queries
		i_fallback = setTimeout(attempt_fallback_lcd_query, xt_wait_before_polling);
	}

	// prep broadcast response (result of CheckTx)
	let sx_res = '';

	// listen for tx hash event
	f_unlisten = k_tef?.when('tx.hash', si_txn, ({value:{TxResult:g_txres}}, h_events) => {
		// ref result struct
		const g_result = g_txres?.result as O.Compulsory<TendermintAbciExecTxResult>;

		// return parsed result
		f_shutdown(g_txres? [
			g_txres.result?.code ?? 0,
			sx_res,
			assign({
				height: g_txres.height!,
				txhash: si_txn,
			}, g_result),
			safe_base64_to_bytes(g_result.data),
			h_events,
		]: [
			-1,
			sx_res,
			__UNDEFINED,
			__UNDEFINED,
			h_events,
		]);
	}, attempt_fallback_lcd_query);

	// return tuple
	return [() => {
		// cancel polling timeout
		i_fallback = clearTimeout(i_fallback) as undefined;

		// teardown
		f_teardown();
	}, dp_monitor, fke_monitor, (sx_override_res: string) => sx_res = sx_override_res];
};


/**
 * Starts monitoring the chain in anticipation of a new transaction with the given hash
 * @param gc_node 
 * @param si_txn 
 * @param z_stream 
 * @returns a {@link TxResultTuple}
 * 
 * Which is a tuple of `[number, string,`{@link TxMeta `TxMeta`}`?, Uint8Array?, Dict<string[]>]`
 *  - [0]: `xc_code: number` - error code from chain, or non-OK HTTP status code from the LCD server.
 * 		A value of `0` indicates success. A value of `-1` indicates a JSON parsing error.
 *  - [1]: `sx_res: string` - raw response text from the initial broadcast request (result of CheckTx)
 *  - [2]: `g_meta?:`{@link TxMeta `TxMeta`} - information about the tx
 *  - [3]: `atu8_data?: Uint8Array` - on success, the tx response data
 *  - [4]: `h_events?: Dict<string[]>` - all event attributes indexed by their full key path
 */
export const expect_tx = async(
	gc_node: LcdRpcWsStruct,
	si_txn: string,
	z_stream?: TendermintEventFilter | TendermintWs | undefined
): Promise<TxResultTuple> => {
	// start monitoring tx
	const [, dp_monitor] = await monitor_tx(gc_node, si_txn, z_stream);

	// return monitor promise
	return dp_monitor;
};


/**
 * Broadcast a transaction to the network for its result
 * @param gc_node - 
 * @param atu8_raw -  
 * @param si_txn -
 * @param z_stream - 
 * @returns a {@link TxResultTuple}
 * 
 * Which is a tuple of `[number, string,`{@link TxMeta `TxMeta`}`?, Uint8Array?, Dict<string[]>]`
 *  - [0]: `xc_code: number` - error code from chain, or non-OK HTTP status code from the LCD server.
 * 		A value of `0` indicates success. A value of `-1` indicates a JSON parsing error.
 *  - [1]: `sx_res: string` - raw response text from the initial broadcast request (result of CheckTx)
 *  - [2]: `g_meta?:`{@link TxMeta `TxMeta`} - information about the tx
 *  - [3]: `atu8_data?: Uint8Array` - on success, the tx response data
 *  - [4]: `h_events?: Dict<string[]>` - all event attributes indexed by their full key path
 */
export const broadcast_result = async(
	gc_node: LcdRpcWsStruct,
	atu8_raw: Uint8Array,
	si_txn: string,
	z_stream?: TendermintEventFilter | TendermintWs | undefined
): Promise<TxResultTuple> => {
	// start monitoring tx
	const [f_unlisten, dp_monitor, fke_monitor, f_set_res] = await monitor_tx(gc_node, si_txn, z_stream);

	// attempt to submit tx
	const [d_res, sx_res_broadcast, g_res] = await submitCosmosTxBroadcastTx(gc_node.lcd, atu8_raw, XC_PROTO_COSMOS_TX_BROADCAST_MODE_SYNC);

	// set value
	f_set_res(sx_res_broadcast);

	// not ok HTTP code, no parsed JSON, or non-zero response code
	if(!d_res.ok || !g_res || g_res.tx_response?.code) {
		// unlisten events filter
		f_unlisten?.();

		// some failures still contain enough to construct meta
		const g_meta = parse_json_safe<CosmosTxGetTxResponse>(sx_res_broadcast)?.tx_response;

		// resolve with error
		fke_monitor([
			d_res.ok? g_res?.tx_response?.code ?? -1: d_res.status,
			sx_res_broadcast,
			g_meta? assign({
				log: g_meta.raw_log,
			}, g_meta as TxMeta): __UNDEFINED,
		]);
	}

	// return monitor promise
	return dp_monitor;
};


/**
 * Query a Secret Contract method
 * @param k_contract 
 * @param h_query 
 * @returns tuple of `[number, string, JsonObject?]` where:
 *  - [0]: `xc_code: number` - error code from chain, or non-OK HTTP status code from the LCD server.
 * 		A value of `0` indicates success.
 *  - [1]: `s_error: string` - error message from chain or HTTP response body
 *  - [3]: `h_answer?: JsonObject` - contract response as JSON object on success
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const query_secret_contract_raw = async<
	g_interface extends ContractInterface,
	h_variants extends ContractInterface.MsgAndAnswer<g_interface, 'queries'>,
	g_variant extends h_variants[keyof h_variants],
>(
	k_contract: SecretContract<g_interface>,
	h_query: g_variant['msg']
): Promise<[xc_code: number, s_error: string, h_answer?: g_variant['answer']]> => k_contract.query(h_query);


/**
 * Format a query message given its method id and args object, and optionally an auth secret.
 * 
 * If an auth secret is given, the resulting query object will use the typical shape for that method.
 * 
 * Depending on auth secret's type (see {@link AuthSecret}):
 *  - _falsy_: no auth -- `{[method]: args}`
 *  - `string`: Viewing Key -- `{[method]:args, key:z_auth}`
 *  - `[string, string?]`: ViewerInfo -- `{[method]:{...args, viewer:{viewing_key:z_auth[0], address?:z_auth[1]}}}`
 *  - `object`: QueryPermit -- `{with_permit:{query:{[method]:args}, permit:z_auth}}`
 * 
 * @param si_method 
 * @param h_query 
 * @param z_auth 
 * @returns 
 */
export const format_secret_query = (
	si_method: string,
	h_query: object,
	z_auth?: Nilable<AuthSecret>
): JsonObject => (z_auth
	// string or array
	? (z_auth as string | any[]).at
		// array?
		? (z_auth as any[]).map
			// ViewerInfo
			? {
				[si_method]: {
					...h_query,
					viewer: {
						viewing_key: (z_auth as string[])[0],
						address: (z_auth as string[])[1],
					},
				},
			}
			// Viewing Key
			: {
				[si_method]: {
					...h_query,
					key: z_auth,
				},
			}
		// Query Permit
		: {
			with_permit: {
				query: {
					[si_method]: h_query,
				},
				permit: z_auth,
			},
		}
	: {
		[si_method]: h_query,
	}) as JsonObject;


export interface QueryContractInfer {
	<
		g_interface extends ContractInterface,
		h_variants extends ContractInterface.MsgAndAnswer<g_interface, 'queries'>=ContractInterface.MsgAndAnswer<g_interface, 'queries'>,
		si_method extends Extract<keyof h_variants, string>=Extract<keyof h_variants, string>,
		g_variant extends h_variants[si_method]=h_variants[si_method],
	>(
		k_contract: SecretContract<g_interface>,
		si_method: si_method,
		...[h_args, z_auth]: CreateQueryArgsAndAuthParams<
			h_variants,
			si_method,
			ContractInterface extends g_interface? 1: 0
		>
	): Promise<[
		w_result: g_variant['response'] | undefined,
		xc_code_x: number,
		s_error: string,
		h_answer?: g_variant['answer'],
	]>;
}

/**
 * Query a Secret Contract method and automatically apply an auth secret if one is provided.
 * Additionally, unwrap the success response by accessing the input method name if one was returned.
 * @param k_contract - the contract
 * @param si_method - which query method to invoke
 * @param h_args - the args value to pass in with the given query
 * @param z_auth - optional {@link AuthSecret} to perform an authenticated query
 * @returns tuple of `[JsonObject?, number, string, JsonObject?]` where:
 *  - [0]: `w_result?: JsonObject` - unwrapped contract result on success
 *  - [1]: `xc_code: number` - error code from chain, or non-OK HTTP status code from the LCD server.
 * 		A value of `0` indicates success.
 *  - [2]: `s_error: string` - error message from chain or HTTP response body
 *  - [3]: `h_answer?: JsonObject` - contract response as JSON object on success
 */
export const query_secret_contract: QueryContractInfer = async(
	k_contract: SecretContract,
	si_method: string,
	...[h_args, z_auth]
): Promise<[w_result: JsonObject | undefined, xc_code_p: number, s_error: string, h_answer?: JsonObject]> => {
	// debug
	if(import.meta.env?.DEV) {
		console.groupCollapsed(`❓ ${si_method}`);
		console.debug(`Querying contract ${k_contract.addr} (${k_contract.info.label})`);
		console.debug(format_secret_query(si_method, h_args || {}, z_auth));
		console.groupEnd();
	}

	// query the contract
	const a_response = await query_secret_contract_raw(k_contract, format_secret_query(si_method, h_args || {}, z_auth));

	// debug
	if(import.meta.env?.DEV) {
		console.groupCollapsed(`🛰️ ${si_method}`);
		console.debug(`Query response [code: ${a_response[0]}] from ${k_contract.addr} (${k_contract.info.label}):`);
		console.debug(a_response[2]);
		console.groupEnd();
	}

	// put unwrapped result in front
	return [
		a_response[0]
			? __UNDEFINED
			: (a_response[2] as JsonObject)[si_method] as JsonObject,
		...a_response,
	];
};


/**
 * Decrypts the response data from a Secret Contract
 * @param k_contract 
 * @param param1 
 * @param atu8_nonce 
 * @returns 
 */
export const decrypt_secret_contract_response = async(
	k_contract: SecretContract,
	[xc_error, sx_res, g_meta, atu8_data]: TxResultTuple,
	atu8_nonce: Uint8Array
): Promise<[
	s_res: string,
	g_res?: undefined | JsonObject,
]> => {
	// prep plaintext
	let s_plaintext!: string;

	// invalid json
	if(xc_error < 0) return [sx_res];

	// no errors
	if(!xc_error) {
		// decode tx msg data
		let [a_data, a_msg_responses] = decodeCosmosBaseAbciTxMsgData(atu8_data!);

		// parse 0th message response, select field depending on cosmos-sdk < or >= 0.46
		let [s_type, atu8_payload] = a_msg_responses? a_msg_responses[0]: a_data![0];

		// decode payload
		const [atu8_ciphertext] = decodeSecretComputeMsgExecuteContractResponse(atu8_payload!);

		// decrypt ciphertext
		const atu8_plaintext = await k_contract.wasm.decrypt(atu8_ciphertext!, atu8_nonce);

		// decode plaintext
		s_plaintext = bytes_to_text(base64_to_bytes(bytes_to_text(atu8_plaintext)));

		// entuple results
		return [s_plaintext, parse_json_safe(s_plaintext)];
	}

	// error
	const s_error = g_meta?.log ?? sx_res;

	// encrypted error message
	const m_response = /(\d+):(?: \w+:)*? encrypted: (.+?): (.+?) contract/.exec(s_error);
	if(m_response) {
		// destructure match
		const [, s_index, sb64_encrypted, si_action] = m_response;

		// decrypt message from contract
		const atu8_plaintext = await k_contract.wasm.decrypt(base64_to_bytes(sb64_encrypted), atu8_nonce);

		// decode bytes
		s_plaintext = bytes_to_text(atu8_plaintext);
	}

	// entuple error
	return [s_plaintext ?? s_error];
};


/**
 * Execute a single Secret Contract method and wait for transaction confirmation.
 * @param k_contract - a {@link SecretContract} instance
 * @param k_wallet - the {@link Wallet} of the sender
 * @param h_exec - the execution message as a plain object (to be JSON-encoded)
 * @param z_fees - either a gas price or an Array of {@link SlimCoin} describing the amounts and denoms of fees
 * @param z_limit - the u128 gas limit to set for the transaction
 * @param sa_granter - optional granter address to use to pay for gas fee
 * @param a_funds - optional Array of {@link SlimCoin} of funds to send into the contract with the tx
 * @param s_memo - optional memo field
 * @returns tuple of `[number, string, TxResponse?]`
 *  - [0]: `xc_code: number` - error code from chain, or non-OK HTTP status code from the LCD server.
 * 		A value of `0` indicates success.
 *  - [1]: `s_res: string` - message text. on success, will be the contract's raw response string.
 * 		on error, will be either the error string from HTTP response text, chain error message,
 * 		or contract error as a JSON string.
 *  - [2]: `g_res?: JsonObject` - on success, the parsed contract's response JSON object
 *  - [3]: `g_meta?:`{@link TxMeta `TxMeta`} - information about the tx
 *  - [4]: `h_events?: Dict<string[]>` - all event attributes indexed by their full key path
 *  - [5]: `si_txn?: string` - the transaction hash if a broadcast attempt was made
 * 
 * @throws a {@link BroadcastResultErr}
 */
export const exec_secret_contract = async<
	g_interface extends ContractInterface,
	h_group extends ContractInterface.MsgAndAnswer<g_interface, 'executions'>=ContractInterface.MsgAndAnswer<g_interface, 'executions'>,
	as_methods extends Extract<keyof h_group, string>=Extract<keyof h_group, string>,
>(
	k_contract: SecretContract<g_interface>,
	k_wallet: Wallet<'secret'>,
	h_exec: ContractInterface extends g_interface? JsonObject: {
		[si_each in as_methods]: h_group[si_each]['msg'];
	},
	z_fees: [SlimCoin, ...SlimCoin[]] | number,
	z_limit: WeakUint128Str | bigint,
	sa_granter?: WeakSecretAccAddr | '',
	a_funds?: SlimCoin[],
	s_memo?: string
): Promise<[
	xc_code: number,
	s_res: string,
	g_res?: undefined | (ContractInterface extends g_interface? JsonObject: h_group[as_methods]['answer']),
	g_meta?: TxMeta | undefined,
	h_events?: Dict<string[]> | undefined,
	si_txn?: string | undefined,
]> => {
	// construct execution message and save nonce
	let [atu8_msg, atu8_nonce] = await k_contract.exec(h_exec, k_wallet.addr, a_funds);

	// sign in direct mode
	let [atu8_tx_raw, , si_txn] = await create_and_sign_tx_direct(
		k_wallet,
		[atu8_msg],
		is_number(z_fees)? exec_fees(z_limit, z_fees): z_fees,
		z_limit+'' as WeakUint128Str,
		0,
		s_memo,
		sa_granter
	);

	// debug info
	if(import.meta.env?.DEV) {
		console.groupCollapsed(`🗳️ ${Object.keys(h_exec)[0]}`);
		console.debug([
			`Executing contract ${k_contract.addr} (${k_contract.info.label}) from ${k_wallet.addr}`,
			`  limit: ${z_limit} ┃ hash: ${si_txn}`+(sa_granter? ` ┃ granter: ${sa_granter}`: '')+(s_memo? ` ┃ memo: ${s_memo}`: ''),
		].join('\n'));
		console.debug(h_exec);
		console.groupEnd();
	}

	// broadcast to chain
	const [xc_error, sx_res, g_meta, atu8_data, h_events] = await broadcast_result(k_wallet, atu8_tx_raw, si_txn);

	// invalid json
	if(xc_error < 0) return [xc_error, sx_res];

	// decrypt response
	const [s_plaintext, g_answer] = await decrypt_secret_contract_response(k_contract, [xc_error, sx_res, g_meta, atu8_data], atu8_nonce);

	// error
	if(xc_error) {
		// debug info
		if(import.meta.env?.DEV) {
			console.groupCollapsed(`❌ ${Object.keys(h_exec)[0]} [code: ${xc_error}]`);
			console.debug('meta: ', g_meta);
			console.debug('txhash: ', h_events?.['tx.hash'][0]);
			console.debug('data: ', s_plaintext);
			console.groupEnd();
		}

		// entuple error
		return [xc_error, s_plaintext, g_meta, __UNDEFINED, __UNDEFINED, si_txn];
	}

	// debug info
	if(import.meta.env?.DEV) {
		console.groupCollapsed(`✅ ${Object.keys(h_exec)[0]}`);

		if(g_meta) {
			const {
				gas_used: sg_used,
				gas_wanted: sg_wanted,
			} = g_meta;

			console.debug(`gas used/wanted: ${sg_used}/${sg_wanted}  (${+sg_wanted - +sg_used}) wasted)`);
		}

		console.debug('meta: ', g_meta);
		console.debug('txhash: ', h_events?.['tx.hash'][0]);
		console.debug('data: ', g_answer || s_plaintext);
		console.groupEnd();
	}

	// entuple results
	return [xc_error, s_plaintext, g_answer, g_meta, h_events, si_txn];
};


/**
 * Sign a query permit and return the encoded object ready for use in a query
 * @param k_wallet 
 * @param si_permit 
 * @param a_tokens 
 * @param a_permissions 
 * @returns 
 */
export const sign_secret_query_permit = async(
	k_wallet: Wallet,
	si_permit: string,
	a_tokens: WeakAccountAddr<'secret'>[],
	a_permissions: string[]
): Promise<SecretQueryPermit> => {
	// prep params
	const g_params: PermitConfig = {
		permit_name: si_permit,
		allowed_tokens: a_tokens as CwAccountAddr<'secret'>[],
		permissions: a_permissions,
	};

	// sign query permit
	const [atu8_signature, g_signed] = await sign_amino<[MsgQueryPermit]>(k_wallet, [{
		type: 'query_permit',
		value: g_params,
	}], [['0', 'uscrt']], '1', ['0', '0']);

	// encode query permit
	return {
		params: {
			...g_signed.msgs[0].value,
			chain_id: k_wallet.ref,
		},
		signature: {
			pub_key: {
				type: 'tendermint/PubKeySecp256k1',
				value: bytes_to_base64(k_wallet.pk33),
			},
			signature: bytes_to_base64(atu8_signature),
		},
	};
};
