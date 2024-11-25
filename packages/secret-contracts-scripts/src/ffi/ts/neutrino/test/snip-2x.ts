import {connect} from './live';
import {query_secret_contract_raw, query_secret_contract} from '../src/app-layer';
import './helper';


(async function() {
	const {
		k_wallet,
		k_contract,
		sa_granter,
		g_permit,
		g_executables,
	} = await connect();

		// query for token info
	{
		const a_response = await query_secret_contract_raw(k_contract, {
			token_info: {},
		});

		console.log('Token info query response: ', ...a_response);
	}

		// check that query permit works
	{
		const a_response = await query_secret_contract(k_contract, 'balance', {}, g_permit);

		console.log(`Authenticated token balance query response with permit: `, ...a_response);
	}
})();
