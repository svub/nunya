import type {Nilable} from '@blake.regalia/belt';

import {SI_HASH_ALGORITHM_SHA256, biguint_to_bytes_be, bytes, bytes_to_biguint_be, concat2, die, hmac, is_bigint} from '@blake.regalia/belt';

import {random_32} from './util.js';

const XG_2_POW_256 = 2n ** 256n;

const XG_FIELD_PRIME = XG_2_POW_256 - 0x1000003d1n;

const XG_CURVE_ORDER = XG_2_POW_256 - 0x14551231950b75fc4402da1732fc9bebfn;

const NB_FIELD = 32;


const crv = (xg_x: bigint) => mod((mod(xg_x * xg_x) * xg_x) + 7n);

const is_field_element = (xg_value: bigint) => xg_value > 0n && xg_value < XG_FIELD_PRIME;

const is_group_element = (xg_value: bigint) => xg_value > 0n && xg_value < XG_CURVE_ORDER;

const exceeds_half_order = (xg_n: bigint): boolean => xg_n > (XG_CURVE_ORDER >> 1n);

const extract_bigint_from_buffer = (atu8: Uint8Array, ib_lo: number, ib_hi: number): bigint => bytes_to_biguint_be(atu8.subarray(ib_lo, ib_hi));

const mod = (xg_value: bigint, xg_mod=XG_FIELD_PRIME): bigint => {
	const xg_result = xg_value % xg_mod;
	return xg_result >= 0n? xg_result: xg_mod + xg_result;
};

const sqrt = (xg_n: bigint) => {
	let xg_r = 1n;

	for(let xg_value=xg_n, xg_e=(XG_FIELD_PRIME + 1n) / 4n; xg_e>0n; xg_e>>=1n) {
		if(xg_e & 1n) xg_r = (xg_r * xg_value) % XG_FIELD_PRIME;

		xg_value = (xg_value * xg_value) % XG_FIELD_PRIME;
	}

	return mod(xg_r * xg_r) === xg_n? xg_r: die('Invalid sqrt');
};

type AffinePoint = [
	x: bigint,
	y: bigint,
];

interface EcPoint {
	a: [xg_x: bigint, xg_y: bigint, xg_z: bigint];
	eq(k_other: EcPoint): boolean;
	ng(): EcPoint;
	add(k_other: EcPoint): EcPoint;
	mul(xg_n: bigint, xc_safe?: boolean | 0 | 1): EcPoint;
	aff(): AffinePoint;
	ok(this: EcPoint): this;
	out(this: EcPoint, xc_uncompressed: boolean | 0 | 1): Uint8Array;
}

// const ec_point_eq = (k_a: EcPoint, k_b: EcPoint) => {
// 	const [xg_x, xg_y, xg_z] = k_a.a;
// 	const [xg_x2, xg_y2, xg_z2] = k_b.a;

// 	return mod(xg_x * xg_z2) === mod(xg_x2 * xg_z) && mod(xg_y * xg_z2) === mod(xg_y2 * xg_z);
// };

