// Renders widgets/*.jsx (JSX modules returning an <svg>) to static SVG files.
// Design tokens are mapped to site CSS variables so diagrams follow light/dark theme
// when inlined into a page.
import { build } from 'esbuild';
import { readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srcDir = path.join(root, 'widgets');
const outDir = path.join(root, 'src', 'diagrams');
const tmpDir = path.join(root, '.diagram-build');

const TOKENS = {
  '--cds-chart-axis': '--dg-line',
  '--cds-chart-grid': '--dg-grid',
  '--cds-chart-reference-tint': '--dg-tint',
  '--cds-text-primary': '--dg-ink',
  '--cds-text-secondary': '--dg-quiet',
  '--cds-chart-categorical-1': '--dg-c1',
  '--cds-chart-categorical-2': '--dg-c2',
  '--cds-chart-categorical-3': '--dg-c3',
  '--cds-chart-categorical-4': '--dg-c4',
  '--cds-chart-categorical-5': '--dg-c5',
  '--cds-chart-status-good': '--dg-good',
  '--cds-chart-status-warning': '--dg-warn',
  '--cds-chart-status-critical': '--dg-bad',
};

const require = createRequire(import.meta.url);

async function main() {
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(srcDir)).filter((f) => f.endsWith('.jsx')).sort();
  if (!files.length) throw new Error(`No widgets found in ${srcDir}`);

  let failed = 0;
  for (const file of files) {
    const name = file.replace(/\.jsx$/, '');
    const outfile = path.join(tmpDir, `${name}.cjs`);
    try {
      await build({
        entryPoints: [path.join(srcDir, file)],
        outfile,
        bundle: true,
        platform: 'node',
        format: 'cjs',
        jsx: 'automatic',
        external: ['react', 'react/jsx-runtime'],
        logLevel: 'silent',
      });
      const mod = require(outfile);
      const Component = mod.default;
      if (typeof Component !== 'function') throw new Error('default export is not a component');

      let svg = renderToStaticMarkup(React.createElement(Component));
      svg = svg
        .replace(/\sdata-claude-[a-z-]+="[^"]*"/g, '')
        .replace(/var\((--cds-[a-z0-9-]+)\)/g, (m, tok) => {
          const mapped = TOKENS[tok];
          if (!mapped) throw new Error(`Unmapped design token ${tok}`);
          return `var(${mapped})`;
        })
        .replace(/^<svg /, '<svg class="diagram" xmlns="http://www.w3.org/2000/svg" ');
      if (!svg.startsWith('<svg')) throw new Error('component did not render an <svg> root');

      await writeFile(path.join(outDir, `${name}.svg`), svg + '\n', 'utf8');
      console.log(`ok   ${name}.svg (${svg.length} bytes)`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${file}: ${err.message}`);
    }
  }
  await rm(tmpDir, { recursive: true, force: true });
  if (failed) {
    console.error(`${failed} diagram(s) failed`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
