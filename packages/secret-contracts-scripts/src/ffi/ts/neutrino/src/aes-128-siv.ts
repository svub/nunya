import {ATU8_NIL, base64_to_text, bytes, bytes_to_base64, bytes_to_text, die} from '@blake.regalia/belt';

import {NB_AES_BLOCK, aes_ctr, aes_key, s2v} from './aes.js';


// splits an AES-128 SIV key
const split_siv_key = async(atu8_key: Uint8Array): Promise<[CryptoKey, CryptoKey]> => {
	if(32 !== atu8_key.byteLength) die('SIV key not 32 bytes');

	// destructure halves
	const atu8_key_mac = atu8_key.subarray(0, atu8_key.length / 2);
	const atu8_key_ctr = atu8_key.subarray(atu8_key_mac.length);

	// import each key
	const d_key_cbc = await aes_key(atu8_key_mac, 'AES-CBC');
	const d_key_ctr = await aes_key(atu8_key_ctr, 'AES-CTR');

	// return pair as tuple
	return [d_key_cbc, d_key_ctr];
};

// moved to separate function since it saves 2 bytes after terser
const zero_iv = (atu8_iv: Uint8Array) => {
	atu8_iv[NB_AES_BLOCK - 8] &= 0x7f;
	atu8_iv[NB_AES_BLOCK - 4] &= 0x7f;
};

/**
 * Encrypt a given plaintext using AES-128 SIV with a properly-formatted key
 * @param atu8_key - an AES-128 SIV key
 * @param atu8_plaintext - the plaintext input
 * @param a_ad - optional associated data (defaults to `[new Uint8Array(0)]` for Secret Network)
 * @returns ciphertext output
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const aes_128_siv_encrypt = async(atu8_key: Uint8Array, atu8_plaintext: Uint8Array, a_ad=[ATU8_NIL]): Promise<Uint8Array> => {
	// construct aes keys
	const [d_key_cbc, d_key_ctr] = await split_siv_key(atu8_key);

	// prep payload
	const atu8_payload = bytes(NB_AES_BLOCK + atu8_plaintext.byteLength);

	// V = S2V(K1, AD1, ..., ADn, P))
	const atu8_iv = await s2v(d_key_cbc, atu8_plaintext, a_ad);

	// set tag into payload
	atu8_payload.set(atu8_iv, 0);

	// Q = V bitand (1^64 || 0^1 || 1^31 || 0^1 || 1^31)
	zero_iv(atu8_iv);

	// encrypt plaintext into payload
	atu8_payload.set(await aes_ctr(d_key_ctr, atu8_iv, atu8_plaintext), NB_AES_BLOCK);

	// return payload
	return atu8_payload;
};

/**
 * Decrypt a given ciphertext using AES-128 SIV with a properly-formatted key
 * @param atu8_key - an AES-128 SIV key
 * @param atu8_payload - the input payload
 * @param a_ad - optional associated data (defaults to `[new Uint8Array(0)]` for Secret Network)
 * @returns plaintext output
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const aes_128_siv_decrypt = async(
	atu8_key: Uint8Array,
	atu8_payload: Uint8Array,
	a_ad=[ATU8_NIL]
): Promise<Uint8Array> => {
	const [d_key_cbc, d_key_ctr] = await split_siv_key(atu8_key);

	if(atu8_payload.byteLength < NB_AES_BLOCK) die(`SIV payload < ${NB_AES_BLOCK} bytes`);

	// extract tag || ciphertext
	const atu8_tag = atu8_payload.subarray(0, NB_AES_BLOCK);
	const atu8_ciphertext = atu8_payload.subarray(NB_AES_BLOCK);

	// copy tag to iv
	const atu8_iv = atu8_tag.slice();

	// zero-out top bits in last 32-bit words of iv
	zero_iv(atu8_iv);

	// decrypt ciphertext
	const atu8_plaintext = await aes_ctr(d_key_ctr, atu8_iv, atu8_ciphertext);

	// authenticate
	const atu8_cmac = await s2v(d_key_cbc, atu8_plaintext, a_ad);

	// assert expected length
	if(atu8_cmac.length !== NB_AES_BLOCK || atu8_tag.length !== NB_AES_BLOCK) die(`Invalid tag/CMAC lengths`);

	// compare for equality
	let xb_cmp = 0;
	for(let ib_each=0; ib_each<NB_AES_BLOCK; ib_each++) {
		xb_cmp |= atu8_tag[ib_each] ^ atu8_cmac[ib_each];
	}

	// not equal
	if(xb_cmp) {
		die(`SIV tag/CMAC mismatch; decoded:\n${
			base64_to_text(/^([+a-z\d/]*)/i.exec(bytes_to_text(atu8_plaintext))![1])
		}\n\nentire plaintext:\n${bytes_to_base64(atu8_plaintext)}`);
	}

	// plaintext
	return atu8_plaintext;
};