const ec_point = ([xg_x, xg_y, xg_z]: [xg_x: bigint, xg_y: bigint, xg_z: bigint]): EcPoint => ({
	a: [xg_x, xg_y, xg_z],

	eq(k_other: EcPoint): boolean {
		const [xg_x2, xg_y2, xg_z2] = k_other.a;

		return mod(xg_x * xg_z2) === mod(xg_x2 * xg_z) && mod(xg_y * xg_z2) === mod(xg_y2 * xg_z);
	},

	ng: (): EcPoint => ec_point([xg_x, mod(-xg_y), xg_z]),

	add(k_other: EcPoint): EcPoint {
		const [xg_x2, xg_y2, xg_z2] = k_other.a;

		let xg_t0 = mod(xg_x * xg_x2);
		let xg_t1 = mod(xg_y * xg_y2);
		const xg_t2 = mod(xg_z * xg_z2);
		let xg_t3 = mod(xg_x + xg_y);
		let xg_t4 = mod(xg_x2 + xg_y2);
		let xg_t5 = mod(xg_x2 + xg_z2);

		xg_t3 = mod(xg_t3 * xg_t4);
		xg_t4 = mod(xg_t0 + xg_t1);
		xg_t3 = mod(xg_t3 - xg_t4);
		xg_t4 = mod(xg_x + xg_z);

		xg_t4 = mod(xg_t4 * xg_t5);
		xg_t5 = mod(xg_t0 + xg_t2);
		xg_t4 = mod(xg_t4 - xg_t5);
		xg_t5 = mod(xg_y + xg_z);

		let xg_x3 = mod(xg_y2 + xg_z2);
		let xg_y3: bigint;
		let xg_z3: bigint;
		xg_t5 = mod(xg_t5 * xg_x3);
		xg_x3 = mod(xg_t1 + xg_t2);
		xg_t5 = mod(xg_t5 - xg_x3);

		xg_x3 = mod(21n * xg_t2);
		xg_z3 = xg_x3;
		xg_x3 = mod(xg_t1 - xg_x3);
		xg_z3 = mod(xg_t1 + xg_z3);
		xg_y3 = mod(xg_x3 * xg_z3);

		xg_t1 = mod(xg_t0 + xg_t0);
		xg_t1 = mod(xg_t1 + xg_t0);
		xg_t4 = mod(21n * xg_t4);

		xg_t0 = mod(xg_t1 * xg_t4);
		xg_y3 = mod(xg_y3 + xg_t0);

		xg_t0 = mod(xg_t5 * xg_t4);
		xg_x3 = mod(xg_t3 * xg_x3);
		xg_x3 = mod(xg_x3 - xg_t0);
		xg_t0 = mod(xg_t3 * xg_t1);
		xg_z3 = mod(xg_t5 * xg_z3);

		xg_z3 = mod(xg_z3 + xg_t0);

		return ec_point([xg_x3, xg_y3, xg_z3]);
	},

	mul(xg_n: bigint, xc_safe=1): EcPoint {
		if(!xc_safe && 0n === xg_n) return KP_ZERO;

		if(!is_group_element(xg_n)) die('Invalid scalar');

		// if(this.eq(KP_BASE)) return pre_base_mul(xg_n).p;

		let kp_p = KP_ZERO;
		let kp_f = KP_BASE;

		for(let kp_d: EcPoint=this; xg_n>0n; kp_d=kp_d.add(kp_d), xg_n >>= 1n) {
			if(xg_n & 1n) {
				kp_p = kp_p.add(kp_d);
			}
			else if(xc_safe) {
				kp_f = kp_f.add(kp_d);
			}
		}

		return kp_p;
	},

	aff(): AffinePoint {
		if(this.eq(KP_ZERO)) return [0n, 0n];
		// if(ec_point_eq(this, KP_ZERO)) return [0n, 0n];

		if(1n === xg_z) return [xg_x, xg_y];

		const xg_iz = invert(xg_z);

		if(1n !== mod(xg_z * xg_iz)) die('Invalid inverse');

		return [mod(xg_x * xg_iz), mod(xg_y * xg_iz)];
	},

	ok(): EcPoint {
		const [xg_ax, xg_ay] = this.aff();

		if(!is_field_element(xg_ax) || !is_field_element(xg_ay)) die('Invalid point');

		return mod(xg_ay * xg_ay) === crv(xg_ax)? this: die('Invalid point');
	},

	out(xc_uncompressed: boolean | 0 | 1): Uint8Array {
		const [xg_ax, xg_ay] = this.aff();

		const atu8_out = bytes(1 + (((xc_uncompressed as number) + 1) * NB_FIELD));

		atu8_out[0] = xc_uncompressed? 0x04: 0n === (xg_ay & 1n) ? 0x02: 0x03;

		atu8_out.set(biguint_to_bytes_be(xg_ax), 1);
		if(xc_uncompressed) atu8_out.set(biguint_to_bytes_be(xg_ay), 1 + NB_FIELD);

		return atu8_out;
	},
});

