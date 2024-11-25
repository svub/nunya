import {bytes, dataview} from '@blake.regalia/belt';

import {rotl} from './bitwise.js';
import {XN_16} from './constants.js';

// xn_a: number, xn_b: number, xn_c: number, xn_d: number
const quarterround = (atu32_d: Uint32Array, i_a: number, i_b: number, i_c: number, i_d: number) => {
	// best gzip option
	atu32_d[i_d] = rotl(atu32_d[i_d] ^ (atu32_d[i_a] += atu32_d[i_b]), 16);
	atu32_d[i_b] = rotl(atu32_d[i_b] ^ (atu32_d[i_c] += atu32_d[i_d]), 12);
	atu32_d[i_d] = rotl(atu32_d[i_d] ^ (atu32_d[i_a] += atu32_d[i_b]), 8);
	atu32_d[i_b] = rotl(atu32_d[i_b] ^ (atu32_d[i_c] += atu32_d[i_d]), 7);
};

/**
 * Encrypts or decrypts data using ChaCha20
 * @param atu8_key - the secret key
 * @param atu8_nonce - nonce
 * @param atu8_data - plaintext to encrypt or ciphertext to decrypt
 * @param xn_counter - optional counter to start with
 */
export const chacha20 = (atu8_key: Uint8Array, atu8_nonce: Uint8Array, atu8_data: Uint8Array, xn_counter=0): Uint8Array => {
	// iterator
	let i_each;

	// prepare output
	const atu8_out = bytes(atu8_data.length);

	// prepare keystream
	const atu8_keystream = bytes(64);
	const dv_keystream = dataview(atu8_keystream.buffer);

	// read key and nonce as sequences of uint32 words in little-endian
	const dv_key = dataview(atu8_key.buffer);
	const dv_nonce = dataview(atu8_nonce.buffer);
	const a_words_key: number[] = [];
	const a_words_nonce: number[] = [];
	for(i_each=0; i_each<8; i_each++) {
		a_words_key[i_each] = dv_key.getUint32(i_each * 4, true);
		if(i_each < 3) a_words_nonce[i_each] = dv_nonce.getUint32(i_each * 4, true);
	}

	// initialize state
	const atu32_init = Uint32Array.from([
		// The first four words (0-3) are constants: 0x61707865, 0x3320646e,
		// 0x79622d32, 0x6b206574.
		0x61707865,
		0x3320646e,
		0x79622d32,
		0x6b206574,

		// The next eight words (4-11) are taken from the 256-bit key by
		// reading the bytes in little-endian order, in 4-byte chunks.
		...a_words_key,

		// Word 12 is a block counter.  Since each block is 64-byte, a 32-bit
		// word is enough for 256 gigabytes of data.
		xn_counter,

		// Words 13-15 are a nonce, which MUST not be repeated for the same
		// key.  The 13th word is the first 32 bits of the input nonce taken
		// as a little-endian integer, while the 15th word is the last 32
		// bits.
		...a_words_nonce,
	]);

	let ib_keystream = 0;

	// each block in data
	for(let ib_read=0; ib_read<atu8_data.length; ib_read++) {
		// obtain a new keystream
		if(!(ib_keystream % 64)) {
			// copy the original state
			const atu32_d = atu32_init.slice();

			// rounds
			for(i_each=0; i_each<10; i_each++) {
				// column round
				for(let i_sub=0; i_sub<4; i_sub++) {
					quarterround(atu32_d, i_sub, i_sub+4, i_sub+8, i_sub+12);
				}
				// quarterround(atu32_d, 0, 4, 8, 12);
				// quarterround(atu32_d, 1, 5, 9, 13);
				// quarterround(atu32_d, 2, 6, 10, 14);
				// quarterround(atu32_d, 3, 7, 11, 15);

				// diagonal roundd
				quarterround(atu32_d, 0, 5, 10, 15);
				quarterround(atu32_d, 1, 6, 11, 12);
				quarterround(atu32_d, 2, 7, 8, 13);
				quarterround(atu32_d, 3, 4, 9, 14);
			}

			// At the end of 20 rounds (or 10 iterations of the above list), we add
			// the original input words to the output words, and serialize the
			// result by sequencing the words one-by-one in little-endian order.
			for(i_each=0; i_each<XN_16; i_each++) {
				// add original input words to output words and sequence in LE
				dv_keystream.setUint32(i_each * 4, atu32_d[i_each] + atu32_init[i_each], true);
			}

			// increment counter
			atu32_init[12]++;

			// reset keystream pointer
			ib_keystream = 0;
		}

		// use keystream
		atu8_out[ib_read] = atu8_data[ib_read] ^ atu8_keystream[ib_keystream++];
	}

	return atu8_out;
};
