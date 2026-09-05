import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Read-only deployment check. Does not submit forms, change remote data,
// or save remote images; compares the published static bytes in memory.
const root = new URL('../frontend/', import.meta.url);
const base = 'https://yichinghui.github.io/enterprise-ai-productivity-camp-guide-2026-09/';
const paths = ['index.html', 'styles.css', 'app.js', ...(await readdir(new URL('assets/', root))).map(name => `assets/${name}`)];
const sha = data => createHash('sha256').update(data).digest('hex');
const rows = [];
for (let i = 0; i < paths.length; i += 3) {
  rows.push(...await Promise.all(paths.slice(i, i + 3).map(async path => {
    const response = await fetch(new URL(path === 'index.html' ? './' : path, base), { signal: AbortSignal.timeout(25000) });
    const data = Buffer.from(await response.arrayBuffer());
    const local = await readFile(new URL(path, root));
    return { path, status: response.status, bytes: data.byteLength, sha256Matches: sha(data) === sha(local), redirected: response.redirected };
  })));
}
console.log(JSON.stringify({ base, checkedAt: new Date().toISOString(), results: rows }, null, 2));
if (!rows.every(row => row.status === 200 && row.sha256Matches && !row.redirected)) process.exitCode = 1;
console.log(`Local source: ${fileURLToPath(root)}`);