const KP_ZERO = /*#__PURE__*/ec_point([0n, 1n, 0n]);

const KP_BASE = /*#__PURE__*/ec_point([
	0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
	0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
	1n,
]);

const import_ec_point = (atu8_data: Uint8Array): EcPoint => {
	let yp_new: EcPoint | undefined;

	const xb_head = atu8_data[0];
	const atu8_tail = atu8_data.subarray(1);

	const xg_x = extract_bigint_from_buffer(atu8_tail, 0, NB_FIELD);
	const nb_data = atu8_data.length;

	if(33 === nb_data && [0x02, 0x03].includes(xb_head)) {
		if(!is_field_element(xg_x)) die('Invalid point');

		let xg_y = sqrt(crv(xg_x));

		const b_y_odd = 1n === (xg_y & 1n);

		const b_head_odd = 1 === (xb_head & 1);

		if(b_head_odd !== b_y_odd) xg_y = mod(-xg_y);

		yp_new = ec_point([xg_x, xg_y, 1n]);
	}
	else if(65 === nb_data && 0x04 === xb_head) {
		yp_new = ec_point([xg_x, extract_bigint_from_buffer(atu8_tail, NB_FIELD, 2 * NB_FIELD), 1n]);
	}

	if(!yp_new) return die('Invalid point data');

	return yp_new.ok();
};

const invert = (xg_value: bigint, xg_md=XG_FIELD_PRIME): bigint => {
	if(0n === xg_value || xg_md <= 0n) die('No inverse');

	let xg_a = mod(xg_value, xg_md);
	let xg_b = xg_md;
	let xg_x = 0n;
	let xg_y = 1n;
	let xg_u = 1n;
	let xg_v = 0n;

	while(0n !== xg_a) {
		const xg_q = xg_b / xg_a;
		const xg_r = xg_b % xg_a;
		const xg_m = xg_x - (xg_u * xg_q);
		const xg_n = xg_y - (xg_v * xg_q);

		xg_b = xg_a;
		xg_a = xg_r;
		xg_x = xg_u;
		xg_y = xg_v;
		xg_u = xg_m;
		xg_v = xg_n;
	}

	return 1n === xg_b? mod(xg_x, xg_md): die('No inverse');
};

const normalize_sk = (z_sk: Uint8Array | bigint): bigint => {
	if(!is_bigint(z_sk)) z_sk = bytes_to_biguint_be(z_sk);

	return is_group_element(z_sk)? z_sk: die('Invalid private key');
};

export type RecoveryValue = 0 | 1 | 2 | 3;

export type SignatureAndRecovery = [
	atu8_signature: Uint8Array,
	xc_recovery: RecoveryValue,
];

const bitsequence_to_uint = (atu8_data: Uint8Array): bigint => {
	const n_delta = (atu8_data.length * 8) - 256;

	const xg_value = bytes_to_biguint_be(atu8_data);

	return n_delta > 0? xg_value >> BigInt(n_delta): xg_value;
};

type Predicate<T> = (v: Uint8Array) => T | undefined;

