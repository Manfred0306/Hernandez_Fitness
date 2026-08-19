import { mkdir, cp } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'dist');
const publicDir = path.join(root, 'public');

await mkdir(outDir, { recursive: true });
await cp(publicDir, path.join(outDir, 'public'), { recursive: true });

console.log('Build complete: public assets copied to dist/public');
