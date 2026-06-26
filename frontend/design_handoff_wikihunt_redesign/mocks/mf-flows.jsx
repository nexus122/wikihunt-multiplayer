// Mid-fi — missing flows
// SoloGame, JoinTransition, ChallengeInvite, UserDropdown, ConfirmModal (give up / leave), HowToPlay

// ---- SOLO GAME ----
// Like Game but no players sidebar; stats live in a top bar; full-width article.
function SoloGame({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppHeader context="solo" back/>
        {/* STATS BAR */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: 20,
          alignItems: 'center', padding: '14px 28px', borderBottom: '1px solid var(--rule)',
          background: 'var(--bg-2)',
        }}>
          <div className="card coral" style={{ padding: '8px 16px', borderRadius: 10, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,.85)' }}>🎯</span>
            <span className="serif" style={{ fontSize: 22, color: '#fff', fontWeight: 500 }}>Pliny <span className="ital">the Elder</span></span>
          </div>
          <div className="news ital" style={{ fontSize: 13, color: 'var(--ink-3)' }}>at <span style={{ color: 'var(--ink-2)' }}>Roman Empire</span></div>
          <div style={{ textAlign: 'center' }}>
            <div className="label">steps</div>
            <div className="num" style={{ fontSize: 28, lineHeight: 1 }}>4</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="label">time</div>
            <div className="num" style={{ fontSize: 28, lineHeight: 1 }}>1:23</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn sm ghost">← back</button>
            <button className="btn sm" style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}>give up</button>
          </div>
        </div>
        {/* ARTICLE */}
        <div style={{ flex: 1, minHeight: 0, padding: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 760, width: '100%' }}><WikiArticle/></div>
        </div>
      </div>
    </MF>
  );
}

// ---- JOIN TRANSITION (/join/:code) ----
function JoinTransition({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 30 }}>
        <Logo size={30}/>
        <div className="card" style={{ padding: '36px 44px', textAlign: 'center', borderRadius: 18, minWidth: 420 }}>
          <span className="eyebrow">joining room</span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
            {['A','B','C','D'].map((c,i) => (
              <div key={i} style={{
                width: 52, height: 64, borderRadius: 10, border: '1.5px solid var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono', fontSize: 34, fontWeight: 600, background: 'var(--bg-2)',
              }}>{c}</div>
            ))}
          </div>
          {/* loading dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 26 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 10, height: 10, borderRadius: '50%', background: 'var(--coral)',
                opacity: i === 1 ? 1 : .35,
              }}/>
            ))}
          </div>
          <div className="news ital" style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 18 }}>
            Finding the room and your seat…
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
            host: jpdev · 3 players inside
          </div>
        </div>
        <div className="news ital" style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          taking longer than usual? <span style={{ color: 'var(--coral)' }}>retry →</span>
        </div>
      </div>
    </MF>
  );
}

// ---- CHALLENGE INVITE LANDING (recipient opens a /c/:id link) ----
function ChallengeInvite({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        <AppHeader/>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="av coral lg">😎</span>
            </div>
            <span className="eyebrow">jpdev challenged you</span>
            <h1 className="h1" style={{ fontSize: 56, marginTop: 8, lineHeight: .95 }}>
              Can you <span className="ital" style={{ fontWeight: 500 }}>beat</span><br/>this hunt?
            </h1>
            {/* the route card */}
            <div className="card" style={{ padding: 28, marginTop: 26, borderColor: 'var(--ink)', borderWidth: 2 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <span className="label">start</span>
                <div className="serif" style={{ fontSize: 30, color: 'var(--bluek)', fontWeight: 500 }}>Roman Empire</div>
                <div className="mono" style={{ fontSize: 22, color: 'var(--ink-3)', margin: '2px 0' }}>↓</div>
                <span className="label">target</span>
                <div className="serif ital" style={{ fontSize: 30, color: 'var(--coral)', fontWeight: 500 }}>Pliny the Elder</div>
              </div>
              <div className="hr" style={{ margin: '20px 0' }}/>
              <div style={{ display: 'flex', justifycontent: 'center', gap: 24, justifyContent: 'center' }}>
                <span><span className="label">their best</span><div className="num" style={{ fontSize: 22 }}>4 steps</div></span>
                <span><span className="label">in</span><div className="num" style={{ fontSize: 22 }}>0:42</div></span>
              </div>
            </div>
            <button className="btn primary xl" style={{ width: '100%', marginTop: 22 }}>
              ▸ Accept the hunt
            </button>
            <div className="news ital" style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 12 }}>
              you'll play solo · no account needed
            </div>
          </div>
        </div>
      </div>
    </MF>
  );
}

