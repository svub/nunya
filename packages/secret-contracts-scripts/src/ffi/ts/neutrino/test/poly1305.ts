import {hex_to_bytes, text_to_bytes} from '@blake.regalia/belt';
import * as chai from 'chai';
const {expect} = chai;
import chai_bites from 'chai-bites';

import {describe} from './helper';
import {poly1305} from '../src/poly1305';

chai.use(chai_bites);

const A_TEST_VECTORS = [
	{
		key: '85d6be7857556d337f4452fe42d506a80103808afb0db2fd4abff6af4149f51b',
		message: 'Cryptographic Forum Research Group',
		tag: 'a8061dc1305136c6c22b8baf0c0127a9',
	},
];

for(const [i_vector, g_vector] of A_TEST_VECTORS.entries()) {
	void describe(`Vector #${i_vector+1}`, ({it}) => {
		void it('tag', () => {
			const atu8_key = hex_to_bytes(g_vector.key);
			const atu8_msg = text_to_bytes(g_vector.message);
			const atu8_tag_actual = poly1305(atu8_key, atu8_msg);
			const atu8_tag_expect = hex_to_bytes(g_vector.tag);

			expect(atu8_tag_actual).to.equalBytes(atu8_tag_expect);
		});
	});
}
