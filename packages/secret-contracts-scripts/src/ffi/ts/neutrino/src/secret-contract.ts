/* eslint-disable prefer-const */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type {O} from 'ts-toolbelt';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type {query_secret_contract_raw} from './app-layer';
import type {ContractInfo, CosmosQueryError, RemoteService, RemoteServiceArg, WeakSecretAccAddr} from './types';

import type {Dict, JsonObject, Nilable} from '@blake.regalia/belt';

import type {SecretAccAddr, ContractInterface} from '@solar-republic/contractor';
import type {SecretComputeContractInfo} from '@solar-republic/cosmos-grpc/secret/compute/v1beta1/types';
import type {CwHexLower, CwUint32, SlimCoin} from '@solar-republic/types';

import {__UNDEFINED, base64_to_bytes, base64_to_text, bytes_to_text, is_string, parse_json, stringify_json} from '@blake.regalia/belt';

import {encodeGoogleProtobufAny, type EncodedGoogleProtobufAny} from '@solar-republic/cosmos-grpc/google/protobuf/any';
import {SI_MESSAGE_TYPE_SECRET_COMPUTE_MSG_EXECUTE_CONTRACT, encodeSecretComputeMsgExecuteContract} from '@solar-republic/cosmos-grpc/secret/compute/v1beta1/msg';
import {destructSecretComputeQueryCodeHashResponse, destructSecretComputeQueryContractInfoResponse, destructSecretComputeQuerySecretContractResponse, querySecretComputeCodeHashByCodeId, querySecretComputeContractInfo, querySecretComputeQuerySecretContract} from '@solar-republic/cosmos-grpc/secret/compute/v1beta1/query';
import {destructSecretRegistrationKey} from '@solar-republic/cosmos-grpc/secret/registration/v1beta1/msg';
import {querySecretRegistrationTxKey} from '@solar-republic/cosmos-grpc/secret/registration/v1beta1/query';

import {remote_service} from './_common';
import {GC_NEUTRINO} from './config.js';
import {SecretWasm} from './secret-wasm.js';
import {successful} from './util.js';


export type KnownContractInfo = O.Required<SecretComputeContractInfo, 'code_id' | 'label'>;

const h_codes_cache: Record<ContractInfo['code_id'], CwHexLower> = {};

const h_contract_cache: Record<WeakSecretAccAddr, KnownContractInfo> = {};

const h_networks = {} as Dict<{
	wasm: SecretWasm;
	conspk: Uint8Array;
}>;


/**
 * Stores intermediate values during the process of querying a Secret contract
 */
export interface SecretContractQueryIntermediates {
	/**
	 * The nonce that was used to encrypt the query
	 */
	n?: Uint8Array;
}


export type SecretContract<
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	g_interface extends ContractInterface=ContractInterface,
> = {
	/**
	 * URL of the LCD endpoint
	 */
	lcd: RemoteService;

	/**
	 * Contract address
	 */
	addr: SecretAccAddr;

	/**
	 * Contract's label, code id, and creator
	 */
	info: KnownContractInfo;

	/**
	 * Code hash
	 */
	hash: CwHexLower;

	/**
	 * the {@link SecretWasm} instance
	 */
	wasm: SecretWasm;

	/**
	 * Queries a contract and returns the parsed JSON response
	 * @param h_query - the query JSON as an object
	 * @returns tuple of `[number, string, JsonObject?]` where:
	 *  - [0]: `xc_code: number` - error code from chain, or non-OK HTTP status code from the LCD server.
	 * 		A value of `0` indicates success.
	 *  - [1]: `s_error: string | undefined` - error message from chain or HTTP response body
	 *  - [3]: `h_answer?: JsonObject` - contract response as JSON object on success
	 */
	query(h_query: JsonObject, g_out?: SecretContractQueryIntermediates): Promise<[
		xc_code: number,
		s_error: string,
		g_result: JsonObject,
	]>;

	/**
	 * Construct a contract execution message
	 * @param h_exec 
	 * @param sa_sender 
	 * @param a_funds 
	 * @returns 
	 */
	exec(h_exec: JsonObject, sa_sender: WeakSecretAccAddr, a_funds?: SlimCoin[]): Promise<[
		atu8_data: EncodedGoogleProtobufAny,
		atu8_nonce: Uint8Array,
	]>;
};