// ---- HEADER USER DROPDOWN (expanded) ----
function UserDropdown({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppHeader/>
        {/* the dropdown, anchored top-right under the avatar */}
        <div style={{ position: 'absolute', top: 62, right: 24, width: 300 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14, boxShadow: 'var(--shadow)' }}>
            {/* identity */}
            <div style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center', background: 'var(--bg-2)' }}>
              <span className="av coral lg">😎</span>
              <div style={{ minWidth: 0 }}>
                <div className="h3" style={{ fontSize: 22 }}>jpdev</div>
                <div className="news ital" style={{ fontSize: 12, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>jp@gmail.com</div>
              </div>
            </div>
            {/* streak strip */}
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--rule)' }}>
              <span className="pill butter">🔥 12-day streak</span>
              <span className="num" style={{ fontSize: 13, color: 'var(--ink-3)' }}>83 games</span>
            </div>
            {/* links */}
            <div style={{ padding: 8 }}>
              {[['📅','Daily hunt'],['🏆','Leaderboard'],['🎨','Cosmetics']].map(([ico,l],i) => (
                <button key={i} className="btn ghost" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', gap: 12, padding: '10px 12px' }}>
                  <span style={{ fontSize: 16 }}>{ico}</span>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>{l}</span>
                  <span style={{ color: 'var(--ink-3)' }}>→</span>
                </button>
              ))}
            </div>
            {/* cosmetics inline preview */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--rule)' }}>
              <div className="label" style={{ marginBottom: 8 }}>quick cosmetics</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['😎','🦊','🐙','🦄','🐝'].map((e,i) => (
                  <span key={i} className={'av sm' + (i === 0 ? ' coral' : '')} style={{ cursor: 'pointer' }}>{e}</span>
                ))}
              </div>
            </div>
            <div className="hr"/>
            <button className="btn ghost" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px 18px', color: 'var(--coral)', gap: 12 }}>
              <span>↩</span><span style={{ fontWeight: 500 }}>Sign out</span>
            </button>
          </div>
        </div>
        {/* dim the page slightly to read the dropdown */}
        <div style={{ flex: 1, padding: 40, opacity: .4, pointerEvents: 'none' }}>
          <span className="eyebrow">home · behind the dropdown</span>
          <h1 className="h1" style={{ marginTop: 12 }}>Six clicks<br/><span className="ital">or less.</span></h1>
        </div>
      </div>
    </MF>
  );
}

// ---- CONFIRM MODALS (give up / leave) ----
function ConfirmModal({ dark = false, variant = 'giveup' }) {
  const isGiveUp = variant === 'giveup';
  return (
    <MF dark={dark} style={{ background: dark ? 'rgba(15,18,32,.85)' : 'rgba(26,30,46,.4)' }}>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <div className="card" style={{ width: 420, padding: 26, borderRadius: 16, textAlign: 'center', boxShadow: 'var(--shadow-lg, 0 30px 80px -20px rgba(0,0,0,.55))' }}>
          <div style={{ fontSize: 40 }}>{isGiveUp ? '🏳️' : '🚪'}</div>
          <h2 className="h3" style={{ marginTop: 8 }}>
            {isGiveUp ? <>Give up the hunt?</> : <>Leave the room?</>}
          </h2>
          <p className="news" style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8 }}>
            {isGiveUp
              ? "You're 4 steps in. Giving up counts as a loss on the board and you can't rejoin this round."
              : "The game is still running. If you leave now your spot opens up and your progress is lost."}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="btn ghost lg" style={{ flex: 1 }}>← keep going</button>
            <button className="btn lg" style={{ flex: 1, background: 'var(--coral)', color: '#fff', borderColor: 'var(--coral)' }}>
              {isGiveUp ? 'Give up' : 'Leave'}
            </button>
          </div>
        </div>
      </div>
    </MF>
  );
}

// ---- HOW TO PLAY ----
function HowToPlay({ dark = false }) {
  const steps = [
    ['1', '📄', 'Start on an article', 'Everyone begins on the same Wikipedia page.'],
    ['2', '🔗', 'Follow the links', 'Click only the blue links inside each article to travel.'],
    ['3', '🎯', 'Reach the target', 'Find your way to the target page — coral, top of your HUD.'],
    ['4', '🏆', 'Fewest clicks wins', 'First to arrive, or the lowest step count, takes the round.'],
  ];
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        <AppHeader context="how to play" back/>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 32px', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <span className="eyebrow">the rules · 30 seconds</span>
            <h1 className="h1" style={{ fontSize: 60, marginTop: 8 }}>
              Race friends through<br/><span className="ital" style={{ fontWeight: 500, color: 'var(--coral)' }}>Wikipedia.</span>
            </h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 32 }}>
            {steps.map(([n, ico, title, body]) => (
              <div key={n} className="card" style={{ padding: 22, display: 'flex', gap: 16 }}>
                <div className="serif" style={{ fontSize: 44, color: 'var(--coral)', lineHeight: 1, width: 40 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{ico}</div>
                  <h3 className="h4" style={{ fontFamily: 'var(--font-display, serif)', fontSize: 22 }}>{title}</h3>
                  <p className="news" style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 4 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="card tint" style={{ padding: 20, marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 28 }}>💡</span>
            <div className="news" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
              <b style={{ color: 'var(--ink)' }}>Pro tip:</b> broad pages (countries, centuries, "List of…") are hubs — they link almost everywhere. Aim for one early.
            </div>
          </div>
          <button className="btn primary xl" style={{ display: 'block', margin: '24px auto 0', minWidth: 260 }}>
            ▸ Got it, let's play
          </button>
        </div>
      </div>
    </MF>
  );
}

Object.assign(window, { SoloGame, JoinTransition, ChallengeInvite, UserDropdown, ConfirmModal, HowToPlay });
