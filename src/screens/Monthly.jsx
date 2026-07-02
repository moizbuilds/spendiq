import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Monthly({ transactions }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const debitTxns = transactions.filter(t => t.type === 'debit');

  // Calendar heatmap data
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const daySpend = {};
  debitTxns.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  }).forEach(t => {
    const day = new Date(t.date).getDate();
    daySpend[day] = (daySpend[day] || 0) + t.amount;
  });

  const maxSpend = Math.max(...Object.values(daySpend), 1);

  // Last 6 months bar chart
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const total = debitTxns.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    }).reduce((s, t) => s + t.amount, 0);
    return { month: monthNames[d.getMonth()], total: parseFloat(total.toFixed(2)) };
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Monthly total for selected month
  const selectedMonthTotal = debitTxns.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  }).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 18 }}>{monthNames[month]} {year}</span>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>

      {/* Calendar heatmap */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Spending Heatmap</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--text-muted)', paddingBottom: 4 }}>{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const spend = daySpend[day] || 0;
            const intensity = spend > 0 ? 0.2 + (spend / maxSpend) * 0.8 : 0;
            return (
              <div
                key={day}
                title={spend > 0 ? `QAR ${spend.toFixed(2)}` : ''}
                style={{
                  aspectRatio: '1',
                  borderRadius: 6,
                  background: spend > 0 ? `rgba(204, 0, 0, ${intensity})` : 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: intensity > 0.5 ? '#fff' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6-month bar chart */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>Last 6 Months</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill: '#606078', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#606078', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`QAR ${v}`, 'Spent']}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="total" radius={[6,6,0,0]}>
              {barData.map((entry, index) => (
                <Cell key={index} fill={index === barData.length - 1 ? '#CC0000' : '#2a2a3a'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly total */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total for {monthNames[month]} {year}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>
          QAR {selectedMonthTotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

const navBtn = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 10,
  width: 40,
  height: 40,
  fontSize: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
