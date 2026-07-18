import base from './base.js';

/** ESLint config for NestJS services (decorator-heavy code). */
export default [
  ...base,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
