/* eslint-disable prefer-const */
import {XG_8, bytes} from '@blake.regalia/belt';

import {XN_16} from './constants.js';


const XG_PRIME_1305 = (2n ** 130n) - 5n;

/**
 * CAUTION: `atu8_key` and `atu8_msg` MUST be Uint8Arrays at byteOffset 0 within their respective ArrayBuffers
 * @param atu8_key 
 * @param atu8_msg 
 */
export const poly1305 = (atu8_key: Uint8Array, atu8_msg: Uint8Array): Uint8Array => {
	// working variables
	let i_each = 0;
	let xg_shift = -XG_8;

	// r and s
	let xg_r = 0n;
	let xg_s = 0n;

	// # accumulator = 0
	let xg_acc = 0n;

	// message length
	let nb_msg = atu8_msg.length;

	// prep output tag
	let atu8_tag = bytes(XN_16);

	// read key bytes
	for(; i_each<XN_16; i_each++) {
		// # r = le_bytes_to_num(key[0..15])
		xg_r |= BigInt(atu8_key[i_each]) << (xg_shift += XG_8);

		// # s = le_bytes_to_num(key[16..31])
		xg_s |= BigInt(atu8_key[i_each + 16]) << xg_shift;
	}

	// # clamp(r)
	xg_r &= 0x0ffffffc0ffffffc0ffffffc0fffffffn;

	// # for i=1 upto ceil(msg length in bytes / 16)
	for(i_each=0; i_each<nb_msg; i_each+=XN_16) {
		// init new block
		let xg_block = 0n;

		// reset shifter
		xg_shift = -XG_8;

		// # n = le_bytes_to_num(msg[((i-1)*16)..(i*16)] | [0x01])
		for(let ib_off=i_each; ib_off<Math.min(i_each+XN_16, nb_msg); ib_off++) {
			xg_block |= BigInt(atu8_msg[ib_off] || 0) << (xg_shift += XG_8);
		}

		// set msb [0x01]
		xg_block |= 1n << (xg_shift + XG_8);

		// # a = (r * a) % p
		xg_acc = (xg_r * (xg_acc + xg_block)) % XG_PRIME_1305;
	}

	// # a += s
	xg_acc += xg_s;

	// # num_to_16_le_bytes(a)
	for(i_each=0; i_each<XN_16; i_each++) {
		atu8_tag[i_each] = Number(xg_acc & 0xffn);
		xg_acc >>= XG_8;
	}

	return atu8_tag;
};
