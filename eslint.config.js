const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    // Pastas que o lint do backend não deve analisar
    { ignores: ['node_modules', 'frontend', 'prisma.config.ts'] },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: { ...globals.node, ...globals.jest },
        },
        rules: {
            // Parâmetros começados por _ podem ficar sem uso (ex.: _next no middleware de erro)
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
];