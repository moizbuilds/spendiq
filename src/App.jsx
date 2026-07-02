import React, { useState, useEffect } from 'react';
import { loadTransactions, saveTransactions, saveLastSync, loadLastSync, clearTransactions } from './services/storage';
import { initGmailService, connectGmail, isConnected, disconnectGmail, fetchCBQEmails } from './services/gmail';
import { categoriseMerchant, guessCategory, generateInsights } from './services/claude';
import Dashboard from './screens/Dashboard';
import Transactions from './screens/Transactions';
import AIInsights from './screens/AIInsights';
import Monthly from './screens/Monthly';
import './styles/global.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'transactions', label: 'Transactions', icon: '💳' },
  { id: 'insights', label: 'AI Insights', icon: '🤖' },
  { id: 'monthly', label: 'Monthly', icon: '📅' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState(null);
  const [gmailReady, setGmailReady] = useState(false);
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const stored = loadTransactions();
    if (stored.length) setTransactions(stored);
    setLastSync(loadLastSync());

    // Init Google API
    const interval = setInterval(() => {
      if (window.gapi && window.google?.accounts?.oauth2) {
        clearInterval(interval);
        initGmailService().then(() => {
          setGmailReady(true);
          setGmailConnected(isConnected());
        }).catch(console.error);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  async function handleConnectGmail() {
    setError(null);
    setLoading(true);
    setLoadingMsg('Connecting to Gmail...');
    try {
      await connectGmail();
      setGmailConnected(true);
      await handleSync();
    } catch (e) {
      setError('Gmail connection failed: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }

  async function handleSync() {
    setError(null);
    setLoading(true);
    try {
      setLoadingMsg('Fetching emails from CBQ...');
      const raw = await fetchCBQEmails(500);

      setLoadingMsg(`Categorising ${raw.length} transactions...`);
      const existing = loadTransactions();
      const existingIds = new Set(existing.map(t => t.id));

      // Only process new ones
      const newTxns = raw.filter(t => !existingIds.has(t.id));

      // Fast offline categorisation first
      const guessed = newTxns.map(t => ({
        ...t,
        category: t.category || guessCategory(t.merchant),
      }));

      // For anything still 'Other', try AI categorisation (deduplicated by merchant)
      const uncategorisedMerchants = [...new Set(guessed.filter(t => t.category === 'Other').map(t => t.merchant))];
      const aiCategories = {};
      for (const merchant of uncategorisedMerchants) {
        aiCategories[merchant] = await categoriseMerchant(merchant);
      }
      const categorised = guessed.map(t =>
        t.category === 'Other' && aiCategories[t.merchant]
          ? { ...t, category: aiCategories[t.merchant] }
          : t
      );

      const all = [...existing, ...categorised].sort((a, b) =>
        new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00'))
      );

      saveTransactions(all);
      saveLastSync();
      setTransactions(all);
      setLastSync(new Date().toISOString());
    } catch (e) {
      setError('Sync failed: ' + (e.message || 'Check your Gmail connection'));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }

  async function handleRefreshInsights() {
    setInsightsLoading(true);
    const text = await generateInsights(transactions);
    setInsights(text);
    localStorage.setItem('spendiq_insights', text);
    setInsightsLoading(false);
  }

  useEffect(() => {
    const cached = localStorage.getItem('spendiq_insights');
    if (cached) setInsights(cached);
  }, []);

  function handleClearData() {
    if (confirm('Clear all transaction data? This cannot be undone.')) {
      clearTransactions();
      setTransactions([]);
      setInsights('');
      setLastSync(null);
    }
  }

  const screenProps = {
    transactions,
    gmailConnected,
    gmailReady,
    loading,
    loadingMsg,
    error,
    lastSync,
    onConnect: handleConnectGmail,
    onSync: handleSync,
    onClearData: handleClearData,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px 12px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>Spend</span>
          <span style={{ fontSize: 20, fontWeight: 800 }}>IQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {gmailConnected && (
            <button onClick={handleSync} disabled={loading} style={refreshBtnStyle}>
              {loading ? '⟳' : '↻'} Sync
            </button>
          )}
          {gmailConnected && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} title="Gmail connected" />
          )}
        </div>
      </header>

      {/* Loading bar */}
      {loading && (
        <div style={{ background: 'var(--bg-card)', padding: '10px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
          {loadingMsg}
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid var(--border-accent)', padding: '12px 20px', fontSize: 13, color: '#ff6060', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ff6060', fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--nav-height)' }}>
        {tab === 'dashboard' && <Dashboard {...screenProps} />}
        {tab === 'transactions' && <Transactions {...screenProps} />}
        {tab === 'insights' && <AIInsights {...screenProps} insights={insights} insightsLoading={insightsLoading} onRefreshInsights={handleRefreshInsights} />}
        {tab === 'monthly' && <Monthly {...screenProps} />}
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        height: 'var(--nav-height)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 200,
      }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: tab === item.id ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontSize: tab === item.id ? 13 : 12,
              fontWeight: tab === item.id ? 600 : 400,
              transition: 'color 0.2s',
              padding: '8px 0',
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const refreshBtnStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 500,
};
