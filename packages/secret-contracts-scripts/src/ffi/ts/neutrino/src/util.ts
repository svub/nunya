/* eslint-disable prefer-const */

import type {Dict, JsonValue} from '@blake.regalia/belt';
import type {NetworkJsonResponse} from '@solar-republic/cosmos-grpc';
import type {TendermintAbciEvent} from '@solar-republic/cosmos-grpc/tendermint/abci/types';

import {bytes, each, die, is_string, is_function, is_array, try_sync} from '@blake.regalia/belt';
import {safe_base64_to_text} from '@solar-republic/cosmos-grpc';


export type StringFilter = string | string[] | Iterable<string> | RegExp | null | ((s_test: string) => boolean);

// eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
export const random_32 = (_?: never): Uint8Array => crypto.getRandomValues(bytes(32));

/**
 * Tests the given string value against a filter that may be one of the following:
 *  - `string` - exact comparison
 *  - `Iterable<string>` - includes one of the items in the iteratable (e.g., Array, Set, etc.)
 *  - `RegExp` - matches the regular expression
 *  - `Function` - calls the given function with the string value as the sole argument and evaluates return value for falsy-ness
 *  - `null` - always passes
 *  - other - dangerous, do not use. casts the item to a string and then compares
 * @param s_value 
 * @param z_filter 
 * @returns 
 */
export const string_matches_filter = (
	s_value: string,
	z_filter: StringFilter
): boolean => null === z_filter || (is_string(z_filter)
	? s_value === z_filter
	: z_filter instanceof RegExp
		? z_filter.test(s_value)
		: is_function(z_filter)
			? !!z_filter(s_value)
			: z_filter?.[Symbol.iterator]
				? (is_array(z_filter)? z_filter: [...z_filter]).includes(s_value)
				// eslint-disable-next-line @typescript-eslint/no-base-to-string
				: s_value === z_filter+'');


/**
 * Converts a list of ABCI events to a dict of string values
 * @param a_events - the list of events
 * @param h_events - optional dict to merge into
 * @returns the dict
 */
export const index_abci_events = (
	a_events: TendermintAbciEvent[],
	h_events: Dict<string[]>={}
): Dict<string[]> => (
	// coalesce indexed events
	each(a_events, ({type:s_type, attributes:a_attrs}) => {
		// each attribute
		each(a_attrs!, (g_attr) => {
			// plaintext
			(h_events[s_type+'.'+g_attr.key!] ||= []).push(g_attr.value!);

			// attempt safe decode
			const [s_key, s_value] = [safe_base64_to_text(g_attr.key), safe_base64_to_text(g_attr.value)];
			if(s_key && s_value) {
				// add to indexed list; attempt to base64-decode EventAttribute fields since Tendermint/CometBFT made it a breaking change
				(h_events[s_type+'.'+s_key] ||= []).push(s_value);
			}
		});
	// eslint-disable-next-line no-sequences
	}),
	h_events
);


/**
 * Performs a network gRPC request and only returns on success, throws otherwise
 * @param f_task 
 * @param a_args 
 * @returns 
 */
export const successful = async <
	w_out extends JsonValue | undefined,
	a_args extends any[],
>(
	f_task: (...a_args: a_args) => Promise<NetworkJsonResponse<w_out>>,
	...a_args: a_args
): Promise<NonNullable<w_out>> => {
	const [d_res, s_res, g_res] = await f_task(...a_args);

	// response body present and operation was successful
	if(g_res && d_res.ok) {
		return g_res;
	}

	// die with error message
	die(d_res.status+': '+s_res, g_res);
};
