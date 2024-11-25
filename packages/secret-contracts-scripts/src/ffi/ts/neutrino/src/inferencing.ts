import type {O, U} from 'ts-toolbelt';

import type {AuthSecret, AuthSecret_ViewerInfo} from './types';
import type {Dict, JsonObject, Nilable} from '@blake.regalia/belt';
import type {ReduceSafe, SecretQueryPermit} from '@solar-republic/types';


// a srongly empty object literal datatype
type EmptyObject = Record<string, never>;

// alias for variants paramter
type WeakVariants = Dict<{msg: JsonObject}>;

// alias for the expected viewer info struct
type WeakViewerInfo = {
	viewer: {
		viewing_key: string;
		address: string;
	};
};

// extracts a property value by key from a union of objects
type ExtractProperty<
	as_objects,
	si_key extends string,
> = as_objects extends Record<si_key, infer w_value>? w_value: undefined;

// make the values of args readonly
type MakeValuesReadonly<h_args extends Nilable<JsonObject>> = h_args extends JsonObject
	? {
		[si_key in keyof h_args]: Readonly<h_args[si_key]>;
	}
	: h_args;

// determines the best type to use for the 'h_args' parameter
type ResolveArgs<h_args extends Nilable<JsonObject>> = JsonObject extends h_args
	// args can be made optional
	? h_args extends EmptyObject
		// args are strongly empty
		? Nilable<EmptyObject>
		// args are optionally empty
		: Nilable<MakeValuesReadonly<h_args>>
	// args are mandatory
	: MakeValuesReadonly<h_args>;

// merges `[a, b?] | [a, c?]` into `[a, (b | c)?]`
export type MergeTuple<a_tuple extends [any?, any?]> = {
	0: [h_args?: U.Merge<a_tuple[0]>, z_auth?: a_tuple[1]];
	1: [h_args: U.Merge<a_tuple[0]>, z_auth?: a_tuple[1]];
	2: [h_args: U.Merge<a_tuple[0]>, z_auth: a_tuple[1]];
}[a_tuple extends [any, any]
	? 2
	: a_tuple extends [any, any?]
		? 1
		: 0];

// deduces whether the msg uses ViewerInfo auth, Basic auth, or neither
// strips the relevant auth fields from args and returns auth type
type InferQueryArgsAndAuthWithoutPermit<
	h_args extends JsonObject,
> = h_args extends WeakViewerInfo
	// ViewerInfo auth
	? [ReduceSafe<1, Omit<h_args, 'viewer'>>, AuthSecret_ViewerInfo]
	// other
	: h_args extends {key: string}
		// basic snip anonymous 'key' auth
		? [ReduceSafe<1, Omit<h_args, 'key'>>, string]
		// neither auth
		: [h_args];

// deduces whether the msg uses Permit auth and unwraps the query
// merges args type and auth type with "permitless" auth methods if present
type InferQueryArgsAndAuth<
	h_variants extends WeakVariants,
	h_args extends JsonObject,
	si_method extends string='',
	b_generic extends 0|1=0,
> = InferQueryArgsAndAuthWithoutPermit<h_args> extends [infer h_args0, infer z_auth0]
	? h_args0 extends JsonObject
		// args is now cast
		? ExtractProperty<h_variants, 'with_permit'> extends {
			msg: {
				query: infer h_query;
				permit: SecretQueryPermit;
			};
		}
			// interface contains a 'with_permit' query
			? h_query extends JsonObject
				// query is now cast
				? ExtractProperty<h_query, si_method> extends infer h_args_alt
					// extracted args in permit variant
					? h_args_alt extends JsonObject
						// args from 'with_permit' variant of same query
						? [
							h_args: O.Merge<h_args0, h_args_alt>,
							z_auth: z_auth0 extends AuthSecret? z_auth0 | SecretQueryPermit: SecretQueryPermit,
						]
						// args from 'with_permit' variant are invalid
						: [h_args: h_args0, z_auth: z_auth0]
					// extraction failed
					: never
				// cast failed
				: never
			// no 'with_permit' query in interface; copied from above
			: z_auth0 extends AuthSecret
				// authenticated query
				? [h_args: h_args0, z_auth: z_auth0]
				// unauthenticated query
				: [h_args: h_args0]
		// h_args0 is not JsonObject
		: [never, never]
	// tuple destructuring failed
	: {
		// strong interface; unathenticated query
		0: [h_args: h_args, z_auth?: Nilable<never>];
		// weak interface; use fuzzy
		1: [h_args: Nilable<JsonObject>, z_auth?: Nilable<AuthSecret>];
	}[b_generic];

/**
 * Creates the parameter types `h_args` and `z_auth` for `query_secret_contract()`
 */
export type CreateQueryArgsAndAuthParams<
	h_variants extends WeakVariants,
	si_method extends string='',
	b_generic extends 0|1=0,
> = MergeTuple<InferQueryArgsAndAuth<h_variants, h_variants[si_method]['msg'], si_method, b_generic> extends [h_args: infer h_args, z_auth?: infer z_auth]
	? h_args extends Nilable<JsonObject>
		// args is now cast
		? z_auth extends Nilable<AuthSecret>
			// auth is now cast
			? z_auth extends null | undefined
				// auth is optional
				? JsonObject extends h_args
					// args can be made optional too
					? [h_args?: ResolveArgs<h_args>, z_auth?: z_auth]
					// args are mandatory; auth is still optional
					: [h_args: ResolveArgs<h_args>, z_auth?: z_auth]
				// auth is mandatory
				: [h_args: ResolveArgs<h_args>, z_auth: z_auth]
			// auth cast failed
			: never
		// args cast failed
		: never
	// destructuring failed
	: [never, never]>;

