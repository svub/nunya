import type {Promisable} from '@blake.regalia/belt';

import {is_string, map_entries} from '@blake.regalia/belt';

/* eslint-disable @typescript-eslint/naming-convention */
const SX_ANSI_GREEN = '\x1b[32m';
const SX_ANSI_RESET = '\x1b[0m';
/* eslint-enable */

// polyfill crypto global for node.js env
globalThis.crypto ||= (await import('crypto')).webcrypto as Crypto;

// polyfill WebSocket
globalThis.WebSocket ||= (await import('isomorphic-ws')).default;

export function pass(s_test: string): void {
	// eslint-disable-next-line no-console
	console.log(`${SX_ANSI_GREEN}✓${SX_ANSI_RESET} ${s_test}`);
}

function error(s_test: string, ...a_args: Array<string | object>) {
	const a_rest = a_args.map(z => is_string(z)? z: map_entries(z, ([si, w]) => `\n\t${si}: ${w}`).join('\n'));
	console.error(`${s_test}: ${a_rest.join('; ')}`);
}

export function fail(s_test: string, ...a_args: Array<string | object>): void {
	error(`❌ ${s_test}`, ...a_args);
}

export function caught(s_test: string, ...a_args: Array<string | object>): void {
	error(`💀 ${s_test}`, ...a_args);
}

interface GroupCallback {
	it(s_test: string, f_test: () => Promisable<void>): Promise<void>;
}

export async function describe(s_group: string, f_group: (g_call: GroupCallback) => Promisable<void>): Promise<void> {
	const a_results: Array<{
		type: 'pass';
		name: string;
	} | {
		type: 'fail';
		name: string;
		message: string;
	}> = [];

	await f_group({
		async it(s_test: string, f_test: () => Promisable<void>) {
			try {
				await f_test();

				a_results.push({
					type: 'pass',
					name: s_test,
				});
			}
			catch(e_run) {
				a_results.push({
					type: 'fail',
					name: s_test,
					message: (e_run as Error).stack || '',
				});
			}
		},
	});

	console.log('');
	console.log(`# ${s_group}\n${'='.repeat(2+s_group.length)}`);

	for(const g_result of a_results) {
		if('pass' === g_result.type) {
			pass(g_result.name);
		}
		else {
			fail(g_result.name, g_result.message);
		}
	}

	console.log('');
}
