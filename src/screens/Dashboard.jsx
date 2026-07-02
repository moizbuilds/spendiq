import React from 'react';
import ConnectCard from '../components/ConnectCard';
import StatCard from '../components/StatCard';

export default function Dashboard({ transactions, gmailConnected, gmailReady, loading, loadingMsg, onConnect, onSync, onClearData, lastSync }) {
  const now = new Date();

  const debitTxns = transactions.filter(t => t.type === 'debit');

  const thisMonthTxns = debitTxns.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const lastMonthTxns = debitTxns.filter(t => {
    const d = new Date(t.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });

  const today = debitTxns.filter(t => t.date === now.toISOString().split('T')[0]);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const thisWeek = debitTxns.filter(t => new Date(t.date) >= startOfWeek);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const thisYear = debitTxns.filter(t => new Date(t.date) >= startOfYear);

  const sum = arr => arr.reduce((s, t) => s + t.amount, 0);

  const thisMonthTotal = sum(thisMonthTxns);
  const lastMonthTotal = sum(lastMonthTxns);
  const diff = thisMonthTotal - lastMonthTotal;
  const balance = transactions[0]?.balance ?? null;

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const lastMonthName = monthNames[(now.getMonth() - 1 + 12) % 12];

  // Category breakdown
  const catMap = {};
  for (const t of thisMonthTxns) {
    const c = t.category || 'Other';
    catMap[c] = (catMap[c] || 0) + t.amount;
  }
  const topCats = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0, 4);

  const COLORS = ['#CC0000','#ff6b6b','#ffa940','#00c48c','#4da6ff','#b388ff'];

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!gmailConnected && (
        <ConnectCard onConnect={onConnect} loading={loading} gmailReady={gmailReady} />
      )}

      {/* Balance */}
      <div style={card}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Current Balance</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -1 }}>
          {balance !== null ? `QAR ${balance.toLocaleString('en-QA', { minimumFractionDigits: 2 })}` : '—'}
        </div>
        {lastSync && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Last synced {new Date(lastSync).toLocaleTimeString()}</div>}
      </div>

      {/* This month spend */}
      <div style={{ ...card, border: '1px solid var(--border-accent)' }}>
        <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Spent This Month</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--accent)', letterSpacing: -1 }}>
          QAR {thisMonthTotal.toLocaleString('en-QA', { minimumFractionDigits: 2 })}
        </div>
        {lastMonthTotal > 0 && (
          <div style={{ fontSize: 13, color: diff > 0 ? '#ff6060' : 'var(--success)', marginTop: 8, fontWeight: 500 }}>
            {diff > 0 ? '↑' : '↓'} QAR {Math.abs(diff).toFixed(2)} {diff > 0 ? 'more' : 'less'} than {lastMonthName}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{thisMonthTxns.length} transactions</div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="Today" value={sum(today)} count={today.length} />
        <StatCard label="This Week" value={sum(thisWeek)} count={thisWeek.length} />
        <StatCard label="This Month" value={thisMonthTotal} count={thisMonthTxns.length} />
        <StatCard label="This Year" value={sum(thisYear)} count={thisYear.length} />
      </div>

      {/* Top categories */}
      {topCats.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>Top Categories This Month</div>
          {topCats.map(([cat, amt], i) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i] }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{cat}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>QAR {amt.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      {gmailConnected && (
        <button onClick={onClearData} style={{
          background: 'none',
          border: '1px solid rgba(204,0,0,0.3)',
          color: 'var(--accent)',
          borderRadius: 10,
          padding: '12px',
          fontSize: 13,
          width: '100%',
          marginTop: 8,
        }}>
          Clear All Data
        </button>
      )}
    </div>
  );
}

const card = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '16px',
};
