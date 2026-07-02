import React from 'react';

export default function ConnectCard({ onConnect, loading, gmailReady }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1c1c28, #22222f)',
      border: '1px solid var(--border-accent)',
      borderRadius: 'var(--radius)',
      padding: 24,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Connect Your Gmail</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        SpendIQ will read your CBQ bank notifications from cbqsms@cbq.com.qa — read-only, nothing else.
      </div>
      <button
        onClick={onConnect}
        disabled={loading || !gmailReady}
        style={{
          background: loading || !gmailReady ? 'var(--bg-card)' : 'var(--accent)',
          border: 'none',
          color: '#fff',
          borderRadius: 12,
          padding: '14px 28px',
          fontSize: 15,
          fontWeight: 700,
          width: '100%',
          cursor: loading || !gmailReady ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? 'Connecting...' : !gmailReady ? 'Loading...' : '🔗 Connect Gmail'}
      </button>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
        Gmail read-only · Data stays on your device · No external storage
      </div>
    </div>
  );
}
