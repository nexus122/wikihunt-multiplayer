// Mid-fi Daily standalone page — route of the day + streak + community stats

function StreakRow({ filled = 12, total = 14 }) {
  // 2 rows of 7
  const days = ['M','T','W','T','F','S','S'];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length: 2 }).map((_, row) => (
        <div key={row} style={{ display: 'flex', gap: 5 }}>
          {Array.from({ length: 7 }).map((_, col) => {
            const idx = row * 7 + col;
            const on = idx < filled;
            const today = idx === filled - 1;
            return (
              <div key={col} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 5,
                  background: on ? 'var(--coral)' : 'transparent',
                  border: `1.5px solid ${on ? 'var(--coral)' : 'var(--rule-2)'}`,
                  boxShadow: today ? '0 0 0 3px var(--coral-soft)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 10, fontWeight: 600,
                }}>{today ? '🔥' : ''}</div>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{days[col]}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DailyScreen({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        <AppHeader context="daily" back/>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px', width: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow">daily · day #142 · 12 may 2026</span>
              <h1 className="h1" style={{ fontSize: 60, marginTop: 6, lineHeight: .95 }}>
                Today's<br/><span className="ital" style={{ fontWeight: 500 }}>hunt.</span>
              </h1>
            </div>
            <div className="card butter" style={{ padding: '14px 18px', textAlign: 'center', minWidth: 130 }}>
              <span className="label" style={{ color: 'var(--ink-2)' }}>🔥 streak</span>
              <div className="num" style={{ fontSize: 44, lineHeight: 1, marginTop: 2 }}>12</div>
              <span className="news ital" style={{ fontSize: 12, color: 'var(--ink-2)' }}>don't break it</span>
            </div>
          </div>

          {/* ROUTE — the hero */}
          <div className="card" style={{ padding: 30 }}>
            <span className="eyebrow" style={{ color: 'var(--ink-3)' }}>everyone gets the same route</span>
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 18 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="label" style={{ marginBottom: 6 }}>start</div>
                <div className="serif" style={{ fontSize: 32, color: 'var(--bluek)', lineHeight: 1.05, fontWeight: 500 }}>Roman Empire</div>
                <div className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>post-Republican state of ancient Rome</div>
              </div>
              <div className="mono" style={{ fontSize: 26, color: 'var(--ink-3)' }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div className="label" style={{ marginBottom: 6 }}>target</div>
                <div className="serif" style={{ fontSize: 32, color: 'var(--coral)', lineHeight: 1.05, fontWeight: 500, fontStyle: 'italic' }}>Pliny the Elder</div>
                <div className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>roman author &amp; naturalist · 23–79 AD</div>
              </div>
            </div>
          </div>

          {/* STREAK GRID */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="eyebrow">your last 2 weeks</span>
              <span className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)' }}>12 of 14 days played</span>
            </div>
            <div style={{ marginTop: 14 }}><StreakRow filled={12} total={14}/></div>
          </div>

          {/* COMMUNITY STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              ['solved by', '128', 'people today'],
              ['avg steps', '5.3', 'in 1:14 min'],
              ['best ever', '3', 'in 0:38 by 🐙 lia'],
              ['resets in', '04:23', 'hours'],
            ].map(([k,v,sub], i) => (
              <div key={i} className="card" style={{ padding: '14px 16px' }}>
                <span className="label">{k}</span>
                <div className="num" style={{ fontSize: 26, lineHeight: 1, marginTop: 4 }}>{v}</div>
                <div className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          <button className="btn primary xl" style={{ alignSelf: 'center', minWidth: 320, marginTop: 6 }}>
            ▸ Hunt the day
          </button>
          <div className="news ital" style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>
            one attempt per day · saves to your streak
          </div>
        </div>
      </div>
    </MF>
  );
}

Object.assign(window, { DailyScreen });
