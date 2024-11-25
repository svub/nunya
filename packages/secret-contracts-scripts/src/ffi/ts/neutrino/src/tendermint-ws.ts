/* eslint-disable prefer-const */
import type {NaiveJsonString, Nilable, Promisable} from '@blake.regalia/belt';
import type {TrustedContextUrl} from '@solar-republic/types';

import {assign, is_function} from '@blake.regalia/belt';

import {subscribe_tendermint_events} from './app-layer';

export type TendermintWsRestartParam = boolean | 0 | 1 | {
	(d_event: CloseEvent | undefined): Promisable<
		boolean | 0 | 1 | (
			(d_ws: WebSocket) => Promisable<void>
		)
	>;
};

export type TendermintWs = {
	/**
	 * Returns the current {@link WebSocket}.
	 */
	ws(): WebSocket;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TendermintWs = async(
	p_rpc: TrustedContextUrl,
	sx_query: string,
	fk_message: (d_event: MessageEvent<NaiveJsonString>) => any,
	z_restart?: TendermintWsRestartParam | undefined,
	dc_ws?: typeof WebSocket
): Promise<TendermintWs> => {
	let d_ws!: WebSocket;

	// cache whether the restart arg is a function
	let b_restart_fn = is_function(z_restart);

	// connector
	let f_reconnect = async() => assign(d_ws=await subscribe_tendermint_events(p_rpc, sx_query, fk_message, dc_ws), {
		// close event
		async onclose(d_event) {
			// notify caller
			const z_restart_ans = b_restart_fn? await (z_restart as Function)(d_event): z_restart;

			// truthy value means user wants to restart WebSocket
			if(z_restart_ans) {
				// start reconnecting
				await f_reconnect();

				// user wants to receive new WebSocket once its open
				if(is_function(z_restart_ans)) void z_restart_ans(d_ws);
			}
		},
	} satisfies Partial<WebSocket>);

	// initiate first connection
	await f_reconnect();

	// return struct that allows caller to retrieve current WebSocket
	return {
		ws: () => d_ws,
	};
};
