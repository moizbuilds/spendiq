const KEY = 'spendiq_transactions';

export function saveTransactions(transactions) {
  localStorage.setItem(KEY, JSON.stringify(transactions));
}

export function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearTransactions() {
  localStorage.removeItem(KEY);
  localStorage.removeItem('spendiq_insights');
  localStorage.removeItem('spendiq_last_sync');
}

export function saveLastSync() {
  localStorage.setItem('spendiq_last_sync', new Date().toISOString());
}

export function loadLastSync() {
  return localStorage.getItem('spendiq_last_sync');
}
