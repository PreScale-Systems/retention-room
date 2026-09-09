// Syncs the shared production data (script, audio, assets) into public/ so the
// Remotion bundle can load it via staticFile(). Run before `remotion studio`
// or `remotion render` — the npm scripts do this automatically.
// Also writes public/asset-index.json so the comp knows which PNGs exist and
// can render a styled placeholder for captures that haven't landed yet.
import {cpSync, mkdirSync, existsSync, readdirSync, copyFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const videoDir = resolve(here, '..');
const publicDir = join(here, 'public');

mkdirSync(publicDir, {recursive: true});
mkdirSync(join(publicDir, 'audio'), {recursive: true});
mkdirSync(join(publicDir, 'assets'), {recursive: true});

const copies = [
  {from: join(videoDir, 'script', 'script.json'), to: join(publicDir, 'script.json')},
  {from: join(videoDir, 'audio', 'manifest.json'), to: join(publicDir, 'manifest.json')},
];

let ok = true;
for (const {from, to} of copies) {
  if (existsSync(from)) {
    copyFileSync(from, to);
    console.log(`synced ${from} -> ${to}`);
  } else {
    ok = false;
    console.warn(`MISSING: ${from} (composition will fail to load without it)`);
  }
}

const copyDir = (fromDir, toDir, exts) => {
  const copied = [];
  if (!existsSync(fromDir)) return copied;
  for (const f of readdirSync(fromDir)) {
    if (exts.some((e) => f.toLowerCase().endsWith(e))) {
      cpSync(join(fromDir, f), join(toDir, f));
      copied.push(f);
      console.log(`synced ${join(fromDir, f)}`);
    }
  }
  return copied;
};

copyDir(join(videoDir, 'audio'), join(publicDir, 'audio'), ['.wav', '.mp3', '.m4a']);
const assets = copyDir(join(videoDir, 'assets'), join(publicDir, 'assets'), [
  '.png', '.jpg', '.jpeg', '.gif', '.mp4', '.webm', '.json',
]);

writeFileSync(join(publicDir, 'asset-index.json'), JSON.stringify(assets, null, 2));
console.log(`wrote asset-index.json (${assets.length} assets)`);

if (!ok) {
  console.warn('sync-assets: some inputs are missing; see warnings above.');
}
