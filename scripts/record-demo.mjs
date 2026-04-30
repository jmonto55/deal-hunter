import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const type = process.argv[2];
if (!['before', 'after'].includes(type)) {
  console.error('Usage: node scripts/record-demo.mjs before|after');
  process.exit(1);
}

const demosDir = path.join(process.cwd(), '.claude', 'demos');
fs.mkdirSync(demosDir, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  recordVideo: { dir: demosDir, size: { width: 1280, height: 800 } }
});

const page = await context.newPage();
await page.goto('http://localhost:3000');

console.log(`\n🎬  Recording "${type}" demo — you have 5 seconds to interact with the app!\n`);
await new Promise(r => setTimeout(r, 5000));

await context.close();
await browser.close();

const videoPath = await page.video().path();
const webmDest = path.join(demosDir, `${type}.webm`);
if (fs.existsSync(webmDest)) fs.unlinkSync(webmDest);
fs.renameSync(videoPath, webmDest);

// Convert to GIF using Playwright's bundled ffmpeg
const playwrightDir = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
const ffmpegDirs = fs.existsSync(playwrightDir)
  ? fs.readdirSync(playwrightDir).filter(d => d.startsWith('ffmpeg-'))
  : [];

if (ffmpegDirs.length > 0) {
  const ffmpegExe = path.join(playwrightDir, ffmpegDirs[0], 'ffmpeg-win64', 'ffmpeg.exe');
  const gifDest = path.join(demosDir, `${type}.gif`);
  if (fs.existsSync(gifDest)) fs.unlinkSync(gifDest);
  try {
    execFileSync(ffmpegExe, [
      '-i', webmDest,
      '-vf', 'fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
      '-loop', '0',
      gifDest
    ]);
    console.log(`\n✓ Saved: ${gifDest}`);
  } catch {
    console.log(`\n✓ Saved: ${webmDest}  (GIF conversion failed, use the .webm)`);
  }
} else {
  console.log(`\n✓ Saved: ${webmDest}`);
}
