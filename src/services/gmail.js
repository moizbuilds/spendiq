// Gmail OAuth and email fetching via Google API (browser)
// Uses Google Identity Services (tokenClient) + gapi for Gmail API

const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
const SENDER = 'cbqsms@cbq.com.qa';

let tokenClient = null;
let gapiInited = false;
let gisInited = false;

export function initGmailService() {
  return new Promise((resolve) => {
    // Load gapi client
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
      });
      gapiInited = true;
      if (gisInited) resolve();
    });

    // Init Google Identity Services token client
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: () => {}, // set dynamically before use
    });
    gisInited = true;
    if (gapiInited) resolve();
  });
}

export function connectGmail() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      // Token is now set in gapi.client automatically
      resolve(response);
    };
    // Request access token
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

export function isConnected() {
  return window.gapi?.client?.getToken() !== null && window.gapi?.client?.getToken() !== undefined;
}

export function disconnectGmail() {
  const token = window.gapi.client.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
}

export async function fetchCBQEmails(maxResults = 500) {
  const response = await window.gapi.client.gmail.users.messages.list({
    userId: 'me',
    q: `from:${SENDER}`,
    maxResults,
  });

  const messages = response.result.messages || [];
  const transactions = [];

  for (const msg of messages) {
    const detail = await window.gapi.client.gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    const body = extractEmailBody(detail.result);
    if (!body) continue;

    const parsed = parseCBQEmail(body, msg.id);
    if (parsed) transactions.push(parsed);
  }

  return transactions;
}

function extractEmailBody(message) {
  const payload = message.payload;
  if (!payload) return null;

  // Try plain text parts first
  const parts = payload.parts || [payload];
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
  }
  // Fallback: snippet
  return message.snippet || null;
}

export function parseCBQEmail(body, id = null) {
  // Normalise whitespace
  const text = body.replace(/\s+/g, ' ').trim();

  // Primary pattern: debit card transaction
  // "Debit Card **6996 was used for QAR 56.00 at BLENDED CAFE at 18:43 12-Jun-26 Balance: QAR 13,265.60"
  const debitPattern = /Debit Card \*+(\d{4}) was used for QAR ([\d,]+\.?\d*) at (.+?) at (\d{2}:\d{2}) (\d{2}-\w{3}-\d{2,4}) Balance: QAR ([\d,]+\.?\d*)/i;

  // Credit pattern: "Your account has been credited with QAR X.XX ..."
  const creditPattern = /(?:account|card) (?:has been )?credited (?:with )?(?:QAR )?([\d,]+\.?\d*).*?(\d{2}:\d{2}) (\d{2}-\w{3}-\d{2,4}).*?Balance: QAR ([\d,]+\.?\d*)/i;

  // ATM pattern
  const atmPattern = /ATM.*?QAR ([\d,]+\.?\d*).*?(\d{2}:\d{2}) (\d{2}-\w{3}-\d{2,4}).*?Balance: QAR ([\d,]+\.?\d*)/i;

  let transaction = null;

  const debitMatch = text.match(debitPattern);
  if (debitMatch) {
    transaction = {
      id: id || `txn_${Date.now()}_${Math.random()}`,
      type: 'debit',
      card: debitMatch[1],
      amount: parseFloat(debitMatch[2].replace(/,/g, '')),
      merchant: debitMatch[3].trim(),
      time: debitMatch[4],
      date: normaliseDate(debitMatch[5]),
      balance: parseFloat(debitMatch[6].replace(/,/g, '')),
      category: null,
      raw: text.slice(0, 200),
      needsReview: false,
    };
    return transaction;
  }

  const creditMatch = text.match(creditPattern);
  if (creditMatch) {
    transaction = {
      id: id || `txn_${Date.now()}_${Math.random()}`,
      type: 'credit',
      card: null,
      amount: parseFloat(creditMatch[1].replace(/,/g, '')),
      merchant: 'Incoming Transfer',
      time: creditMatch[2],
      date: normaliseDate(creditMatch[3]),
      balance: parseFloat(creditMatch[4].replace(/,/g, '')),
      category: 'Income',
      raw: text.slice(0, 200),
      needsReview: false,
    };
    return transaction;
  }

  const atmMatch = text.match(atmPattern);
  if (atmMatch) {
    transaction = {
      id: id || `txn_${Date.now()}_${Math.random()}`,
      type: 'atm',
      card: null,
      amount: parseFloat(atmMatch[1].replace(/,/g, '')),
      merchant: 'ATM Withdrawal',
      time: atmMatch[2],
      date: normaliseDate(atmMatch[3]),
      balance: parseFloat(atmMatch[4].replace(/,/g, '')),
      category: 'Cash',
      raw: text.slice(0, 200),
      needsReview: false,
    };
    return transaction;
  }

  // Unknown format — flag for review if it looks like a transaction
  if (text.includes('QAR') && text.includes('Balance')) {
    return {
      id: id || `txn_${Date.now()}_${Math.random()}`,
      type: 'unknown',
      card: null,
      amount: null,
      merchant: 'Unknown',
      time: null,
      date: new Date().toISOString().split('T')[0],
      balance: null,
      category: null,
      raw: text.slice(0, 300),
      needsReview: true,
    };
  }

  return null;
}

function normaliseDate(dateStr) {
  // Convert "12-Jun-26" or "12-Jun-2026" to ISO "2026-06-12"
  const months = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
  const match = dateStr.match(/(\d{1,2})-(\w{3})-(\d{2,4})/);
  if (!match) return dateStr;
  const day = match[1].padStart(2, '0');
  const month = String(months[match[2]] || 1).padStart(2, '0');
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${month}-${day}`;
}
