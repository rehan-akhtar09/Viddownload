import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { YOUTUBE_DL_PATH } = require('yt-dlp-exec/src/constants');
const fileName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const outputDirectory = path.join(process.cwd(), 'runtime-bin');
const outputPath = path.join(outputDirectory, fileName);

await fs.access(YOUTUBE_DL_PATH);
await fs.rm(outputDirectory, { recursive: true, force: true });
await fs.mkdir(outputDirectory, { recursive: true });
await fs.copyFile(YOUTUBE_DL_PATH, outputPath);

if (process.platform !== 'win32') {
    await fs.chmod(outputPath, 0o755);
}

console.log(`Prepared ${fileName} for the application runtime.`);
