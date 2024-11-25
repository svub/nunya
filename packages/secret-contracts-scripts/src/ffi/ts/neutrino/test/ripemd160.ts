import {hex_to_bytes, text_to_bytes} from '@blake.regalia/belt';

import * as chai from 'chai';
const {expect} = chai;
import chai_bites from 'chai-bites';
chai.use(chai_bites);

import {describe} from './helper';

import {ripemd160} from '../src/ripemd160';

const A_VECTORS = [
	{
		message: 'thequickbrownfoxjumpedoverthelazydogthequickbrownfoxjumpedoverthelazydog',
		digest: 'bacb2043ae0042817e63bd330a6048241620fded',
	},
	{
		message: '',
		digest: '9c1185a5c5e9fc54612808977ee8f548b2258d31',
	},
	{
		message: 'a',
		digest: '0bdc9d2d256b3ee9daae347be6f4dc835a467ffe',
	},
	{
		message: 'abc',
		digest: '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc',
	},
	{
		message: 'message digest',
		digest: '5d0689ef49d2fae572b881b123a85ffa21595f36',
	},
	{
		message: 'abcdefghijklmnopqrstuvwxyz',
		digest: 'f71c27109c692c1b56bbdceb5b9d2865b3708dbc',
	},
	{
		message: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
		digest: '12a053384a9c0c88e405a06c27dcf49ada62eb2b',
	},
	{
		message: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		digest: 'b0e20b6e3116640286ed3a87a5713079b21f5189',
	},
	{
		message: '1234567890'.repeat(8),
		digest: '9b752e45573d4b39f4dbd3323cab82bf63326bfb',
	},
	{
		message: 'a'.repeat(1e6),
		digest: '52783243c1697bdbe16d37f97f68f08325dc1528',
	},
];

A_VECTORS.forEach((g_vector, i_vector) => {
	void describe(`Vector #${i_vector+1}`, ({it}) => {
		void it('digest', () => {
			const atu8_digest = ripemd160(text_to_bytes(g_vector.message));

			expect(atu8_digest).to.equalBytes(hex_to_bytes(g_vector.digest));
		});
	});
});
