import {Config} from '@remotion/cli/config';
import fs from 'fs';

// Use a browser already installed on the machine (Remotion's own download is blocked in the cloud workspace).
const browsers = [
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
  '/usr/bin/google-chrome',
];
const found = browsers.find((b) => fs.existsSync(b));
if (found) Config.setBrowserExecutable(found);

Config.setVideoImageFormat('jpeg');
Config.setConcurrency(2);
