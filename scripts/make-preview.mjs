// Copies dist/ to preview/ with all site-absolute links rewritten to relative
// paths and directory links pointed at index.html, so the site can be browsed
// from any host path (or straight from disk). Not used for the real deploy.
import { cp, readdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'preview');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])),
  );
  return files.flat();
}

function toIndex(ref) {
  const [p, hash = ''] = ref.split('#');
  if (!p) return ref;
  const fixed = p.endsWith('/') ? `${p}index.html` : p;
  return hash ? `${fixed}#${hash}` : fixed;
}

await stat(dist).catch(() => {
  throw new Error('dist/ not found: run "npm run build" first');
});
await rm(out, { recursive: true, force: true });
await cp(dist, out, { recursive: true });

for (const file of (await walk(out)).filter((f) => f.endsWith('.html'))) {
  const rel = path.relative(path.dirname(file), out) || '.';
  let html = await readFile(file, 'utf8');
  html = html.replace(/(href|src)="([^"]*)"/g, (m, attr, ref) => {
    if (/^(https?:|mailto:|#|data:)/.test(ref)) return m;
    if (ref.startsWith('/')) return `${attr}="${toIndex(`${rel}${ref}`)}"`;
    return `${attr}="${toIndex(ref)}"`;
  });
  await writeFile(file, html, 'utf8');
}
// artifact host reserves names starting with "_"
await (await import('node:fs/promises')).rename(path.join(out, '_astro'), path.join(out, 'assets'));
for (const file of (await walk(out)).filter((f) => f.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  await writeFile(file, html.replaceAll('/_astro/', '/assets/').replaceAll('"_astro/', '"assets/'), 'utf8');
}
console.log(`preview written to ${out}`);
