/* eslint-disable prefer-const */
import {bytes, bytes_to_base64, dataview, die} from '@blake.regalia/belt';

import {chacha20} from './chacha20.js';
import {poly1305} from './poly1305.js';


// encrypt/decrypt data and generate the poly1305 key
const transcrypt = (atu8_key: Uint8Array, atu8_nonce: Uint8Array, atu8_data: Uint8Array): [Uint8Array, Uint8Array] => [
	// poly1305 key generation
	chacha20(atu8_key, atu8_nonce, bytes(32), 0),

	// transcryption
	chacha20(atu8_key, atu8_nonce, atu8_data, 1),
];

// construct the poly1305 tag
const poly1305_auth = (atu8_poly1305_key: Uint8Array, atu8_ciphertext: Uint8Array, atu8_aad: Uint8Array | undefined) => {
	// normalize aad
	atu8_aad ||= bytes(0);

	// cache length of ciphertext and aad
	let nb_ciphertext = atu8_ciphertext.length;
	let nb_aad = atu8_aad.length;
	let ib_ciphertext_write = (nb_aad-1 & ~15) + 16;

	// compute total length of msg: +16 for ciphertext w/ padding, +8 for len(AAD), +8 for len(ciphertext)
	let nb_msg = ib_ciphertext_write + (nb_ciphertext-1 & ~15) + 32;

	// prep constructed message
	let atu8_msg = bytes(nb_msg);

	// prep DataView for writing le nums
	let dv_msg = dataview(atu8_msg.buffer);

	// padded aad
	atu8_msg.set(atu8_aad);

	// padded ciphertext
	atu8_msg.set(atu8_ciphertext, ib_ciphertext_write);

	// write length of aad and ciphertext as 32-bit little-endian integers (limited to 4 GiB each)
	dv_msg.setUint32(nb_msg - 16, nb_aad, true);
	dv_msg.setUint32(nb_msg - 8, nb_ciphertext, true);

	// generate tag
	return poly1305(atu8_poly1305_key, atu8_msg);
};


/**
 * 
 * @param atu8_key 
 * @param atu8_nonce 
 * @param atu8_plaintext - limited to 4 GiB in size
 * @param atu8_aad - additional authenticated data
 */
export const chacha20_poly1305_seal = (
	atu8_key: Uint8Array,
	atu8_nonce: Uint8Array,
	atu8_plaintext: Uint8Array,
	atu8_aad?: Uint8Array
): [
	atu8_ciphertext: Uint8Array,
	atu8_tag: Uint8Array,
] => {
	// encrypt
	let [
		atu8_poly1305_key,
		atu8_ciphertext,
	] = transcrypt(atu8_key, atu8_nonce, atu8_plaintext);

	// generate tag; return ciphertext and tag
	return [atu8_ciphertext, poly1305_auth(atu8_poly1305_key, atu8_ciphertext, atu8_aad)];
};


/**
 * 
 * @param atu8_key 
 * @param atu8_nonce 
 * @param atu8_ciphertext 
 * @param atu8_tag 
 * @returns 
 */
export const chacha20_poly1305_open = (
	atu8_key: Uint8Array,
	atu8_nonce: Uint8Array,
	atu8_tag: Uint8Array,
	atu8_ciphertext: Uint8Array,
	atu8_aad?: Uint8Array
): Uint8Array => {
	// decrypt
	let [
		atu8_poly1305_key,
		atu8_plaintext,
	] = transcrypt(atu8_key, atu8_nonce, atu8_ciphertext);

	// generate expected tag
	let atu8_tag_expected = poly1305_auth(atu8_poly1305_key, atu8_ciphertext, atu8_aad);

	// mismatch
	if(bytes_to_base64(atu8_tag_expected) !== bytes_to_base64(atu8_tag)) die('Tag mismatch; tampered or incomplete data');

	// return plaintext
	return atu8_plaintext;
};
