import type {CreateQueryArgsAndAuthParams} from '../src/inferencing';
import type {Snip20, ContractInterface} from '@solar-republic/contractor';


{
	type g_interface = Snip20;
	type h_variants = ContractInterface.MsgAndAnswer<g_interface, 'queries'>;
	type si_method = Extract<keyof h_variants, 'balance'>;

	type T = CreateQueryArgsAndAuthParams<h_variants, si_method, 0>;

	type X = h_variants[si_method]['msg'];
	type x = InferQueryArgsAndAuthWithoutPermit<X>;
}
