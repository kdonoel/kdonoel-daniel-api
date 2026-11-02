// @ts-check
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default defineConfig(
	globalIgnores(['dist/']),
	{
		files: ['**/*.ts'],
		extends: [eslint.configs.recommended, tseslint.configs.recommendedTypeChecked],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		rules: {
			// The code base relies on `any` for loosely typed payloads
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',

			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{
					allowTypedFunctionExpressions: true,
					allowHigherOrderFunctions: true,
					allowDirectConstAssertionInArrowFunctions: true,
				},
			],
			'@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
			'@typescript-eslint/no-shadow': 'error',
			'@typescript-eslint/restrict-template-expressions': 'off',
			'@typescript-eslint/unbound-method': 'off',

			'no-console': 'error',
			'object-shorthand': ['error', 'always'],
			'radix': ['error', 'always'],
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
		},
	},
	eslintPluginPrettierRecommended,
);
