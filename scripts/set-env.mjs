/**
 * Injects BACKEND_URL from the environment into environment.prod.ts before building.
 * Used by Cloudflare Pages build pipeline:
 *   Build command: node scripts/set-env.mjs && pnpm build --configuration production
 *   Environment variable: BACKEND_URL=https://api-xxx.railway.app
 */
import { writeFileSync } from 'fs';

const backendUrl = process.env.BACKEND_URL ?? '';
const apiUrl = backendUrl ? `${backendUrl}/v1` : '/v1';

writeFileSync(
  'src/environments/environment.prod.ts',
  `export const environment = {\n  production: true,\n  apiUrl: '${apiUrl}',\n};\n`,
);

console.log(`[set-env] apiUrl → ${apiUrl}`);
