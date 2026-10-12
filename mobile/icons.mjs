// Makes the app icons and launch screens from assets/. Android cuts its icons to a
// circle or squircle, so it uses assets/android/, a copy of the icon without the sign's border.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import sharp from 'sharp';
const here = new URL('.', import.meta.url).pathname;
const res = here + '../android/app/src/main/res/';
const colors = ['--iconBackgroundColor', '#0b6b3a', '--iconBackgroundColorDark', '#0b6b3a', '--splashBackgroundColor', '#0b6b3a', '--splashBackgroundColorDark', '#0b6b3a'];
const run = (...args) => execFileSync('npx', ['capacitor-assets', 'generate', ...args, ...colors], { stdio: 'inherit', cwd: here });
run('--ios', '--assetPath', 'assets');
run('--android', '--assetPath', 'assets/android');

// the launch screen looks the same by night, so drop the night copies
for (const d of fs.readdirSync(res)) if (d.includes('-night')) fs.rmSync(res + d, { recursive: true });

// Android 13 and newer can tint the icon to match the wallpaper; that needs a one color layer
const sizes = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
for (const [d, px] of Object.entries(sizes)) await sharp(here + 'assets/android/icon-monochrome.png').resize(px, px).toFile(`${res}mipmap-${d}/ic_launcher_monochrome.png`);
for (const f of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  const file = res + 'mipmap-anydpi-v26/' + f;
  const xml = fs.readFileSync(file, 'utf8').replace(/\s*<monochrome>[\s\S]*?<\/monochrome>/, '');
  fs.writeFileSync(file, xml.replace('</adaptive-icon>', '    <monochrome>\n        <inset android:drawable="@mipmap/ic_launcher_monochrome" android:inset="16.7%" />\n    </monochrome>\n</adaptive-icon>'));
}
