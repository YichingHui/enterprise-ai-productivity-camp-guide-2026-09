import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Only writes the four revision assets below; all original files stay untouched.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'frontend/assets');
const require = createRequire(import.meta.url);
const bundledModules = '/Users/songfuxie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = require(require.resolve('sharp', { paths: [bundledModules] }));
}

const sourceDir = '/var/folders/88/r708_x4d0yq98zj3tdnkdqpr0000gn/T';
const logoSource = path.join(sourceDir, 'codex-clipboard-d6105d0a-242e-4d58-9ff5-a48359031a3b.png');
const portraitSource = '/Users/songfuxie/Desktop/意心会品宣素材/狼哥高清形象照_20260819193702_191_907.jpg';
const guides = [
  ['hotel-transport.jpg', 'codex-clipboard-7e25435d-cf12-40ac-b68d-8dcd9dab9fe5.jpg'],
  ['hotel-nearby.jpg', 'codex-clipboard-4ceca541-8f32-44bc-989a-e0db0c8286bd.jpg'],
];

const logoTarget = path.join(assets, 'logo-white.png');
await fs.copyFile(logoSource, logoTarget);
const [logoBefore, logoAfter] = await Promise.all([fs.readFile(logoSource), fs.readFile(logoTarget)]);
if (!logoBefore.equals(logoAfter)) throw new Error('Logo is not byte-identical to the supplied original');
const logoMetadata = await sharp(logoTarget).metadata();
const { data: logoPixels, info: logoInfo } = await sharp(logoTarget).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let transparentPixels = 0;
let translucentPixels = 0;
let opaquePixels = 0;
for (let offset = 3; offset < logoPixels.length; offset += logoInfo.channels) {
  const alpha = logoPixels[offset];
  if (alpha === 0) transparentPixels += 1;
  else if (alpha === 255) opaquePixels += 1;
  else translucentPixels += 1;
}
if (!logoMetadata.hasAlpha || !transparentPixels || !opaquePixels) throw new Error('Expected a visible logo with a transparent background');

await sharp(portraitSource).rotate().resize({ width: 1800, withoutEnlargement: true })
  .webp({ quality: 85, effort: 6 }).toFile(path.join(assets, 'lecturer-portrait.webp'));

for (const [name, original] of guides) {
  const source = path.join(sourceDir, original);
  const sourceMetadata = await sharp(source).metadata();
  if (sourceMetadata.width !== 1810 || sourceMetadata.height !== 1280) throw new Error(`Unexpected original dimensions for ${name}`);
  // Keep every label and full original resolution; 4:4:4 avoids colored text subsampling.
  await sharp(source).rotate().jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(path.join(assets, name));
}

const files = ['logo-white.png', 'lecturer-portrait.webp', ...guides.map(([name]) => name)];
const results = [];
for (const name of files) {
  const target = path.join(assets, name);
  const metadata = await sharp(target).metadata();
  const bytes = (await fs.stat(target)).size;
  if (name === 'lecturer-portrait.webp' && bytes >= 300_000) throw new Error('Portrait exceeds the 300 KB budget');
  if (name.endsWith('.jpg') && bytes >= 800_000) throw new Error(`${name} exceeds the 800 KB budget`);
  results.push({ name, width: metadata.width, height: metadata.height, format: metadata.format, bytes });
}
console.log(JSON.stringify({
  files: results,
  logo: { byteIdentical: true, hasAlpha: logoMetadata.hasAlpha, transparentPixels, translucentPixels, opaquePixels },
  sourceFilesModified: false,
}, null, 2));
