import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const outDir = join(root, 'out');
const serverAppDir = join(root, '.next', 'server', 'app');
const staticDir = join(root, '.next', 'static');

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true });
}
mkdirSync(outDir, { recursive: true });

function copyDirSync(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

const htmlFiles = readdirSync(serverAppDir).filter(f => f.endsWith('.html'));
for (const file of htmlFiles) {
  const src = join(serverAppDir, file);
  const name = file.replace('.html', '');
  if (name === 'index') {
    copyFileSync(src, join(outDir, 'index.html'));
  } else if (name === '_not-found' || name === '_global-error') {
    continue;
  } else {
    const routeDir = join(outDir, name);
    mkdirSync(routeDir, { recursive: true });
    copyFileSync(src, join(routeDir, 'index.html'));
  }
}

copyDirSync(staticDir, join(outDir, '_next', 'static'));

// Copy any existing public/ assets
const publicDir = join(root, 'public');
if (existsSync(publicDir)) {
  for (const entry of readdirSync(publicDir)) {
    if (entry.startsWith('.')) continue;
    const srcPath = join(publicDir, entry);
    const destPath = join(outDir, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Static files ready in out/');
