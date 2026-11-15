import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({ define: { 'process.env.NODE_ENV': '"production"' }, build: { outDir: path.resolve(dir, '../../public/vendor/vision-flow'), emptyOutDir: false, lib: { entry: path.join(dir, 'src/os-flow.jsx'), formats: ['es'], fileName: () => 'vision-flow.js', cssFileName: 'vision-flow' }, minify: true } });
