// Mid-fi Leaderboard — hero #1 card + ranked list with tabs

function LbTabsBar({ active = 'today' }) {
  const tabs = [
    ['today', "Today's hunt"],
    ['all', 'All-time'],
    ['mine', 'My results'],
    ['challenge', 'Challenge'],
  ];
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--rule)', padding: '0 4px' }}>
      {tabs.map(([k, l]) => (
        <button key={k} className="btn ghost" style={{
          border: 'none', padding: '12px 14px', borderRadius: 0, fontWeight: 500,
          color: k === active ? 'var(--ink)' : 'var(--ink-3)',
          borderBottom: k === active ? '2px solid var(--coral)' : '2px solid transparent',
          marginBottom: -1,
        }}>{l}</button>
      ))}
    </div>
  );
}

function LbRow({ rank, emoji, name, steps, time, dur, me, top3 }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 100px',
      alignItems: 'center', gap: 12, padding: '14px 8px',
      borderTop: '1px solid var(--rule)',
      background: me ? 'var(--coral-soft)' : 'transparent',
    }}>
      <span className="serif" style={{ fontSize: 22, textAlign: 'center', color: top3 ? 'var(--coral)' : 'var(--ink-3)' }}>{rank}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={'av sm' + (me ? ' coral' : '')}>{emoji}</span>
        <span style={{ fontWeight: me ? 600 : 500 }}>{name}{me && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 6 }}>· you</span>}</span>
      </div>
      <span className="num" style={{ textAlign: 'right' }}>{steps}</span>
      <span className="num" style={{ textAlign: 'right' }}>{time}</span>
      <span className="news" style={{ fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic', textAlign: 'right' }}>{dur}</span>
    </div>
  );
}

function LeaderboardScreen({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        <AppHeader/>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 32px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <span className="eyebrow">leaderboard · day #142</span>
              <h1 className="h2" style={{ marginTop: 6 }}>Today's hunt</h1>
              <div className="news" style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="pill knowledge">Roman Empire</span>
                <span className="arr" style={{ color: 'var(--ink-3)' }}>→</span>
                <span className="pill" style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}>Pliny the Elder</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label">resets in</div>
              <div className="num" style={{ fontSize: 22, marginTop: 2 }}>04:23:11</div>
            </div>
          </div>

          {/* CHAMPION CARD */}
          <div className="card butter" style={{ padding: 26, marginTop: 28, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', borderRadius: 16 }}>
            <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
              <span className="av xl" style={{ width: 96, height: 96, fontSize: 48, background: 'var(--surface)', border: '3px solid var(--ink)' }}>😎</span>
              <div>
                <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>👑 day's champion</span>
                <h2 className="h2" style={{ marginTop: 2 }}>jpdev</h2>
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  <span><span className="label">steps</span><div className="num" style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>4</div></span>
                  <span><span className="label">time</span><div className="num" style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>0:42</div></span>
                  <span><span className="label">finished</span><div className="news ital" style={{ fontSize: 16, lineHeight: 1, marginTop: 4 }}>3h ago</div></span>
                </div>
              </div>
            </div>
            <div className="serif" style={{ fontSize: 80, lineHeight: 1, opacity: .35 }}>1</div>
          </div>

          {/* TABS + TABLE */}
          <div style={{ marginTop: 28 }}>
            <LbTabsBar active="today"/>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 100px', gap: 12, padding: '10px 8px', background: 'var(--bg-2)' }}>
                <span className="label" style={{ textAlign: 'center' }}>#</span>
                <span className="label">player</span>
                <span className="label" style={{ textAlign: 'right' }}>steps</span>
                <span className="label" style={{ textAlign: 'right' }}>time</span>
                <span className="label" style={{ textAlign: 'right' }}>when</span>
              </div>
              <LbRow rank="🥇" emoji="😎" name="jpdev" steps="4" time="0:42" dur="3h ago" top3/>
              <LbRow rank="🥈" emoji="🦊" name="sam" steps="4" time="0:51" dur="5h ago" top3/>
              <LbRow rank="🥉" emoji="🐙" name="lia" steps="5" time="0:38" dur="2h ago" top3/>
              <LbRow rank="4" emoji="🦄" name="max" steps="5" time="0:48" dur="6h ago"/>
              <LbRow rank="5" emoji="🐢" name="ana" steps="5" time="1:02" dur="9h ago"/>
              <LbRow rank="·" emoji="🐝" name="you" steps="6" time="1:22" dur="just now" me/>
              <LbRow rank="7" emoji="🦉" name="mei" steps="6" time="1:11" dur="11h ago"/>
              <LbRow rank="8" emoji="🐳" name="leo" steps="6" time="2:04" dur="4h ago"/>
            </div>
          </div>
        </div>
      </div>
    </MF>
  );
}

Object.assign(window, { LeaderboardScreen });
