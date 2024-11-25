import './helper';

import type {NaiveBase64} from '@blake.regalia/belt';

import type {Snip52} from '@solar-republic/contractor';
import type {SecretContract} from '@solar-republic/neutrino';
import type {CwBase64, WeakUintStr} from '@solar-republic/types';

import {bytes_to_hex, text_to_base64, base64_to_bytes} from '@blake.regalia/belt';


import {bech32_encode} from '@solar-republic/crypto';

import {connect} from './live';
import {exec_secret_contract, query_secret_contract} from '../src/app-layer';

import {sign_seed_update, subscribe_snip52_channels} from '../src/snip-52';


const SI_COMMAND = process.argv[2] as 'init' | 'trigger' | 'update' | 'export' ?? 'subscribe';

(async function() {
	const {
		k_wallet,
		k_contract,
		sa_granter,
		g_permit,
		g_executables,
		atu8_sk,
	} = await connect();

	async function channel_info() {
		const [g_res_list] = await query_secret_contract(k_contract as SecretContract<Snip52>, 'list_channels');

		// get first channel
		const si_channel = g_res_list!['channels'][0];

		// get its info using viewing key
		const [g_res_info, xc_code, s_error] = await query_secret_contract<{
			channel: string;
			seed: NaiveBase64;
			counter: WeakUintStr;
			as_of_block: WeakUintStr;
			cddl?: string;
		}>(k_contract, 'channel_info', {
			channel: si_channel,
		}, ['password123', k_wallet.addr]);

		console.log(g_res_info, xc_code, s_error);

		return g_res_info;
	}

	await {
		export() {
			console.log(bytes_to_hex(atu8_sk));
		},

		async init() {
			await g_executables.viewing_key();
		},

		async subscribe() {
			await channel_info();

			await subscribe_snip52_channels(k_wallet.rpc, k_contract, g_permit, {
				tx(g_data) {
					const atu8_sender = base64_to_bytes((g_data as Map<string, string>).get('sender')!);

					const sa_sender = bech32_encode('secret', atu8_sender);

					console.log(`Received from ${sa_sender}`);
				},
			});
		},

		async trigger() {
			const a_response = await exec_secret_contract(k_contract, k_wallet, {
				tx: {
					channel: 'tx',
				},
			}, [['2500', 'uscrt']], '50000', '', sa_granter);

			console.log(`Trigger notif: `, ...a_response);
		},

		async update() {
			// fetch current seed
			const {seed:sb64_seed} = (await channel_info())!;

			// sign new doc
			const g_update = await sign_seed_update(k_wallet, k_contract.addr, sb64_seed);

			// execute update
			const a_response = await exec_secret_contract(k_contract, k_wallet, {
				update_seed: {
					signed_doc: g_update,
				},
			}, [['2500', 'uscrt']], '50000', '', sa_granter);

			console.log(`Update seed: `, ...a_response);
		},

		async update_invalid() {
			// fetch current seed
			const {seed:sb64_seed} = (await channel_info())!;

			// sign new doc
			const g_update = await sign_seed_update(k_wallet, k_contract.addr, text_to_base64('not-seed') as unknown as CwBase64);

			// execute update
			const a_response = await exec_secret_contract(k_contract, k_wallet, {
				update_seed: {
					signed_doc: g_update,
				},
			}, [['2500', 'uscrt']], '50000', '', sa_granter);

			console.log(`Update invalid seed: `, ...a_response);
		},
	}[SI_COMMAND]();
})();
