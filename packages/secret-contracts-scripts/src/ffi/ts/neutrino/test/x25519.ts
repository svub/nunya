import {
	hex_to_bytes,
	base64_to_bytes,
} from '@blake.regalia/belt';

import * as chai from 'chai';
const {expect} = chai;

import chai_bites from 'chai-bites';
import {
	sharedKey,
} from 'curve25519-js';

import {describe} from './helper';

import {
	ecs_mul,
} from '../src/x25519';


chai.use(chai_bites);

const A_VECTORS = [
	{
		sk: hex_to_bytes('a665a45920422f9d417e4867ef'.padStart(64, '0')),
		iopk: base64_to_bytes('79++5YOHfm0SwhlpUDClv7cuCjq9xBZlWqSjDJWkRG8='),
	},
];

for(const [i_vector, g_vector] of A_VECTORS.entries()) {
	void describe(`Vector #${i_vector + 1}`, ({it}) => {
		void it('shared key', () => {
			const atu8_x25519_actual = ecs_mul(g_vector.sk, g_vector.iopk);
			const atu8_x25519_expect = sharedKey(g_vector.sk, g_vector.iopk);

			expect(atu8_x25519_actual).to.equalBytes(atu8_x25519_expect);
		});
	});
}
