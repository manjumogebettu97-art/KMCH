import { mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'build/pages');
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
await mkdir(path.join(output, 'api'), { recursive: true });
const files = ['index.html', 'styles.css', 'script.js', 'assets/kmch-logo.png', 'assets/robotic-surgery.webp', 'assets/fonts.css', ...Array.from({ length: 7 }, (_, i) => `assets/font-${i}.ttf`)];
await Promise.all(files.map(file => copyFile(path.join(root, file), path.join(output, file))));
await writeFile(path.join(output, '.nojekyll'), '');
// Copy the public endpoint only; the browser checks receiver readiness before enabling submission.
await copyFile(path.join(root, 'api/config'), path.join(output, 'api/config'));
console.log('GitHub Pages preview built in build/pages (no credentials or server source).');
