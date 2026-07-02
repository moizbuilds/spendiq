import React, { useState, useMemo } from 'react';

const CATEGORY_ICONS = {
  'Food & Cafes': '☕',
  'Groceries': '🛒',
  'Transport': '🚗',
  'Shopping': '🛍️',
  'Bills & Utilities': '📱',
  'Health': '💊',
  'Entertainment': '🎬',
  'Travel': '✈️',
  'Cash': '💵',
  'Income': '💰',
  'Other': '📌',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_ICONS);

export default function Transactions({ transactions }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [selectedTxn, setSelectedTxn] = useState(null);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search || t.merchant?.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'All' || t.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [transactions, search, catFilter]);

  if (selectedTxn) {
    return (
      <div style={{ padding: '20px 16px' }}>
        <button onClick={() => setSelectedTxn(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 20, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>{CATEGORY_ICONS[selectedTxn.category] || '📌'}</div>
          <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selectedTxn.merchant}</div>
          <div style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, color: selectedTxn.type === 'credit' ? 'var(--success)' : 'var(--accent)', marginBottom: 16 }}>
            {selectedTxn.type === 'credit' ? '+' : '−'} QAR {selectedTxn.amount?.toFixed(2) || '—'}
          </div>
          {[
            ['Category', selectedTxn.category || '—'],
            ['Date', selectedTxn.date],
            ['Time', selectedTxn.time || '—'],
            ['Card', selectedTxn.card ? `**** ${selectedTxn.card}` : '—'],
            ['Balance After', selectedTxn.balance ? `QAR ${selectedTxn.balance.toFixed(2)}` : '—'],
            ['Type', selectedTxn.type],
            selectedTxn.needsReview ? ['⚠️ Status', 'Needs manual review'] : null,
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 0' }}>
      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search merchants..."
        style={{
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 14px',
          color: 'var(--text-primary)',
          fontSize: 14,
          marginBottom: 10,
          outline: 'none',
        }}
      />

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
        {['All', ...ALL_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            style={{
              whiteSpace: 'nowrap',
              background: catFilter === cat ? 'var(--accent)' : 'var(--bg-card)',
              border: catFilter === cat ? '1px solid var(--accent)' : '1px solid var(--border)',
              color: catFilter === cat ? '#fff' : 'var(--text-secondary)',
              borderRadius: 20,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: catFilter === cat ? 600 : 400,
            }}
          >
            {cat !== 'All' && CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(t => (
          <div
            key={t.id}
            onClick={() => setSelectedTxn(t)}
            style={{
              background: 'var(--bg-card)',
              border: t.needsReview ? '1px solid var(--warning)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {CATEGORY_ICONS[t.category] || '📌'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.merchant || 'Unknown'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {t.date} {t.time && `· ${t.time}`} {t.category && `· ${t.category}`}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.type === 'credit' ? 'var(--success)' : 'var(--text-primary)' }}>
                {t.type === 'credit' ? '+' : '−'} QAR {t.amount?.toFixed(2) || '—'}
              </div>
              {t.needsReview && <div style={{ fontSize: 10, color: 'var(--warning)', marginTop: 2 }}>⚠ Review</div>}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            {transactions.length === 0 ? 'No transactions yet. Connect Gmail to load your CBQ emails.' : 'No transactions match your filter.'}
          </div>
        )}
      </div>
    </div>
  );
}
