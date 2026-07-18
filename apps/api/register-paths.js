/* Maps the "@/..." TypeScript path alias onto the compiled output at runtime.
   Used by `npm run dev` and `npm run start` (see package.json scripts). */
const path = require('path');
const tsConfigPaths = require('tsconfig-paths');

tsConfigPaths.register({
  baseUrl: path.join(__dirname, 'dist'),
  paths: { '@/*': ['*'] },
});
