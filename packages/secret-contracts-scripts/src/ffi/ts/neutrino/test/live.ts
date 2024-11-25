import type {Dict} from '@blake.regalia/belt';

import type {SecretAccAddr, Snip24} from '@solar-republic/contractor';

import type {TrustedContextUrl} from '@solar-republic/types';

import {text_to_bytes} from '@blake.regalia/belt';

import './helper';

import {queryCosmosBankSpendableBalances} from '@solar-republic/cosmos-grpc/cosmos/bank/v1beta1/query';
import {queryCosmosFeegrantAllowances} from '@solar-republic/cosmos-grpc/cosmos/feegrant/v1beta1/query';

import {exec_secret_contract, retry, sign_secret_query_permit} from '../src/app-layer';
import {ent_to_sk} from '../src/secp256k1';
import {SecretContract} from '../src/secret-contract';
import {random_32} from '../src/util';
import {Wallet} from '../src/wallet';


const h_env = process.env;

const SI_CHAIN = h_env['NFP_CHAIN']!;

const P_LCD_ENDPOINT = h_env['NFP_LCD'] as TrustedContextUrl;

const P_RPC_ENDPOINT = h_env['NFP_RPC'] as TrustedContextUrl;

const SA_CONTRACT = h_env['NFP_CONTRACT'] as SecretAccAddr;

const SA_GRANTER = h_env['NFP_GRANTER'] as SecretAccAddr | undefined;



export async function connect() {
	// create seed for query/execution session (all zeros here)
	const atu8_seed = random_32();

	// create private key from entropy
	const atu8_ent = new Uint8Array(await crypto.subtle.digest('SHA-384', text_to_bytes('nfp-test-account:0')));
	const atu8_sk = ent_to_sk(atu8_ent.subarray(0, 40));

	// instantiate wallet
	const k_wallet = await Wallet<'secret'>(atu8_sk, SI_CHAIN, P_LCD_ENDPOINT, P_RPC_ENDPOINT);

	console.log(`Wallet account: ${k_wallet.addr}`);

	// account balance
	{
		console.log('Spendable balance: ', ...await queryCosmosBankSpendableBalances(P_LCD_ENDPOINT, k_wallet.addr));
	}


	// prepare to interact with contract
	const k_contract = await SecretContract<Snip24>(P_LCD_ENDPOINT, SA_CONTRACT, atu8_seed);

	// find feegrants
	const a_allowances = await queryCosmosFeegrantAllowances(P_LCD_ENDPOINT, k_wallet.addr);

	let sa_granter: SecretAccAddr | '' = '';
	for(const g_allowance of a_allowances) {
		sa_granter = g_allowance.granter;

		console.log('Found feegrant from: ', sa_granter, ' for ', g_allowance.allowance);
	}

	// sign a query permit
	const g_permit = await sign_secret_query_permit(k_wallet, 'test', [k_contract.addr], ['balance', 'owner']);


	// define executables
	const g_executables = {
		// set a viewing key
		async viewing_key() {
			const a_response = await retry(() => exec_secret_contract(k_contract, k_wallet, {
				set_viewing_key: {
					key: 'password123',
				},
			}, [['2500', 'uscrt']], '50000', sa_granter), (z_exec, c_attempts) => {
				// retry-able
				if(((z_exec as Dict)?.['message'] || '').includes('timed out')) {
					if(c_attempts < 5) {
						return [6e3];
					}
				}
			});

			console.log('Set viewing key execution response: ', ...a_response);
		},
	};

	return {
		k_wallet,
		k_contract,
		sa_granter,
		g_permit,
		g_executables,
		atu8_sk,
	};
}
