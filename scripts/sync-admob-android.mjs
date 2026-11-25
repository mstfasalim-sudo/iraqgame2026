import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const appId = (process.env.VITE_ADMOB_APP_ID || '').trim() || DEFAULT_TEST_APP_ID;

const stringsPath = path.resolve(
  process.cwd(),
  'android/app/src/main/res/values/strings.xml'
);

if (!fs.existsSync(stringsPath)) {
  console.warn('[sync-admob-android] strings.xml not found, skipping sync.');
  process.exit(0);
}

const xml = fs.readFileSync(stringsPath, 'utf8');
const tagRegex = /<string name="admob_app_id">[^<]*<\/string>/;
const replacement = `<string name="admob_app_id">${appId}</string>`;

let updatedXml;
if (tagRegex.test(xml)) {
  updatedXml = xml.replace(tagRegex, replacement);
} else {
  updatedXml = xml.replace('</resources>', `    ${replacement}\n</resources>`);
}

if (updatedXml !== xml) {
  fs.writeFileSync(stringsPath, updatedXml, 'utf8');
}

console.log(`[sync-admob-android] Synced Android admob_app_id: ${appId}`);
