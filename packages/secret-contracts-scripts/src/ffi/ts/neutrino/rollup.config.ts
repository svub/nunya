import {microWeb} from '@nfps.dev/rollup-plugin-microweb';
import commonjs from '@rollup/plugin-commonjs';
import {defineConfig} from 'rollup';
import ignore from 'rollup-plugin-ignore';

export default defineConfig({
	input: 'src/main.ts',
	output: {
		dir: 'dist/nil',
		format: 'esm',
		entryFileNames: '[name].mjs',
		sourcemap: true,
	},
	external: [
		'@solar-republic/aes-128-siv-jss',
		'@blake.regalia/belt',
	],
	plugins: [
		commonjs(),

		ignore(['crypto']),

		microWeb(),
	],
});
