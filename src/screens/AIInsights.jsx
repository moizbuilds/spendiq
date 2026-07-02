import React from 'react';

export default function AIInsights({ transactions, insights, insightsLoading, onRefreshInsights }) {
  const now = new Date();
  const debitTxns = transactions.filter(t => t.type === 'debit');

  const thisMonthTxns = debitTxns.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Recurring merchants (appear 2+ times this month)
  const merchantCount = {};
  for (const t of thisMonthTxns) {
    merchantCount[t.merchant] = (merchantCount[t.merchant] || 0) + 1;
  }
  const recurring = Object.entries(merchantCount).filter(([, c]) => c >= 2).sort((a,b) => b[1]-a[1]);

  // Best / worst day
  const dayMap = {};
  for (const t of thisMonthTxns) {
    dayMap[t.date] = (dayMap[t.date] || 0) + t.amount;
  }
  const days = Object.entries(dayMap).sort((a,b) => b[1]-a[1]);
  const worstDay = days[0];
  const bestDay = days[days.length - 1];

  // Weekend vs weekday
  const weekendSpend = thisMonthTxns.filter(t => {
    const d = new Date(t.date);
    return d.getDay() === 0 || d.getDay() === 6;
  }).reduce((s, t) => s + t.amount, 0);
  const weekdaySpend = thisMonthTxns.filter(t => {
    const d = new Date(t.date);
    return d.getDay() !== 0 && d.getDay() !== 6;
  }).reduce((s, t) => s + t.amount, 0);

  // Projected spend
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const total = thisMonthTxns.reduce((s,t) => s + t.amount, 0);
  const projected = dayOfMonth > 0 ? (total / dayOfMonth) * daysInMonth : 0;

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* AI Summary */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>🤖 AI Summary</div>
          <button
            onClick={onRefreshInsights}
            disabled={insightsLoading || transactions.length === 0}
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              opacity: insightsLoading ? 0.6 : 1,
            }}
          >
            {insightsLoading ? 'Analysing...' : 'Refresh'}
          </button>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {insightsLoading ? 'Analysing your spending patterns...' : (insights || 'Tap Refresh to generate your AI spending summary.')}
        </p>
      </div>

      {/* Stats cards */}
      {thisMonthTxns.length > 0 && <>
        {/* Projected */}
        <div style={card}>
          <div style={cardLabel}>📈 Projected Month-End Spend</div>
          <div style={bigNum}>QAR {projected.toFixed(2)}</div>
          <div style={subText}>Based on {dayOfMonth} days of spending at QAR {(total/dayOfMonth).toFixed(2)}/day avg</div>
        </div>

        {/* Weekend vs Weekday */}
        <div style={card}>
          <div style={cardLabel}>📅 Weekend vs Weekday</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>QAR {weekendSpend.toFixed(0)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weekends</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>QAR {weekdaySpend.toFixed(0)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weekdays</div>
            </div>
          </div>
        </div>

        {/* Best / Worst day */}
        {worstDay && (
          <div style={card}>
            <div style={cardLabel}>📊 Spending Days</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🔴 Biggest day</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{worstDay[0]} · QAR {worstDay[1].toFixed(2)}</span>
              </div>
              {bestDay && bestDay[0] !== worstDay[0] && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🟢 Lightest day</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{bestDay[0]} · QAR {bestDay[1].toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recurring merchants */}
        {recurring.length > 0 && (
          <div style={card}>
            <div style={cardLabel}>🔁 Recurring This Month</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {recurring.slice(0, 5).map(([merchant, count]) => (
                <div key={merchant} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13 }}>{merchant}</span>
                  <span style={{ fontSize: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 12, color: 'var(--text-muted)' }}>
                    {count}× visits
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>}

      {transactions.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Connect Gmail and sync your transactions to see AI insights.
        </div>
      )}
    </div>
  );
}

const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 };
const cardLabel = { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 };
const bigNum = { fontSize: 28, fontWeight: 800, color: 'var(--accent)', marginTop: 4 };
const subText = { fontSize: 12, color: 'var(--text-muted)', marginTop: 4 };
