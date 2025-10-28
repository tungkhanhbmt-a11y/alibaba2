import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = '1h13-Vk_2H4_0pR-VANHHKJh57Z9ngpvBq0xCXV7XcY4';
const SHEET_NAME = 'sanpham';

// Support credentials from env (GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_BASE64)
const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  ? path.join(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_PATH)
  : path.join(process.cwd(), 'src/config/google-service-account.json');

function loadCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
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

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `Google service account file not found at ${CREDENTIALS_PATH}. Set GOOGLE_SERVICE_ACCOUNT_PATH or the env var GOOGLE_SERVICE_ACCOUNT_BASE64/JSON in your .env.local`
    );
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

export async function getProducts() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1:Z1000`,
  });
  return res.data.values || [];
}

export async function addProduct(product: string[]) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      // ensure product has a status column (D). If caller provided only A-C, append empty status.
      values: [product],
    },
  });
}

export async function updateProduct(rowIndex: number, product: string[]) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  // rowIndex is zero-based index into the data rows (excluding header). Data starts at sheet row 2.
  const sheetRow = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${sheetRow}:Z${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [product],
    },
  });
}

export async function deleteProduct(rowIndex: number) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  // Clear the specific row (rowIndex is zero-based relative to data rows)
  const sheetRow = rowIndex + 2;
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${sheetRow}:Z${sheetRow}`,
  });
}

export async function setProductStatus(rowIndex: number, status: string) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetRow = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!D${sheetRow}:D${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[status]] },
  });
}
