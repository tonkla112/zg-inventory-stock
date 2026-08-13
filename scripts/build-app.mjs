import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const sourceFiles = [
  'src/icons.jsx',
  'src/components.jsx',
  'src/data.jsx',
  'src/pages/dashboard.jsx',
  'src/pages/items.jsx',
  'src/pages/stockin.jsx',
  'src/pages/stockout.jsx',
  'src/pages/customers.jsx',
  'src/pages/reports.jsx',
  'src/pages/login.jsx',
  'src/app.jsx',
];

const source = (await Promise.all(sourceFiles.map(async file => {
  const contents = await readFile(file, 'utf8');
  return `\n// ---- ${file} ----\n${contents}\n`;
}))).join('\n');

const result = await transform(source, {
  loader: 'jsx',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  target: 'es2019',
  format: 'iife',
  minify: true,
  legalComments: 'none',
});

await mkdir('dist', { recursive: true });
await writeFile('dist/app.bundle.js', result.code);
