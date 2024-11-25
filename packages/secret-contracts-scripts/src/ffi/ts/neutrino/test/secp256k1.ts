/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import {bytes_to_hex, hex_to_bytes, sha256, text_to_bytes} from '@blake.regalia/belt';

import {
	signAsync as noble_sign,
	verify as noble_verify,
	etc as noble_etc,
	getPublicKey as noble_sk_to_pk,
	getSharedSecret as noble_ecdh,
} from '@noble/secp256k1';

import * as chai from 'chai';
const {expect} = chai;

import chai_bites from 'chai-bites';
chai.use(chai_bites);

import {describe} from './helper';
import {
	gen_sk,
	ent_to_sk,
	sk_to_pk,
	ecdh,
	sign,
	verify,
} from '../src/secp256k1';
import {random_32} from '../src/util';


const A_VECTORS = [
	{
		sk: hex_to_bytes('ebb2c082fd7727890a28ac82f6bdf97bad8de9f5d7c9028692de1a255cad3e0f'),
		msg: await sha256(text_to_bytes('Test message')),
	},
	{
		sk: hex_to_bytes('0000000000000000000000000000000000000000000000000000000000000002'),
		msg: await sha256(text_to_bytes('Test message')),
	},
];


await Promise.all(A_VECTORS.map(async(g_vector, i_vector) => {
	await describe(`Vector #${i_vector+1}`, async({it}) => {
		const atu8_sk = g_vector.sk;
		const atu8_msg = g_vector.msg;

		const atu8_k = random_32();

		const atu8_pk_actual: Uint8Array = sk_to_pk(atu8_sk);

		const [atu8_sig_actual] = await sign(atu8_sk, atu8_msg, atu8_k);

		await it('public key', () => {
			const atu8_pk_expect = noble_sk_to_pk(atu8_sk);

			expect(atu8_pk_expect).to.equalBytes(atu8_pk_actual);
		});

		await it('signature', async() => {
			const g_signatuer = await noble_sign(atu8_msg, atu8_sk, {
				lowS: true,
				extraEntropy: atu8_k,
			});

			expect(atu8_sig_actual).to.equalBytes(g_signatuer.toCompactRawBytes());
		});

		await it('verify', async() => {
			expect(verify(atu8_sig_actual, atu8_msg, atu8_pk_actual)).to.be.true;
			expect(verify(atu8_sig_actual, new Uint8Array(32), atu8_pk_actual)).to.be.false;
		});

		await it('ecdh w/ 1', async() => {
			const atu8_sk_1 = hex_to_bytes('0'.repeat(63)+'1');
			const atu8_pk_1: Uint8Array = sk_to_pk(atu8_sk_1);

			const atu8_ecdh_actual: Uint8Array = ecdh(atu8_sk, atu8_pk_1);
			const atu8_ecdh_expect = noble_ecdh(atu8_sk, atu8_pk_1, true);

			const sb16_ecdh_actual = bytes_to_hex(atu8_ecdh_actual);
			const sb16_ecdh_expect = bytes_to_hex(atu8_ecdh_expect);

			expect(sb16_ecdh_actual).to.eq(sb16_ecdh_expect);
		});
	});
}));

await describe('util', async({it}) => {
	await it('ent_to_sk', () => {
		const atu8_ent = new Uint8Array(40);

		const atu8_sk_actual = ent_to_sk(atu8_ent);
		const atu8_sk_expect = noble_etc.hashToPrivateKey(atu8_ent);

		expect(atu8_sk_actual).to.equalBytes(atu8_sk_expect);
	});
});
