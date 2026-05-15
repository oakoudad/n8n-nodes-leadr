/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	rootDir: '.',
	testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	collectCoverageFrom: ['nodes/**/*.ts', '!nodes/**/*.d.ts'],
	transform: {
		'^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
	},
};
