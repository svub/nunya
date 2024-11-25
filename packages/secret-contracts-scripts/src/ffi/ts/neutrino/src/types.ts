import type {AsJson, Dict, JsonObject, JsonValue, Nilable} from '@blake.regalia/belt';
import type {AminoMsg, Coin, StdSignDoc} from '@cosmjs/amino';
import type {SecretAccAddr} from '@solar-republic/contractor';
import type {TendermintAbciTxResult} from '@solar-republic/cosmos-grpc/tendermint/abci/types';
import type {WeakUint128Str, CwUint128, CwBase64, CwAccountAddr, WeakAccountAddr, TrustedContextUrl, SecretQueryPermit, CwUint32} from '@solar-republic/types';

export type WeakSecretAccAddr = WeakAccountAddr<'secret'>;

export type CwSecretAccAddr = CwAccountAddr<'secret'>;

export type CosmosQueryError = AsJson<{
	code: CwUint32;
	message: string;
	details: unknown[];
}>;

export type ContractInfo = {
	code_id: WeakUint128Str;
	creator: SecretAccAddr;
	label: string;
};

export type PermitConfig = {
	permit_name: string;
	allowed_tokens: CwSecretAccAddr[];
	permissions: string[];
};

export type NotificationSeedUpdateConfig = {
	contract: CwSecretAccAddr;
	previous_seed: CwBase64;
};

export type SignedAminoDoc<
	h_config extends JsonObject,
> = {
	params: h_config & {
		chain_id: string;
	};
	signature: {
		pub_key: {
			type: 'tendermint/PubKeySecp256k1';
			value: CwBase64;
		};
		signature: CwBase64;
	};
};

// export type QueryPermit = SignedAminoDoc<PermitConfig>;

export type NotificationSeedUpdate = SignedAminoDoc<NotificationSeedUpdateConfig>;

export type MsgQueryPermit = TypedAminoMsg<'query_permit', PermitConfig>;

export type MsgNotificationSeedUpdate = TypedAminoMsg<'notification_seed', NotificationSeedUpdateConfig>;

export interface TypedCoin extends Coin, JsonObject {
	readonly amount: CwUint128;
}

export interface TypedStdFee extends JsonObject {
	readonly amount: TypedCoin[];
	readonly gas: CwUint128;
	readonly granter?: SecretAccAddr;
	readonly payer?: SecretAccAddr;
}

export interface TypedAminoMsg<
	si_type extends string=string,
	g_value extends JsonObject=JsonObject,
> extends AminoMsg, JsonObject {
	readonly type: si_type;
	readonly value: g_value;
}

export interface TypedStdSignDoc<
	a_msgs extends readonly TypedAminoMsg[]=TypedAminoMsg[],
> extends StdSignDoc, JsonObject<a_msgs> {
	readonly account_number: CwUint128;
	readonly sequence: CwUint128;
	readonly fee: TypedStdFee;
	readonly msgs: a_msgs;
}


export type AuthSecret_ViewerInfo = [sh_key: string, sa_viewer?: WeakSecretAccAddr];

/**
 * There are 3 types of authenticated queries typically used on Secret Network.
 * 1. Viewing Keys - indicated here by `string`
 * 2. Query Permits - indicated here by `Record<string, string>`
 * 3. ViewerInfo struts - indicated here by `[viewing_key: string, addr: 'secret1${string}']`
 */
export type AuthSecret = string | SecretQueryPermit | AuthSecret_ViewerInfo;


export type SlimAuthInfo = [acc_num: Nilable<WeakUint128Str>, sequence: Nilable<WeakUint128Str>];

/**
 * Describes a request to some URL with partial options to use with each request
 */
export type RequestPattern<p_urls extends string=never> = (TrustedContextUrl | p_urls) | ({
	/**
	 * URL of the target
	 */
	url: TrustedContextUrl | p_urls;

	/**
	 * Optional headers to send with LCD requests
	 */
	headers?: Dict;

	/**
	 * Optional redirect behavior
	 */
	redirect?: RequestInit['redirect'];

	/**
	 * Optional {@link AbortSignal} to use to control the connection
	 */
	signal?: AbortSignal;
});

/**
 * Describes a pattern of requests to some remote service with partial options to use with each request
 */
export type RemoteService<p_urls extends string=never> = ({
	/**
	 * Base URL of the remote service
	 */
	origin: TrustedContextUrl | p_urls;

	/**
	 * Optional headers to send with LCD requests
	 */
	headers?: Dict;

	/**
	 * Optional redirect behavior
	 */
	redirect?: RequestRedirect;
});

/**
 * Describes a pattern of requests to some remote service with partial options to use with each request
 */
export type RemoteServiceArg<p_urls extends string=never> = (TrustedContextUrl | p_urls) | RemoteService<p_urls>;

/**
 * Bundles LCD and RPC endpoint URLs together
 */
export interface LcdRpcStruct {
	/**
	 * The LCD endpoint the struct is configured for
	 */
	lcd: RemoteService;

	/**
	 * RPC endpoint used for confirming broadcasted transactions
	 */
	rpc: RemoteService;
}

/**
 * Extends the {@link LcdRpcStruct} with an option to override the WebSocket URL
 */
export type LcdRpcWsStruct = LcdRpcStruct & {
	/**
	 * URL to override the RPC when subscribing to /websocket
	 */
	ws?: TrustedContextUrl;
};

/**
 * JSON-RPC response
 */
export type JsonRpcResponse<
	w_result extends JsonObject,
> = {
	jsonrpc: '2.0';
	id: string | number;
	result?: w_result;
	error?: {
		code: number;
		message: string;
		data?: JsonValue;
	};
};


export type TendermintEvent<
	w_value extends JsonObject=JsonObject,
> = {
	query: string;
	data: {
		type: `tendermint/event/${string}`;
		value: w_value;
	};
	events: Dict<string[]>;
};


export type TxResultWrapper = {
	TxResult: TendermintAbciTxResult;
};
