/* eslint-disable @typescript-eslint/naming-convention */
import type {TxMeta} from './app-layer';
import type {CreateQueryArgsAndAuthParams} from './inferencing';
import type {SecretContract} from './secret-contract';
import type {AuthSecret, WeakSecretAccAddr} from './types';
import type {Wallet} from './wallet';

import type {Dict, JsonObject} from '@blake.regalia/belt';
import type {ContractInterface} from '@solar-republic/contractor';
import type {SlimCoin} from '@solar-republic/types';

import {__UNDEFINED, values} from '@blake.regalia/belt';

import {exec_secret_contract, query_secret_contract} from './app-layer.js';

/**
 * Given a limit, gas price, and denom (defaults to 'uscrt'), produces an array containing a single {@link SlimCoin} tuple
 * @param z_limit 
 * @param x_gas_price 
 * @param s_denom 
 * @returns 
 */
export const exec_fees = (z_limit: number|bigint|`${bigint}`, x_gas_price: number, s_denom='uscrt'): [SlimCoin] => [[
	''+Math.ceil(Number(z_limit) * x_gas_price), s_denom],
] as [SlimCoin];

/**
 * Simple wrapper for querying and executing a Secret contract. Binds Wallet and SecretContract, as well
 * as an AuthSecret, gas price, and optional granter.
 */
export interface SecretApp<
	g_interface extends ContractInterface=ContractInterface,
> {
	readonly wallet: Wallet;
	readonly contract: SecretContract;

	/**
	 * A getter/setter function for gas price
	 * @param xn_price - if set, replaces the gas price
	 * @returns the new/current gas price
	 */
	price(xn_price?: number): number;

	/**
	 * A getter/setter function for granter address
	 * @param sa_granter - if set, replaces the granter address. pass an empty string `''` to unset
	 * @returns the new/current granter address
	 */
	granter(sa_granter?: WeakSecretAccAddr | ''): WeakSecretAccAddr | '' | undefined;

	/**
	 * Query a Secret Contract method and automatically apply an auth secret if one is provided.
	 * Additionally, unwrap the success response if one was returned.
	 * @param si_method - which query method to invoke
	 * @param h_args - the args value to pass in with the given query
	 * @param z_auth - optional {@link AuthSecret} to perform an authenticated query
	 * @returns tuple of `[JsonObject?, number, string, JsonObject?]` where:
	 *  - [0]: `w_result?: JsonObject` - parsed & unwrapped contract result on success
	 *  - [1]: `xc_code: number` - error code from chain, or non-OK HTTP status code from the LCD server.
	 * 		A value of `0` indicates success.
	 *  - [2]: `s_error: string` - error message from chain or HTTP response body
	 *  - [3]: `h_answer?: JsonObject` - contract response as JSON object on success
	 */
	query<
		h_variants extends ContractInterface.MsgAndAnswer<g_interface, 'queries'>=ContractInterface.MsgAndAnswer<g_interface, 'queries'>,
		si_method extends Extract<keyof h_variants, string>=Extract<keyof h_variants, string>,
		g_variant extends h_variants[si_method]=h_variants[si_method],
	>(
		si_method: si_method,
		...[h_args, z_auth]: CreateQueryArgsAndAuthParams<
			h_variants,
			si_method,
			ContractInterface extends g_interface? 1: 0
		>
	): Promise<[
		w_result: g_variant['response'] | undefined,
		xc_code: number,
		s_error: string,
		h_answer?: g_variant['answer'],
	]>;


	/**
	 * Executes the contract with given method, args, and limit. Automatically determines fee at set gas price.
	 * Automatically uses granter if set on instance using {@link SecretApp.granter}.
	 * @param si_method - which execution method to invoke
	 * @param h_exec - the args value to pass in with the given execution
	 * @param xg_limit - the gas limit to set for the transaction
	 * @param a_funds - optional Array of {@link SlimCoin} of funds to send into the contract with the tx
	 * @param s_memo - optional memo field
	 * @returns tuple of `[number, string, TxResponse?]`
	 *  - [0]: `w_result?: JsonValue` - parsed & unwrapped contract result on success
	 *  - [1]: `xc_code: number` - error code from chain, or non-OK HTTP status code from the LCD server.
	 * 		A value of `0` indicates success.
	 *  - [2]: `s_res: string` - message text. on success, will be the contract's response as a JSON string.
	 * 		on error, will be either the error string from HTTP response text, chain error message,
	 * 		or contract error as a JSON string.
	 *  - [3]: `g_meta?: `{@link TxMeta} - meta information about the transaction attempt
	 *  - [4]: `h_events?: Dict<string[]>` - dict of all event attributes
	 *  - [4]: `si_txn?: string` - the transaction hash if a broadcast attempt was made
	 * 
	 * @throws a {@link BroadcastResultErr}
	 */
	exec<
		h_group extends ContractInterface.MsgAndAnswer<g_interface, 'executions'>,
		as_methods extends Extract<keyof h_group, string>,
	>(
		si_method: as_methods,
		h_exec: ContractInterface extends g_interface? JsonObject: h_group[as_methods]['msg'],
		xg_limit: bigint,
		a_funds?: SlimCoin[],
		s_memo?: string
	): Promise<[
		w_result: h_group[as_methods]['response'] | undefined,
		xc_code: number,
		s_response: string,
		g_meta: TxMeta | undefined,
		h_events: Dict<string[]> | undefined,
		si_txn: string | undefined,
	]>;
}

export const SecretApp = <
	g_interface extends ContractInterface,
>(
	k_wallet: Wallet<'secret'>,
	k_contract: SecretContract<g_interface>,
	x_gas_price: number,
	sa_granter?: WeakSecretAccAddr | '' | undefined
): SecretApp<g_interface> => ({
	wallet: k_wallet,
	contract: k_contract,

	price: (x_price=x_gas_price) => x_gas_price = x_price,

	granter: (sa_granter_new=sa_granter) => sa_granter = sa_granter_new,

	query: (
		si_method: string,
		h_args=__UNDEFINED as any,
		z_auth=__UNDEFINED as any
	) => query_secret_contract(
		k_contract as SecretContract,
		si_method,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		(h_args || {}) as any,
		z_auth
	),

	exec: async(
		si_method: string,
		h_args: JsonObject,
		xg_limit: bigint,
		a_funds?: SlimCoin[],
		s_memo?: string
	) => {
		// execute the contract
		const [xc_code, s_res, g_res, g_meta, h_events, si_txn] = await exec_secret_contract(
			k_contract as SecretContract,
			k_wallet,
			{[si_method]:h_args},
			exec_fees(xg_limit, x_gas_price),
			xg_limit+'' as `${bigint}`,
			sa_granter,
			a_funds,
			s_memo
		);

		// entuple results
		return [xc_code? __UNDEFINED: g_res? values(g_res)[0] as JsonObject: g_res, xc_code, s_res, g_meta, h_events, si_txn];
	},
});
