import base from './base.js';

/** ESLint config for React libraries (packages/ui). */
export default [
  ...base,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