const hmac_drbg = async<T>(atu8_seed_root: Uint8Array, f_predicate: Predicate<T>): Promise<T> => {
	let atu8_b = bytes(NB_FIELD);

	let atu8_k = bytes(NB_FIELD);

	let i_attempts = 0;
	const f_reset = () => {
		atu8_b.fill(1);
		atu8_k.fill(0);
		i_attempts = 0;
	};


	const f_reseed = async(atu8_seed: Uint8Array) => {
		const atu8_expand_0 = bytes(1 + atu8_seed.length);
		atu8_expand_0.set(atu8_seed, 1);
		atu8_k = await hmac_sha256(atu8_k, concat2(atu8_b, atu8_expand_0));

		atu8_b = await hmac_sha256(atu8_k, atu8_b);
		if(0 === atu8_seed.length) return;

		const atu8_expand_1 = bytes(1 + atu8_seed.length);
		atu8_expand_1.set(atu8_seed, 1);
		atu8_expand_1[0] = 0x01;
		atu8_expand_1.set(atu8_seed, 1);
		atu8_k = await hmac_sha256(atu8_k, concat2(atu8_b, atu8_expand_1));

		atu8_b = await hmac_sha256(atu8_k, atu8_b);
	};

	const f_gen: () => Promise<Uint8Array> = async() => {
		if(i_attempts++ >= 1000) die('Made 1k attempts');

		atu8_b = await hmac_sha256(atu8_k, atu8_b);
		return atu8_b;
	};

	f_reset();

	await f_reseed(atu8_seed_root);

	let res: T | undefined;
	while(!(res = f_predicate(await f_gen()))) {
		await f_reseed(bytes(0));
	}

	f_reset();

	return res;
};


export const gen_sk = (): Uint8Array => ent_to_sk(crypto.getRandomValues(bytes(NB_FIELD + 8)));

export const ent_to_sk = (atu8_entropy: Uint8Array): Uint8Array => atu8_entropy.length < NB_FIELD + 8 || atu8_entropy.length > 1024
	? die('Invalid entropy')
	: biguint_to_bytes_be(mod(bytes_to_biguint_be(atu8_entropy), XG_CURVE_ORDER - 1n) + 1n);

export const sk_to_pk = (z_sk: Uint8Array | bigint, xc_uncompressed: boolean | 0 | 1=0 as const): Uint8Array => KP_BASE.mul(normalize_sk(z_sk)).out(xc_uncompressed);

export const ecdh = (atu8_sk: Uint8Array, atu8_pk: Uint8Array, b_uncompressed?: boolean): Uint8Array => import_ec_point(atu8_pk).mul(normalize_sk(atu8_sk)).out(b_uncompressed || 0);


export type Signature = [xg_r: bigint, xg_s: bigint];

export const sign = async(atu8_sk: Uint8Array, atu8_hash: Uint8Array, atu8_ent?: Nilable<Uint8Array>): Promise<SignatureAndRecovery> => {
	const xg_h1i = mod(bitsequence_to_uint(atu8_hash), XG_CURVE_ORDER);

	const atu8_h1o = biguint_to_bytes_be(xg_h1i);

	const xg_d = normalize_sk(atu8_sk);

	const atu8_seed = concat2(biguint_to_bytes_be(xg_d), concat2(atu8_h1o, atu8_ent || random_32()));

	return hmac_drbg<SignatureAndRecovery>(atu8_seed, (atu8_k: Uint8Array): SignatureAndRecovery | undefined => {
		const xg_k = bitsequence_to_uint(atu8_k);

		if(!is_group_element(xg_k)) return;

		const xg_k_inverse = invert(xg_k, XG_CURVE_ORDER);

		const a_q = KP_BASE.mul(xg_k).aff();

		const xg_r = mod(a_q[0], XG_CURVE_ORDER);

		if(0n === xg_r) return;

		const xg_s = mod(xg_k_inverse * mod(xg_h1i + mod(xg_d * xg_r, XG_CURVE_ORDER), XG_CURVE_ORDER), XG_CURVE_ORDER);

		if(0n === xg_s) return;

		let xg_s_normalized = xg_s;

		let xc_recovery = ((a_q[0] === xg_r ? 0 : 2) | Number(a_q[1] & 1n)) as RecoveryValue;

		if(exceeds_half_order(xg_s)) {
			xg_s_normalized = mod(-xg_s, XG_CURVE_ORDER);
			xc_recovery ^= 1;
		}

		const atu8_out = bytes(2 * NB_FIELD);
		atu8_out.set(biguint_to_bytes_be(xg_r));
		atu8_out.set(biguint_to_bytes_be(xg_s_normalized), NB_FIELD);

		return [atu8_out, xc_recovery as RecoveryValue];
	});
};


