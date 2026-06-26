// Mid-fi Lobby — code spectacle + route + players + host settings

function LobbyScreen({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        <AppHeader context="lobby" back/>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 32px', width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'stretch' }}>
            {/* CODE + ROUTE */}
            <div className="card" style={{ padding: 26 }}>
              <span className="eyebrow">your room</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                {['A','B','C','D'].map((c,i) => (
                  <div key={i} style={{
                    width: 56, height: 68, borderRadius: 10, border: '1.5px solid var(--ink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'JetBrains Mono', fontSize: 36, fontWeight: 600,
                    background: 'var(--bg-2)',
                  }}>{c}</div>
                ))}
                <button className="iconbtn" style={{ marginLeft: 4, width: 'auto', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--rule)' }}>📋 Copy</button>
              </div>
              <div className="news ital" style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 12 }}>
                Share the code or invite link with friends. They join and you start.
              </div>
              <div className="hr" style={{ margin: '20px 0' }}/>
              <span className="label">today's route</span>
              <div style={{ marginTop: 8 }}><RouteDisplay/></div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <span className="pill coral">random</span>
                <span className="pill">custom</span>
                <span className="pill ghost" style={{ marginLeft: 'auto' }}>🔀 reroll</span>
              </div>
            </div>
            {/* PLAYERS */}
            <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="eyebrow">players</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>4 / 8</span>
              </div>
              <div style={{ marginTop: 12, flex: 1 }}>
                {[
                  ['😎','jpdev','host',true],
                  ['🦊','sam',null],
                  ['🐙','lia',null],
                  ['🦄','max','just joined'],
                ].map(([e,n,tag,me],i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? '1px dashed var(--rule)' : 'none' }}>
                    <span className={'av' + (me ? ' coral' : '')}>{e}</span>
                    <span style={{ flex: 1, fontWeight: me ? 600 : 500 }}>{n}</span>
                    {tag === 'host' && <span className="pill butter">host</span>}
                    {tag === 'just joined' && <span className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{tag}</span>}
                    {!tag && <span className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)' }}>ready</span>}
                  </div>
                ))}
                {/* empty slots */}
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px dashed var(--rule)', opacity: .5 }}>
                    <span className="av" style={{ background: 'transparent', borderStyle: 'dashed' }}>+</span>
                    <span className="news ital" style={{ fontSize: 13, color: 'var(--ink-3)' }}>waiting…</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* HOST SETTINGS */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="eyebrow">host settings</span>
              <span className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)' }}>only the host sees this</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 14 }}>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>grace time</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn sm ghost">0s</button>
                  <button className="btn sm" style={{ background: 'var(--ink)', color: 'var(--bg)', borderColor: 'var(--ink)' }}>10s</button>
                  <button className="btn sm ghost">30s</button>
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>wiki search</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn sm ghost">off</button>
                  <button className="btn sm" style={{ background: 'var(--ink)', color: 'var(--bg)', borderColor: 'var(--ink)' }}>on</button>
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>language</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn sm" style={{ background: 'var(--ink)', color: 'var(--bg)', borderColor: 'var(--ink)' }}>EN</button>
                  <button className="btn sm ghost">ES</button>
                </div>
              </div>
            </div>
          </div>

          <button className="btn primary xl" style={{ alignSelf: 'center', minWidth: 280 }}>
            ▸ Start the hunt
          </button>
        </div>
      </div>
    </MF>
  );
}

Object.assign(window, { LobbyScreen });