/**
 * Creates a low-level handle for a Secret Contract. Immediately queries the chain for the contract's code hash
 * and info unless already cached.
 * 
 * The `query` and `exec` methods are not intended for general application use; projects should instead use
 * {@link query_secret_contract_raw} and {@link exec_secret_contract}.
 * @param z_lcd 
 * @param sa_contract 
 * @param atu8_seed 
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const SecretContract = async<
	g_interface extends ContractInterface=ContractInterface,
>(
	z_lcd: RemoteServiceArg,
	sa_contract: WeakSecretAccAddr,
	atu8_seed: Nilable<Uint8Array>=null
): Promise<SecretContract<g_interface>> => {
	// uniquely identify this request pattern
	let si_lcd = stringify_json(is_string(z_lcd)
		? [z_lcd, '', '']
		: [
			z_lcd.origin,
			z_lcd.headers,
			z_lcd.redirect,
		].map(s => s || '')
	);

	// try loading entry from cache
	let g_cached = h_networks[si_lcd];

	// network not yet cached
	if(!g_cached) {
		// fetch consensus io pubkey
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		let g_res_reg = await successful(querySecretRegistrationTxKey, z_lcd);

		// destructure response
		let [atu8_consensus_pk] = destructSecretRegistrationKey(g_res_reg);

		// instantiate default secret wasm using random seed and save to cache
		h_networks[si_lcd] = g_cached = {
			wasm: SecretWasm(atu8_consensus_pk!),
			conspk: atu8_consensus_pk!,
		};
	}

	// custom seed specified...
	const k_wasm = atu8_seed
		// ...create instance
		? SecretWasm(g_cached.conspk, atu8_seed)
		// no custom seed; re-use default wasm instance
		: g_cached.wasm;

	// ref contract info
	let g_info = h_contract_cache[sa_contract];
	if(!g_info) {
		// refload contract info
		let g_res_info = await successful(querySecretComputeContractInfo, z_lcd, sa_contract);

		// destruct response
		let [, g_info1] = destructSecretComputeQueryContractInfoResponse(g_res_info);

		// update
		g_info = h_contract_cache[sa_contract] = g_info1 as KnownContractInfo;
	}

	// ref code id
	const si_code = g_info.code_id!;  // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion

	// ref code hash
	let sb16_code_hash = h_codes_cache[si_code];
	if(!sb16_code_hash) {
		// refload code hash
		let g_res_hash = await successful(querySecretComputeCodeHashByCodeId, z_lcd, si_code);

		// destruct response
		sb16_code_hash = h_codes_cache[si_code] = destructSecretComputeQueryCodeHashResponse(g_res_hash)[0]!;
	}


	// properties and methods
	return {
		// lcd endpoint
		lcd: remote_service(z_lcd),

		// contract address
		addr: sa_contract as SecretAccAddr,

		// expose info
		info: g_info,

		// code hash
		hash: sb16_code_hash,

		// wasm instance
		wasm: k_wasm,

		// query contract
		// @ts-expect-error typed in interface
		async query(h_query, g_out={}) {
			// encrypt and encode query msg
			const atu8_msg = await k_wasm.encodeMsg(sb16_code_hash, h_query, GC_NEUTRINO.PAD_QUERY);

			// extract nonce
			const atu8_nonce = g_out.n = atu8_msg.slice(0, 32);

			// submit query
			let [d_res_query, s_res_query, g_res_query] = await querySecretComputeQuerySecretContract(z_lcd, sa_contract, atu8_msg);

			// JSON response
			if(g_res_query) {
				// ok status
				if(d_res_query.ok) {
					// destructure
					const [atu8_ciphertext] = destructSecretComputeQuerySecretContractResponse(g_res_query);

					// decrypt response
					const atu8_plaintext = await k_wasm.decrypt(atu8_ciphertext!, atu8_nonce);

					// decode result
					const sb64_response = bytes_to_text(atu8_plaintext);
					const sx_result = base64_to_text(sb64_response);

					// return response and json
					return [0, __UNDEFINED, parse_json(sx_result)];
				}
				// contract error
				else {
					// destructure as error
					let {
						code: xc_code,
						message: s_message,
					} = g_res_query as CosmosQueryError;

					// ensure non-zero
					xc_code ||= -1 as CwUint32;

					// encrypted error message
					const m_error = /encrypted: (.+?):/.exec(s_message || '');
					if(m_error) {
						// decode base64 string
						const atu8_ciphertext = base64_to_bytes(m_error[1]);

						// decrypt the ciphertext
						const atu8_plaintext = await k_wasm.decrypt(atu8_ciphertext, atu8_nonce);

						// decode
						const sx_plaintext = bytes_to_text(atu8_plaintext);

						// return tuple
						return [xc_code, sx_plaintext];
					}

					// plaintext error
					return [xc_code, s_message];
				}
			}

			// some other error
			return [d_res_query.status, s_res_query];
		},

		// execute contract
		async exec(h_exec, sa_sender, a_funds=[]) {
			// encrypt and encode execution body
			const atu8_body = await k_wasm.encodeMsg(sb16_code_hash, h_exec, GC_NEUTRINO.PAD_EXEC);

			// extract nonce
			const atu8_nonce = atu8_body.slice(0, 32);

			// return tuple
			return [
				encodeGoogleProtobufAny(
					SI_MESSAGE_TYPE_SECRET_COMPUTE_MSG_EXECUTE_CONTRACT,
					encodeSecretComputeMsgExecuteContract(sa_sender, sa_contract, atu8_body, __UNDEFINED, a_funds)
				),
				atu8_nonce,
			];
		},
	};
};
