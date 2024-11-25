import {ATU8_NIL, bytes} from '@blake.regalia/belt';

import {XN_16} from './constants.js';

export const NB_AES_BLOCK = XN_16;

// zero block
const ATU8_ZERO_BLOCK = /*#__PURE__*/bytes(XN_16);

// import aes key
export const aes_key = (atu8_key: Uint8Array, si_algo: string): Promise<CryptoKey> => crypto.subtle.importKey('raw', atu8_key, si_algo, false, ['encrypt']);

// perform AES-CBC
export const aes_cbc = async(d_key_cbc: CryptoKey, atu8_data: Uint8Array): Promise<Uint8Array> => bytes(await crypto.subtle.encrypt({
	name: 'AES-CBC',
	iv: ATU8_ZERO_BLOCK.slice(),
}, d_key_cbc, atu8_data), 0, NB_AES_BLOCK);

// perform AES-CTR
export const aes_ctr = async(d_key_ctr: CryptoKey, atu8_iv: Uint8Array, atu8_data: Uint8Array): Promise<Uint8Array> => bytes(await crypto.subtle.encrypt({
	name: 'AES-CTR',
	counter: atu8_iv,
	length: 128,  // use all available bits in the counter
}, d_key_ctr, atu8_data));

// pseudo-constant-time select
const select = (xb_value: number, xb_rif1: number, xb_rif0: number) => (~(xb_value - 1) & xb_rif1) | ((xb_value - 1) & xb_rif0);

// double block value in-placce
const double_block = (atu8_block: Uint8Array) => {
	let xb_carry = 0;

	for(let ib_each=NB_AES_BLOCK-1; ib_each>=0; ib_each--) {
		const xb_tmp = (atu8_block[ib_each] >>> 7) & 0xff;
		atu8_block[ib_each] = (atu8_block[ib_each] << 1) | xb_carry;
		xb_carry = xb_tmp;
	}

	atu8_block[NB_AES_BLOCK - 1] ^= select(xb_carry, 0x87, 0);
	xb_carry = 0;
};

// XOR two byte streams, replacing 'a' in-place and up to len(b)
const xor_bytes_in_place = (atu8_a: Uint8Array, atu8_b: Uint8Array) => {
	for(let ib_each=0; ib_each<atu8_b.length; ib_each++) {
		atu8_a[ib_each] ^= atu8_b[ib_each];
	}
};

// creates CMAC instance
export const aes_cmac_init = async(d_key_mac: CryptoKey): Promise<(atu8_data: Uint8Array) => Promise<Uint8Array>> => {
	// k1 subkey generation
	const atu8_k1 = await aes_cbc(d_key_mac, ATU8_ZERO_BLOCK);
	double_block(atu8_k1);

	// k2 subkey generation
	const atu8_k2 = atu8_k1.slice();
	double_block(atu8_k2);

	// return CMAC function
	return async(atu8_data: Uint8Array): Promise<Uint8Array> => {
		// cache data byte count
		const nb_data = atu8_data.byteLength;

		// number of blocks needed
		const nl_blocks = Math.ceil(nb_data / NB_AES_BLOCK);

		// last block
		const atu8_last = bytes(NB_AES_BLOCK);
		atu8_last.set(atu8_data.subarray(((nl_blocks || 1) - 1) * NB_AES_BLOCK));

		// cache size of last block
		const nb_last = nb_data % NB_AES_BLOCK;

		// last block requires padding
		if(nb_last || !nl_blocks) {
			// M_last := {ANS} XOR K2
			xor_bytes_in_place(atu8_last, atu8_k2);

			// padding(M_n)
			atu8_last[nb_last] ^= 0x80;
		}
		// no padding needed; xor with k1
		else {
			// M_last := M_n XOR K1
			xor_bytes_in_place(atu8_last, atu8_k1);
		}

		// X := const_Zero
		let atu8_block = ATU8_ZERO_BLOCK.slice();

		// for i := 1 to n-1
		for(let i_block=0; i_block<nl_blocks-1; i_block++) {
			// Y := X XOR M_i
			xor_bytes_in_place(atu8_block, atu8_data.subarray(i_block * NB_AES_BLOCK));

			// X := AES-128(K,Y)
			atu8_block = await aes_cbc(d_key_mac, atu8_block);
		}

		// Y := M_last XOR X
		xor_bytes_in_place(atu8_block, atu8_last);

		// T := AES-128(K,Y)
		return await aes_cbc(d_key_mac, atu8_block);
	};
};

// performs S2V operation
export const s2v = async(d_key_rkd: CryptoKey, atu8_plaintext: Uint8Array, a_ad=[ATU8_NIL]): Promise<Uint8Array> => {
	const f_cmac = await aes_cmac_init(d_key_rkd);

	// D = AES-CMAC(K, <zero>)
	let atu8_cmac = await f_cmac(ATU8_ZERO_BLOCK);

	// for i = 1 to n-1
	for(const atu8_ad of a_ad) {
		// dbl(D)
		double_block(atu8_cmac);

		// D = {ANS} xor AES-CMAC(K, Si)
		xor_bytes_in_place(atu8_cmac, await f_cmac(atu8_ad));
	}

	// cache plaintext byte count
	const nb_plaintext = atu8_plaintext.byteLength;

	// last block of plaintext
	const atu8_sn = bytes(NB_AES_BLOCK);

	// if len(Sn) >= 128
	if(nb_plaintext >= NB_AES_BLOCK) {
		// Sn_end xor D
		atu8_sn.set(atu8_plaintext.subarray(nb_plaintext - NB_AES_BLOCK));
		xor_bytes_in_place(atu8_sn, atu8_cmac);

		// T = Sn xorend D
		atu8_cmac = atu8_plaintext.slice();
		atu8_cmac.set(atu8_sn, nb_plaintext - NB_AES_BLOCK);
	}
	else {
		// dbl(D)
		double_block(atu8_cmac);

		// pad(Sn)
		atu8_sn.set(atu8_plaintext);
		atu8_sn[nb_plaintext] = 0x80;

		// T = dbl(D) xor pad(Sn)
		xor_bytes_in_place(atu8_cmac, atu8_sn);
	}

	// V = AES-CMAC(K, T)
	return await f_cmac(atu8_cmac);
};
