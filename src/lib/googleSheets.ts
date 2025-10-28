
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = '1h13-Vk_2H4_0pR-VANHHKJh57Z9ngpvBq0xCXV7XcY4';
// Allow overriding credentials path via env var (set in .env.local)
const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  ? path.join(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_PATH)
  : path.join(process.cwd(), 'src/config/google-service-account.json');

function loadCredentials() {
  // Primary: if GOOGLE_SERVICE_ACCOUNT_JSON or BASE64 provided, prefer that
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      // fallthrough to file
      console.warn('Invalid JSON in GOOGLE_SERVICE_ACCOUNT_JSON env var');
    }
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('Invalid base64 in GOOGLE_SERVICE_ACCOUNT_BASE64 env var');
    }
  }

  // Fallback: read from file path
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(`Google service account file not found at ${CREDENTIALS_PATH}. Set GOOGLE_SERVICE_ACCOUNT_PATH in your .env.local`);
  }
  const raw = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  return JSON.parse(raw);
}

function getAuthClient() {
  const credentials = loadCredentials();
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
}



export async function getOrders() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'banhang!A1:Z1000',
  });
  return res.data.values || [];
}

export async function getInvoiceSummaries() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'dshoadon!A1:Z1000',
  });
  const rows = res.data.values || [];
  // assume header row present; map [invoiceId, branch, date, total]
  function formatDateToDDMMYYYY(s: any) {
    if (!s && s !== 0) return '';
    const val = String(s).trim();
    // already in dd/mm/yyyy
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return val;
    // ISO like yyyy-mm-dd or yyyy/mm/dd
    const isoMatch = val.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    // Try to parse using Date
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}/${m}/${y}`;
    }
    // fallback: return original string
    return val;
  }

  return rows.slice(1).map((r: any[]) => ({
    invoiceId: r[0] || '',
    branch: r[1] || '',
    date: formatDateToDDMMYYYY(r[2] || ''),
    total: r[3] || '',
  }));
}

export async function overwriteBanHang(allRows: string[][]) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'banhang!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: allRows },
  });
}

export async function overwriteInvoiceSummaries(allRows: string[][]) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'dshoadon!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: allRows },
  });
}



export async function addOrder(order: string[]) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'banhang!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [order],
    },
  });
}

export async function addInvoiceSummary(row: string[]) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'dshoadon!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  });
}

export async function getBranches() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'chinhanh!B2:B1000',
  });
  // res.data.values is array of rows, each row is [value]
  const rows = res.data.values || [];
  return rows.map((r) => (r[0] || '').toString());
}
