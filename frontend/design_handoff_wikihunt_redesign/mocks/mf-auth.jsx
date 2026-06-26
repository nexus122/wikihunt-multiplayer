// Mid-fi Auth (sign in) + Setup profile with cosmetics picker

function AuthScreen({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppHeader back/>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
          {/* LEFT — editorial intro */}
          <div style={{ padding: '60px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--rule)', background: 'var(--bg-2)' }}>
            <span className="eyebrow">welcome back</span>
            <h1 className="h1" style={{ marginTop: 14, fontSize: 64, lineHeight: .95 }}>
              Sign in<br/>
              <span className="ital" style={{ fontWeight: 500 }}>to keep</span><br/>
              your streak.
            </h1>
            <p className="news" style={{ fontSize: 17, color: 'var(--ink-2)', marginTop: 18, maxWidth: 360, lineHeight: 1.45 }}>
              Guest mode works fine — but if you want your daily streak, leaderboards
              and saved cosmetics, sign in. No password required.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 28, alignItems: 'center' }}>
              <span className="av lg butter" style={{ width: 56, height: 56 }}>🔥</span>
              <div>
                <div className="num" style={{ fontSize: 22, lineHeight: 1 }}>12-day streak</div>
                <div className="news ital" style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>your last login on this device</div>
              </div>
            </div>
          </div>
          {/* RIGHT — form */}
          <div style={{ padding: '60px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ maxWidth: 360, width: '100%', alignSelf: 'center' }}>
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', padding: 4, borderRadius: 10, marginBottom: 22 }}>
                <button className="btn sm" style={{ flex: 1, background: 'var(--surface)', boxShadow: 'var(--shadow)', borderColor: 'transparent' }}>Sign in</button>
                <button className="btn sm ghost" style={{ flex: 1, borderColor: 'transparent' }}>Create account</button>
              </div>
              <button className="btn lg" style={{ width: '100%', justifyContent: 'flex-start', gap: 14 }}>
                <span style={{ fontSize: 18 }}>🇬</span>
                <span style={{ flex: 1, textAlign: 'left' }}>Continue with Google</span>
                <span style={{ color: 'var(--ink-3)' }}>→</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }}/>
                <span className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)' }}>or with email</span>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }}/>
              </div>
              <div className="label">email</div>
              <div className="input lg" style={{ marginTop: 6 }}>
                <input placeholder="you@example.com" defaultValue="jp@gmail.com"/>
              </div>
              <button className="btn primary lg" style={{ width: '100%', marginTop: 14 }}>
                ✉ Send magic link
              </button>
              <div className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 14, textAlign: 'center' }}>
                we'll email you a one-tap link. no passwords here.
              </div>
              <div style={{ marginTop: 28, padding: 14, border: '1px dashed var(--rule-2)', borderRadius: 8, textAlign: 'center' }}>
                <span className="news ital" style={{ fontSize: 13, color: 'var(--ink-2)' }}>or just</span>
                <button className="btn sm ghost" style={{ marginLeft: 6 }}>play as guest →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MF>
  );
}

const AVATARS = ['😎','🦊','🐙','🦄','🐝','🐢','🦉','🐳','🦁','👾','🐝','🦅','🦊','🐻','🐧','🐰'];
const COLORS = [
  ['coral','#ff5a3c'],
  ['orange','#ff9500'],
  ['butter','#ffd84a'],
  ['mint','#7ec27a'],
  ['cyan','#0fb3c9'],
  ['blue','#1a3a8c'],
  ['violet','#7c5cff'],
  ['rose','#ff5b8a'],
];

function SetupScreen({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppHeader context="step 2 of 2"/>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 32px', width: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ textAlign: 'center' }}>
            <span className="eyebrow">welcome · pick your look</span>
            <h1 className="h2" style={{ marginTop: 6 }}>
              How should we <span className="ital">show you</span>?
            </h1>
            <p className="news" style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 4 }}>
              Your avatar &amp; color appear next to your name in every game.
            </p>
          </div>

          {/* PREVIEW */}
          <div className="card" style={{ padding: 26, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'center' }}>
            <span className="av xl coral" style={{ width: 96, height: 96, fontSize: 48 }}>😎</span>
            <div>
              <span className="label">live preview</span>
              <h3 className="h3" style={{ marginTop: 2 }}>jpdev</h3>
              <div className="news ital" style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                this is how friends see you in lobby, game and leaderboard
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <span className="pill coral">you</span>
                <span className="pill knowledge">just joined</span>
              </div>
            </div>
          </div>

          {/* NICKNAME */}
          <div className="card" style={{ padding: 22 }}>
            <div className="label">nickname</div>
            <div className="input lg" style={{ marginTop: 6 }}>
              <input defaultValue="jpdev"/>
              <span className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)' }}>3-16 chars</span>
            </div>
          </div>

          {/* EMOJI PICKER */}
          <div className="card" style={{ padding: 22 }}>
            <div className="label">avatar emoji</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, marginTop: 10 }}>
              {AVATARS.slice(0, 16).map((e, i) => (
                <button key={i} style={{
                  width: '100%', aspectRatio: '1/1', borderRadius: 10, fontSize: 22, cursor: 'pointer',
                  background: i === 0 ? 'var(--coral-soft)' : 'var(--bg-2)',
                  border: i === 0 ? '2px solid var(--coral)' : '1.5px solid transparent',
                  fontFamily: 'inherit',
                }}>{e}</button>
              ))}
            </div>
          </div>

          {/* COLOR PICKER */}
          <div className="card" style={{ padding: 22 }}>
            <div className="label">accent color</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              {COLORS.map(([n, c], i) => (
                <button key={n} style={{
                  width: 56, height: 56, borderRadius: '50%', background: c,
                  border: i === 0 ? '3px solid var(--ink)' : '1.5px solid var(--rule)',
                  cursor: 'pointer', position: 'relative',
                  boxShadow: i === 0 ? '0 0 0 4px var(--surface) inset' : 'none',
                }}/>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button className="btn ghost lg" style={{ flex: 1 }}>← back</button>
            <button className="btn primary xl" style={{ flex: 2 }}>▸ Start hunting</button>
          </div>
        </div>
      </div>
    </MF>
  );
}

Object.assign(window, { AuthScreen, SetupScreen });
