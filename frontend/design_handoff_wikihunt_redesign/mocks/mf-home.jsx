// Mid-fi Home — multiplayer-first hero
// Layout: header / split hero (serif copy left + live MP card right) / mode grid / footer band

function HomeScreen({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        <AppHeader/>
        {/* HERO + LIVE MP */}
        <section style={{ padding: '56px 64px 32px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="pill live" style={{ background: 'transparent', border: '1px solid var(--rule)' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>142 games · right now</span>
              </span>
            </div>
            <h1 className="h1" style={{ marginTop: 18 }}>
              Race friends<br/>
              <span className="ital" style={{ fontWeight: 500 }}>through</span><br/>
              <span style={{ color: 'var(--coral)' }}>Wikipedia.</span>
            </h1>
            <p className="news" style={{ fontSize: 18, lineHeight: 1.4, color: 'var(--ink-2)', maxWidth: 460, marginTop: 18 }}>
              Start on one article. First to click into the target wins.
              Six clicks, usually less.
            </p>
          </div>
          {/* LIVE MP CARD */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow">multiplayer</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>2-8 players</span>
            </div>
            <h2 className="h3" style={{ marginTop: 6 }}>Play live</h2>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', padding: 4, borderRadius: 10, marginTop: 16 }}>
              <button className="btn sm" style={{ flex: 1, background: 'var(--surface)', borderColor: 'transparent', boxShadow: 'var(--shadow)', padding: '8px 12px' }}>+ Create room</button>
              <button className="btn sm ghost" style={{ flex: 1, borderColor: 'transparent', padding: '8px 12px' }}>Join code</button>
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="label" style={{ marginBottom: 6 }}>your nickname</div>
              <div className="input lg"><input defaultValue="jpdev"/></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <div style={{ display: 'flex', marginLeft: 4 }}>
                {['😎','🦊','🐙'].map((e,i) => (
                  <span key={i} className="av sm" style={{ marginLeft: i ? -8 : 0, border: '2px solid var(--surface)' }}>{e}</span>
                ))}
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>312 playing now</span>
            </div>
            <button className="btn primary lg" style={{ width: '100%', marginTop: 14 }}>
              ▸ Start room
            </button>
          </div>
        </section>

        {/* MODES */}
        <section style={{ padding: '20px 64px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="h3">Or play alone.</h2>
            <a className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>How to play →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
            {/* Daily — wider, accent */}
            <div className="mode butter" style={{ background: 'var(--butter)', borderColor: 'var(--butter)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="tag" style={{ color: 'var(--ink-2)' }}>daily · #142</span>
                  <h3 style={{ marginTop: 4 }}>Today's hunt</h3>
                </div>
                <span style={{ fontSize: 28 }}>🔥</span>
              </div>
              <div style={{ marginTop: 6 }} className="news">
                <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>same start &amp; target for everyone · keep your </span>
                <b>12-day streak</b>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 10, opacity: .8 }}>
                Roman Empire → Pliny the Elder
              </div>
            </div>
            <div className="mode">
              <span className="ico">⏱</span>
              <span className="tag">solo</span>
              <h3>Quick play</h3>
              <span className="news" style={{ color: 'var(--ink-2)', fontSize: 14 }}>random route. no clock. no pressure.</span>
            </div>
            <div className="mode">
              <span className="ico">🎯</span>
              <span className="tag">challenge</span>
              <h3>Build a hunt</h3>
              <span className="news" style={{ color: 'var(--ink-2)', fontSize: 14 }}>pick two pages. share a link.</span>
            </div>
          </div>
        </section>

        {/* FOOTER BAND */}
        <section style={{ padding: '18px 64px', borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>🏆 Leaderboard</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>📖 How to play</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>EN · ES</span>
          </div>
          <span className="news ital" style={{ fontSize: 13, color: 'var(--ink-3)' }}>made by <span style={{ color: 'var(--ink-2)' }}>jpdev</span> · ko-fi ☕</span>
        </section>
      </div>
    </MF>
  );
}

Object.assign(window, { HomeScreen });