export const verify = (atu8_signature: Uint8Array, atu8_hash: Uint8Array, atu8_pk: Uint8Array, b_low_s=true): boolean => {
	if(2 * NB_FIELD !== atu8_signature.length) die('Invalid signature');

	let xg_r: bigint;
	let xg_s: bigint;
	let xg_h: bigint;
	let kp_p: EcPoint;

	try {
		xg_r = extract_bigint_from_buffer(atu8_signature, 0, NB_FIELD);
		xg_s = extract_bigint_from_buffer(atu8_signature, NB_FIELD, 2 * NB_FIELD);

		if(!is_group_element(xg_r) || !is_group_element(xg_s)) return false;

		xg_h = mod(bitsequence_to_uint(atu8_hash), XG_CURVE_ORDER);

		kp_p = import_ec_point(atu8_pk);
	}
	catch(e) {
		return false;
	}

	// signature is not in low-S
	if(b_low_s && exceeds_half_order(xg_s)) return false;

	let a_aff_r: AffinePoint;
	try {
		const xg_s_inverse = invert(xg_s, XG_CURVE_ORDER);

		const xg_u1 = mod(xg_h * xg_s_inverse, XG_CURVE_ORDER);

		const xg_u2 = mod(xg_r * xg_s_inverse, XG_CURVE_ORDER);

		a_aff_r = KP_BASE.mul(xg_u1, false).add(kp_p.mul(xg_u2, false)).ok().aff();
	}
	catch(error) {
		return false;
	}

	if(!a_aff_r) return false;

	return mod(a_aff_r[0], XG_CURVE_ORDER) === xg_r;
};

const hmac_sha256 = (atu8_key: Uint8Array, atu8_data: Uint8Array) => hmac(atu8_key, atu8_data, SI_HASH_ALGORITHM_SHA256);


// let A_PRECOMPUTED: EcPoint[] | undefined;

// const pre_base_mul = (xg_n: bigint): {p: EcPoint; f: EcPoint} => {
// 	let a_points_pre = A_PRECOMPUTED || (A_PRECOMPUTED = (() => {
// 		let a_points: EcPoint[] = [];

// 		let kp_p = KP_BASE;
// 		let kp_b = kp_p;

// 		for(let i_window=0; i_window<33; i_window++) {
// 			kp_b = kp_p;

// 			a_points.push(kp_b);
// 			for(let i_repeat=1; i_repeat<128; i_repeat++) {
// 				kp_b = kp_b.add(kp_p);
// 				a_points.push(kp_b);
// 			}

// 			kp_p = kp_b.add(kp_b);
// 		}

// 		return a_points;
// 	})());

// 	let constant_time_negate = (b_condition: boolean, kp_subject: EcPoint) => {
// 		const kp_negated = kp_subject.negate();
// 		return [kp_subject, kp_negated][+b_condition];
// 	};

// 	let kp_p = KP_ZERO;
// 	let kp_f = KP_BASE;

// 	for(let i_window=0; i_window<33; i_window++) {
// 		const off = i_window * 128;

// 		let wbits = Number(xg_n & 255n);

// 		xg_n >>= 8n;

// 		if(wbits > 128) {
// 			wbits -= 256;
// 			xg_n += 1n;
// 		}

// 		let off1 = off;
// 		let off2 = off + Math.abs(wbits) - 1;

// 		let cnd1 = i_window % 2 !== 0;
// 		let cnd2 = wbits < 0;
// 		if(0 === wbits) {
// 			kp_f = kp_f.add(constant_time_negate(cnd1, a_points_pre[off1]));
// 		}
// 		else {
// 			kp_p = kp_p.add(constant_time_negate(cnd2, a_points_pre[off2]));
// 		}
// 	}

// 	return {p:kp_p, f:kp_f};
// };
