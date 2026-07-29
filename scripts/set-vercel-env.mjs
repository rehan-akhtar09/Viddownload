import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

const content = readFileSync(envPath, 'utf-8');
const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

const vercel = (args) => execSync(`npx vercel ${args}`, { stdio: 'pipe', encoding: 'utf-8' });

// Link project
try {
  vercel('link --yes');
  console.log('Project linked');
} catch {
  console.log('Creating new project...');
  vercel('deploy --yes --public');
}

// Set each env var
for (const line of lines) {
  const [key, ...rest] = line.split('=');
  const value = rest.join('=').trim();
  const trimmed = key.trim();

  if (!trimmed || !value) continue;

  try {
    execSync(`echo "${value}" | npx vercel env add ${trimmed} production`, {
      stdio: 'pipe', encoding: 'utf-8', shell: true
    });
    console.log(`  ✓ ${trimmed}`);
  } catch (e) {
    console.log(`  ! ${trimmed} (maybe already set)`);
  }
}

console.log('\nAll env vars pushed. Run: vercel deploy --prod');
