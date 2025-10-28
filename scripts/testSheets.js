const fs = require('fs');
const { google } = require('googleapis');

// Quick helper to read .env.local (simple parser)
function readEnvLocal() {
  const p = '.env.local';
  if (!fs.existsSync(p)) throw new Error('.env.local not found in project root');
  const txt = fs.readFileSync(p, 'utf8');
  const lines = txt.split(/\r?\n/);
  const env = {};
  for (const l of lines) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      env[m[1]] = m[2];
    }
  }
  return env;
}

(async function main(){
  try {
    const env = readEnvLocal();
    const b64 = env.GOOGLE_SERVICE_ACCOUNT_BASE64 || env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!b64) throw new Error('No GOOGLE_SERVICE_ACCOUNT_BASE64 or GOOGLE_SERVICE_ACCOUNT_JSON in .env.local');

    let credObj;
    if (env.GOOGLE_SERVICE_ACCOUNT_JSON && env.GOOGLE_SERVICE_ACCOUNT_JSON.trim().startsWith('{')) {
      credObj = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } else {
      const raw = Buffer.from(b64, 'base64').toString('utf8');
      credObj = JSON.parse(raw);
    }

    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    const jwt = new google.auth.JWT({
      email: credObj.client_email,
      key: credObj.private_key,
      scopes: SCOPES,
    });

    // Use the same spreadsheet id used in src/lib/googleSheets.ts
    const SPREADSHEET_ID = '1h13-Vk_2H4_0pR-VANHHKJh57Z9ngpvBq0xCXV7XcY4';

    await jwt.authorize();
    const sheets = google.sheets({ version: 'v4', auth: jwt });

    console.log('Authenticated. Fetching first rows from dshoadon...');
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'dshoadon!A1:Z10',
    });
    const rows = res.data.values || [];
    console.log('Rows fetched:', rows.length);
    if (rows.length > 0) {
      console.log('First 5 rows:');
      console.log(rows.slice(0,5).map(r=>JSON.stringify(r)).join('\n'));
    }
    console.log('\nAlso fetching sheet metadata (names)...');
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetNames = meta.data.sheets.map(s=>s.properties.title);
    console.log('Sheets in spreadsheet:', sheetNames.join(', '));

    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message || e);
    if (e.errors) console.error(e.errors);
    process.exit(2);
  }
})();
