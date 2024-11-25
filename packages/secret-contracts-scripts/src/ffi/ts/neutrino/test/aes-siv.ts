
import {hex_to_bytes} from '@blake.regalia/belt';
import * as chai from 'chai';
const {expect} = chai;
import chai_bites from 'chai-bites';

import {describe} from './helper';

import {aes_128_siv_encrypt, aes_128_siv_decrypt} from '../src/aes-128-siv';

chai.use(chai_bites);

const A_VECTORS = [
	{
		name: 'Deterministic Authenticated Encryption Example',
		key: 'fffefdfcfbfaf9f8f7f6f5f4f3f2f1f0f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff',
		ad: [
			'101112131415161718191a1b1c1d1e1f2021222324252627',
		],
		plaintext: '112233445566778899aabbccddee',
		ciphertext: '85632d07c6e8f37f950acd320a2ecc9340c02b9690c4dc04daef7f6afe5c',
	},
	{
		name: 'Nonce-Based Authenticated Encryption Example',
		key: '7f7e7d7c7b7a79787776757473727170404142434445464748494a4b4c4d4e4f',
		ad: [
			'00112233445566778899aabbccddeeffdeaddadadeaddadaffeeddccbbaa99887766554433221100',
			'102030405060708090a0',
			'09f911029d74e35bd84156c5635688c0',
		],
		plaintext: '7468697320697320736f6d6520706c61696e7465787420746f20656e6372797074207573696e67205349562d414553',
		ciphertext: '7bdb6e3b432667eb06f4d14bff2fbd0fcb900f2fddbe404326601965c889bf17dba77ceb094fa663b7a3f748ba8af829ea64ad544a272e9c485b62a3fd5c0d',
	},
	{
		name: 'Empty Authenticated Data And Plaintext Example',
		key: 'fffefdfcfbfaf9f8f7f6f5f4f3f2f1f0f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff',
		ad: [],
		plaintext: '',
		ciphertext: 'f2007a5beb2b8900c588a7adf599f172',
	},
	{
		name: 'Empty Authenticated Data And Block-Size Plaintext Example',
		key: 'fffefdfcfbfaf9f8f7f6f5f4f3f2f1f0f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff',
		ad: [],
		plaintext: '00112233445566778899aabbccddeeff',
		ciphertext: 'f304f912863e303d5b540e5057c7010c942ffaf45b0e5ca5fb9a56a5263bb065',
	},
];


for(const [i_vector, g_vector] of A_VECTORS.entries()) {
	await describe(`Vector #${i_vector+1}`, async({it}) => {
		const atu8_key = hex_to_bytes(g_vector.key);
		const atu8_plaintext_expect = hex_to_bytes(g_vector.plaintext);
		const atu8_ciphertext_expect = hex_to_bytes(g_vector.ciphertext);
		const a_ad = g_vector.ad.map(hex_to_bytes);

		await it('decryption', async() => {
			const atu8_plaintext_actual = await aes_128_siv_decrypt(atu8_key, atu8_ciphertext_expect, a_ad);

			expect(atu8_plaintext_actual).to.equalBytes(atu8_plaintext_expect);
		});

		await it('encryption', async() => {
			const atu8_ciphertext_actual = await aes_128_siv_encrypt(atu8_key, atu8_plaintext_expect, a_ad);

			expect(atu8_ciphertext_actual).to.equalBytes(atu8_ciphertext_expect);
		});
	});
}
