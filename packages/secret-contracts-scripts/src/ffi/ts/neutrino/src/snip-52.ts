/* eslint-disable prefer-const */
import type {Pop} from 'ts-toolbelt/out/List/Pop';

import type {SecretContract} from './secret-contract';
import type {AuthSecret, MsgNotificationSeedUpdate, NotificationSeedUpdate, NotificationSeedUpdateConfig, TxResultWrapper, WeakSecretAccAddr, CwSecretAccAddr} from './types';
import type {Wallet} from './wallet';

import type {CborValue, Dict, Promisable} from '@blake.regalia/belt';
import type {Snip52, ContractInterface, Snip52Schema} from '@solar-republic/contractor';
import type {CwBase64, TrustedContextUrl} from '@solar-republic/types';

import {hmac, base64_to_bytes, text_to_bytes, bytes_to_base64, sha256, biguint_to_bytes_be, bytes_to_biguint_be, cbor_decode_trivial, die, is_string, entries, bytes, hex_to_bytes, try_sync, create, assign, sha512, hkdf, SI_HASH_ALGORITHM_SHA512} from '@blake.regalia/belt';

import {bech32_encode} from '@solar-republic/crypto';

import {query_secret_contract} from './app-layer.js';
import {chacha20_poly1305_open} from './chacha20-poly1305.js';
import {XN_16} from './constants.js';
import {SX_QUERY_TM_EVENT_TX, TendermintEventFilter} from './tendermint-event-filter.js';
import {sign_amino} from './wallet.js';

export type NotificationCallback = (z_data: CborValue) => void;

type Channels<g_interface extends ContractInterface> = g_interface['config']['snip52_channels'];

const xor_bytes = (atu8_a: Uint8Array, atu8_b: Uint8Array) => bytes(atu8_a.map((xb, ib) => xb ^ atu8_b[ib]));

type ChannelData = [
	si_channel: string,
	atu8_seed: Uint8Array,
	atu8_hash: Uint8Array,
	f_get_id: (s_salt: string) => Promise<CwBase64>,
	f_notify: (w_data: any) => void,
	xg_counter?: bigint,
];

const H_BLOOM_HASH_FUNCTIONS: Dict<(atu8_data: Uint8Array) => Promise<Uint8Array>> = assign(create(null), {
	sha256,
	sha512,
});

const decode_data = (
	atu8_data: Uint8Array,
	g_schema: Snip52Schema.DataDescriptor
): [Snip52Schema.AnyValueSequenced, number] => {
	// parse datatype
	const [s_datatype, s_size, s_dim1, s_dim2] = /^(\w+)(\d+)(\[\d+\])?(\[\d+\])?$/.exec(g_schema.type)!;

	// init read offset
	let ib_read = 0;

	// prep top values list
	let a_values: Snip52Schema.AnyValueSequenced[][] = [];

	// each top dimension
	for(let i_dim2=0; i_dim2<(s_dim2? +s_dim2: 1); i_dim2++) {
		// prep subvalues list
		const a_subvalues: Snip52Schema.AnyValueSequenced[] = [];

		// add to main values
		a_values.push(a_subvalues);

		// each subdimension
		for(let i_dim1=0; i_dim1<(s_dim1? +s_dim1: 1); i_dim1++) {
			// add to subvalues
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			a_subvalues.push(({
				/* eslint-disable @typescript-eslint/no-loop-func,@typescript-eslint/no-unused-vars,@typescript-eslint/naming-convention */
				uint: (_: never) => bytes_to_biguint_be(atu8_data.subarray(ib_read, ib_read+=+s_size/8)),
				address: (_: never) => bech32_encode('secret', atu8_data.subarray(ib_read, ib_read+=20)),
				bytes: (_: never) => atu8_data.subarray(ib_read, ib_read+=+s_size),
				struct: (_: never) => (g_schema as {members: Snip52Schema.DataDescriptor[]}).members.map((g_member) => {
					// decode subdata
					const [z_subdata, ib_subread] = decode_data(atu8_data.subarray(ib_read), g_member);

					// increase amount read
					ib_read += ib_subread;

					// return subdata
					return z_subdata;
				}),
				/* eslint-disable */
			} as unknown as Dict<() => any>)[s_datatype]());
		}
	}

	// unwrap values depending on dimensionality
	return [
		(s_dim1
			? s_dim2
				? a_values
				: a_values[0]
			: a_values[0][0]) as unknown as Snip52Schema.AnyValueSequenced,
		ib_read,
	];
};

/**
 * Subscribes to the set of channels given by a dict of callbacks, each of which will be invoked for every
 * new notification emitted on that channel. 
 * Returns a Promise resolving to a callback that removes the listener. Promise resolves once all subscriptions
 * have been confirmed.
 * @param z_remote - either the URL to an RPC endpoint or an existing {@link TendermintEventFilter} instance
 * @param k_contract 
 * @param z_auth 
 * @param h_channels 
 */
export const subscribe_snip52_channels = async<
	g_interface extends ContractInterface,
	h_channels extends Channels<g_interface>=Channels<g_interface>,
	as_channels extends keyof h_channels=keyof h_channels,
