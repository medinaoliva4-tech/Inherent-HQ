// Dependencias fijadas por el probe A2; no añade React al arranque del OS.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(new URL('../probes/vision-libraries/package.json', import.meta.url));
const { build } = await import(pathToFileURL(require.resolve('vite')).href);
await build({ configFile: new URL('../probes/vision-libraries/flow.config.mjs', import.meta.url).pathname });
