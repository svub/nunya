/* eslint-disable @typescript-eslint/naming-convention */
import type {JsonValue, NaiveBase64, NaiveHexMixed, Nilable} from '@blake.regalia/belt';
import type {CwHexLower} from '@solar-republic/types';

import {
	bytes,
	ATU8_NIL,
	base64_to_bytes,
	bytes_to_text,
	concat2,
	text_to_bytes,
	die,
	stringify_json,
} from '@blake.regalia/belt';

import {aes_128_siv_decrypt, aes_128_siv_encrypt} from './aes-128-siv.js';
import {random_32} from './util.js';
import {ecs_mul, ecs_mul_base} from './x25519.js';


export interface SecretWasm {
	txKey(atu8_nonce?: Uint8Array): Promise<Uint8Array>;
	encodeMsg(sb16_code_hash: NaiveHexMixed, g_msg: JsonValue, nb_msg_block?: number): Promise<Uint8Array>;
	decrypt(atu8_ciphertext: Uint8Array, atu8_nonce: Uint8Array): Promise<Uint8Array>;
	decodeMsg(sb64_msg: NaiveBase64): Promise<[string, CwHexLower, Uint8Array]>;
}

export const SecretWasm = (atu8_consensus_pk: Uint8Array, atu8_seed?: Nilable<Uint8Array>): SecretWasm => {
	atu8_seed = atu8_seed || random_32();

	if(32 !== atu8_consensus_pk.byteLength) die(`Invalid consensus key length`);
	if(32 !== atu8_seed.byteLength) die(`Invalid seed length`);

	// copy seed to new private key
	const atu8_sk = atu8_seed.slice();

	// derive curve25119 public key
	const _atu8_pk = ecs_mul_base(atu8_sk);

	// turn secret key into correct format
	atu8_sk[0] &= 0xf8;
	atu8_sk[31] &= 0x7f;
	atu8_sk[31] |= 0x40;

	// remove sign bit from public key
	_atu8_pk[31] &= 0x7f;

	// produce tx ikm
	const _atu8_tx_ikm = ecs_mul(atu8_sk, atu8_consensus_pk);

	return {
		async txKey(atu8_nonce=random_32()) {
			const atu8_input = concat2(_atu8_tx_ikm, atu8_nonce);

			const dk_input = await crypto.subtle.importKey('raw', atu8_input, 'HKDF', false, ['deriveBits']);

			const ab_encryption = await crypto.subtle.deriveBits({
				name: 'HKDF',
				hash: 'SHA-256',
				salt: base64_to_bytes('AAAAAAAAAAAAAkvq2N9pmQhSwgLbDgCXwaEupjfX6W0='),
				info: ATU8_NIL,
			}, dk_input, 256);

			return bytes(ab_encryption);
		},

		async encodeMsg(sb16_code_hash, g_msg, nb_msg_block) {
			// construct payload
			const atu8_payload = text_to_bytes(sb16_code_hash.toUpperCase()+stringify_json(g_msg));

			// pad to make multiple of block size
			const nb_payload = atu8_payload.byteLength;
			const nb_target = nb_msg_block? Math.ceil(nb_payload / nb_msg_block) * nb_msg_block: nb_payload;

			// pad the end with spaces
			const atu8_padding = text_to_bytes(' '.repeat(nb_target - nb_payload));

			// construct plaintext
			const atu8_plaintext = concat2(atu8_payload, atu8_padding);

			// generate nonce
			const atu8_nonce = random_32();

			// derive transaction encryption key
			const atu8_txk = await this.txKey(atu8_nonce);

			// encrypt
			const atu8_ciphertext = await aes_128_siv_encrypt(atu8_txk, atu8_plaintext);

			// produce final output bytes
			return concat2(atu8_nonce, concat2(_atu8_pk, atu8_ciphertext));
		},

		async decrypt(atu8_ciphertext, atu8_nonce) {
			// derive transaction encryption key
			const atu8_txk = await this.txKey(atu8_nonce);

			// decrypt ciphertext
			return await aes_128_siv_decrypt(atu8_txk, atu8_ciphertext);
		},

		async decodeMsg(sb64_msg) {
			// decode message
			const atu8_msg = base64_to_bytes(sb64_msg);

			// nonce
			const atu8_nonce = atu8_msg.subarray(0, 32);

			// // public key
			// const atu8_pk = atu8_msg.subarray(32, 64);

			// ciphertext
			const atu8_ciphertext = atu8_msg.subarray(64);

			const atu8_plaintext = await this.decrypt(atu8_ciphertext, atu8_nonce);

			const sx_exec = bytes_to_text(atu8_plaintext);

			return [
				// contents
				sx_exec.slice(64),

				// code hash
				sx_exec.slice(0, 64) as CwHexLower,

				// nonce
				atu8_nonce,
			];
		},
	};
};