>(
	z_remote: TrustedContextUrl | TendermintEventFilter,
	k_contract: SecretContract<g_interface>,
	z_auth: Exclude<AuthSecret, string>,
	h_channels: {
		[si_channel in as_channels]?: h_channels[si_channel] extends {cbor: CborValue}
			? (<
				w_data extends h_channels[si_channel]['cbor'],
			>(w_data: w_data) => Promisable<void>)
			: h_channels[si_channel] extends {schema: Snip52Schema.Element}
				? (g_data: Snip52Schema.ParseDescriptorSequenced<h_channels[si_channel]['schema']> | undefined, atu8_data: Uint8Array) => void
				: (<
					w_data extends CborValue=CborValue,
				>(w_data: w_data) => Promisable<void>)
				| (<
					g_descriptor extends Snip52Schema.Element,
				>(z_data: Snip52Schema.ParseDescriptorSequenced<g_descriptor>, atu8_data: Uint8Array) => Promisable<void>);
	}
) => {
	// init Tendermint event filter
	const k_filter = is_string(z_remote)? await TendermintEventFilter(z_remote, SX_QUERY_TM_EVENT_TX): z_remote;

	// dict of next notification IDs for channels operating in counter mode
	const h_resolved = {} as Record<CwBase64, ChannelData>;

	// prep list of channels to check operating in txhash mode
	const a_dynamic = [] as ChannelData[];

	// prep list of channels to check operating in txhash mode
	const h_blooms: Dict<(
		si_txn: string,
		atu8_value: Uint8Array,
	) => Promise<void>> = {};

	// fetch channel info for all requested channels at once
	let [g_result, xc_code, s_error] = await query_secret_contract(k_contract as SecretContract<Snip52>, 'channel_info', {
		channels: Object.keys(h_channels),
	}, z_auth);

	// query failed
	if(!g_result) throw die(`While requesting channels from ${k_contract.addr}: ${s_error}`);

	// parse seed
	let atu8_seed = base64_to_bytes(g_result.seed+'');

	// each channel
	for(const g_channel of g_result.channels) {
		const si_channel = g_channel.channel as Extract<keyof typeof h_channels, string>;

		// prep channel hash
		let atu8_hash = (await sha256(text_to_bytes(si_channel))).subarray(0, 12);

		// notification ID generator
		let f_notification_id = async(s_salt: string) => await hmac(atu8_seed, text_to_bytes(si_channel+':'+s_salt));

		// notification ID as string
		let f_next_id = async(s_salt: string) => bytes_to_base64(await f_notification_id(s_salt));

		// prep common part of channel data
		const a_data: Pop<ChannelData> = [
			si_channel,
			atu8_seed,
			atu8_hash,
			f_next_id,
			h_channels[si_channel] as (w_data: any) => void,
		];

		// counter mode
		if('counter' === g_channel.mode) {
			// step counter back by one for initial call to next_id
			let xg_counter = BigInt(g_channel.counter) -1n;

			// derive next notification id
			let si_notification = await f_next_id(++xg_counter+'');

			// ensure it is a match with the next expected
			if(si_notification !== g_channel.next_id) die('Failed to derive accurate notification ID');

			// save notification
			h_resolved[si_notification] = [...a_data, xg_counter];
		}
		// txhash mode
		else if('txhash' === g_channel.mode) {
			// add to list
			a_dynamic.push(a_data);
		}
		// bloom
		else if('bloom' === g_channel.mode) {
			// destructure params
			const {
				m: n_param_m,
				k: n_param_k,
				h: s_param_h,
			} = g_channel.parameters;

			// size of each packet in bytes
			const nb_packet = (g_channel.data as Snip52Schema.PacketDescriptor).packetSize;

			// create bloom filter checker
			h_blooms[si_channel] = async(si_txn, atu8_value) => {
				// create filter as bigint
				const xg_filter = bytes_to_biguint_be(atu8_value.subarray(0, n_param_m / 8));

				// create notification id
				const atu8_notification_id = await f_notification_id(si_txn);

				// hash id
				const atu8_superhash = await H_BLOOM_HASH_FUNCTIONS[s_param_h](atu8_notification_id);

				// each hash
				FILTER_CHECK: {
					// each hash
					for(let i_hash=0; i_hash<n_param_k; i_hash++) {
						// one of the hashes doesn't match; not meant for this recipient
						if(xg_filter !== (xg_filter & (
							1n << bytes_to_biguint_be(
								atu8_superhash.subarray(i_hash * n_param_k, (i_hash + 1) * n_param_k)
							)
						))) break FILTER_CHECK;
					}

					// ref data portion
					const atu8_data = atu8_value.subarray(n_param_m / 8);

					// depending on datatype
					const g_schema = g_channel.data;
					const s_datatype = g_schema.type;

					// prep data result
					let z_data: Snip52Schema.AnyValueSequenced | undefined;

					// packets[M]
					const m_packets = /^packet\[(\d+)\]$/.exec(s_datatype);
					if(m_packets) {
						// prep expected packet id
						const xg_packet_id = bytes_to_biguint_be(atu8_notification_id.subarray(0, 8));

						// each packet
						for(let ib_read=8; ib_read<(nb_packet+8)*+m_packets[1]; ib_read+=nb_packet+8) {
							// found matching packet id
							if(xg_packet_id === bytes_to_biguint_be(atu8_data.subarray(ib_read-8, ib_read))) {
								// select packet ikm
								const atu8_ikm = atu8_data.subarray(ib_read, ib_read+nb_packet);

								// derive packet key
								const atu8_key = nb_packet > 24
									? await hkdf(atu8_ikm, nb_packet, bytes(64), bytes(), SI_HASH_ALGORITHM_SHA512)
									: atu8_ikm.subarray(0, nb_packet);

								// decrypt packet
								const atu8_plaintext = xor_bytes(atu8_data, atu8_key);

								// decode packet
								[z_data] = decode_data(atu8_plaintext, (g_schema as Snip52Schema.PacketDescriptor).data);

								// stop searching for packet
								break;
							}
						}

						// packet was not found
					}
					// decode as unencrypted data
					else {
						[z_data] = decode_data(atu8_data, g_schema as Snip52Schema.DataDescriptor);
					}

					// received notification
					try_sync(() => (h_channels[si_channel] as ((z: typeof z_data, atu8: Uint8Array) => Promisable<void>))(z_data, atu8_data));
				}
			};
		}
		// unknown
		else {
			console.warn('Unknown SNIP-52 channel mode: '+(g_channel as {mode: string}).mode);
		}
	}

	const f_apply = async(
		si_notification: string,
		[, atu8_seed, atu8_hash,, fk_notification]: ChannelData,
		f_salt: () => Uint8Array,
		{TxResult:g_tx}: TxResultWrapper,
		h_events: Dict<string[]>,
		fk_handled?: () => Promisable<void>
	) => {
		// notification received
		let a_received = h_events['wasm.snip52:'+si_notification];
		if(a_received) {
			// ref tx hash
			let si_tx = h_events['tx.hash'][0];

			// construct aad
			let atu8_aad = text_to_bytes(g_tx.height+':'+si_tx);

			// create nonce
			let atu8_nonce = xor_bytes(atu8_hash, f_salt());

			// each notification
			for(const sb64_received of a_received) {
				// decode payload
				let atu8_payload = base64_to_bytes(sb64_received);

				// decrypt notification data, splitting payload between tag and ciphertext
				let atu8_message = chacha20_poly1305_open(atu8_seed, atu8_nonce, atu8_payload.subarray(-XN_16), atu8_payload.subarray(0, -XN_16), atu8_aad);

				// call listener with decrypted data
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				try_sync(() => fk_notification(cbor_decode_trivial(atu8_message)[0] as any));

				// callback for each handled notification
				await fk_handled?.();
			}
		}
	};

	// on contract execution; return unlisten callback
	return k_filter.when('wasm.contract_address', k_contract.addr, async({value:g_data}, h_events) => {
		// check each next expected notification ID
		for(let [si_notification, a_data] of entries(h_resolved)) {
			// destructure tuple
			let [,,, f_get_id,, xg_counter] = a_data;

			// bind salt generator to scoped counter variable
			let f_salt = () => xor_bytes(a_data[2], biguint_to_bytes_be(xg_counter!, 12));

			// apply notification
			await f_apply(si_notification, a_data, f_salt, g_data, h_events, async() => {
				// remove notification
				delete h_resolved[si_notification as CwBase64];

				// update counter and save to next expected notification ID
				h_resolved[await f_get_id((a_data[5]=++xg_counter!)+'')] = a_data;
			});
		}

		// ref transaction hash
		const si_txn = h_events['tx.hash'][0];

		// compute salt
		const atu8_salt = hex_to_bytes(si_txn).subarray(0, 12);

		// check each channel operating in txhash mode
		for(const a_data of a_dynamic) {
			// compute notification ID
			const si_notification = await a_data[3](si_txn);

			// apply notification
			await f_apply(si_notification, a_data, () => atu8_salt, g_data, h_events);
		}

		// check each channel operating in bloom mode
		for(const [si_channel, f_attempt] of entries(h_blooms)) {
			// lookup payloads
			for(const sb64_payload of h_events[`wasm.snip52:#${si_channel}`]) {
				// decode
				const atu8_value = base64_to_bytes(sb64_payload);

				// check filter and decode data if applicable
				void f_attempt(si_txn, atu8_value);
			}
		}
	});
};


export const sign_seed_update = async(
	k_wallet: Wallet,
	sa_contract: WeakSecretAccAddr,
	sb64_previous: CwBase64
): Promise<NotificationSeedUpdate> => {
	// prep params
	const g_params: NotificationSeedUpdateConfig = {
		contract: sa_contract as CwSecretAccAddr,
		previous_seed: sb64_previous,
	};

	// sign query permit
	const [atu8_signature, g_signed] = await sign_amino<[MsgNotificationSeedUpdate]>(k_wallet, [{
		type: 'notification_seed',
		value: g_params,
	}], [['0', 'uscrt']], '1', ['0', '0']);

	// encode notification seed update
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
