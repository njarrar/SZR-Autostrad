// Makes the app icons and launch screens from assets/. Android cuts its icons to a
// circle or squircle, so it uses assets/android/, a copy of the icon without the sign's border.
import { execFileSync } from 'node:child_process';
const colors = ['--iconBackgroundColor', '#0b6b3a', '--iconBackgroundColorDark', '#0b6b3a', '--splashBackgroundColor', '#0b6b3a', '--splashBackgroundColorDark', '#0b6b3a'];
const run = (...args) => execFileSync('npx', ['capacitor-assets', 'generate', ...args, ...colors], { stdio: 'inherit', cwd: new URL('.', import.meta.url).pathname });
run('--ios', '--assetPath', 'assets');
run('--android', '--assetPath', 'assets/android');
