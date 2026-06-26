// Mid-fi Challenge creator — two-step pick → generated share card

function ChallengeScreen({ dark = false, shared = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        <AppHeader context="challenge" back/>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px', width: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <span className="eyebrow">challenge · build a hunt</span>
            <h1 className="h2" style={{ marginTop: 6 }}>
              {shared ? <>Your hunt is <span className="ital">live.</span></> : <>Pick two pages.</>}
            </h1>
            <p className="news" style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 6, maxWidth: 480 }}>
              {shared
                ? "Send the link. They play solo and you get a notification when they finish."
                : "Choose a start and a target. We generate a link you can share — they play solo and try to beat your route."}
            </p>
          </div>

          {!shared && (<>
            {/* START */}
            <div className="card" style={{ padding: 22 }}>
              <span className="label">start page</span>
              <div className="input lg" style={{ marginTop: 8 }}>
                <span style={{ color: 'var(--ink-3)' }}>🔍</span>
                <input placeholder="search Wikipedia…" defaultValue="Roman Empire"/>
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="pill knowledge" style={{ padding: '6px 12px' }}>Roman Empire ✕</span>
              </div>
            </div>
            {/* TARGET */}
            <div className="card" style={{ padding: 22 }}>
              <span className="label">target page</span>
              <div className="input lg" style={{ marginTop: 8 }}>
                <span style={{ color: 'var(--ink-3)' }}>🎯</span>
                <input placeholder="search Wikipedia…" defaultValue="Pliny the Elder"/>
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="pill" style={{ background: 'var(--coral-soft)', color: 'var(--coral)', padding: '6px 12px' }}>Pliny the Elder ✕</span>
              </div>
            </div>
            {/* PREVIEW */}
            <div className="card tint" style={{ padding: 22 }}>
              <span className="label" style={{ color: 'var(--coral-2)' }}>preview</span>
              <div style={{ marginTop: 8 }}><RouteDisplay/></div>
              <div className="news ital" style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 10 }}>
                est. difficulty <b style={{ color: 'var(--ink-2)' }}>· medium</b> · friends solved similar in 5-7 steps
              </div>
            </div>
            <button className="btn primary xl" style={{ alignSelf: 'center', minWidth: 280 }}>
              ⚡ Generate link
            </button>
          </>)}

          {shared && (<>
            {/* CARD AFTER SHARE — screenshot-bait */}
            <div className="card" style={{ padding: 28, textAlign: 'center', borderColor: 'var(--ink)', borderWidth: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Logo size={18}/>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>challenge #RtX7</span>
              </div>
              <span className="eyebrow">a hunt from</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, marginBottom: 18 }}>
                <span className="av coral sm">😎</span>
                <span style={{ fontWeight: 600 }}>jpdev</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <span className="label">start</span>
                <div className="serif" style={{ fontSize: 30, color: 'var(--bluek)', fontWeight: 500 }}>Roman Empire</div>
                <div className="mono" style={{ fontSize: 22, color: 'var(--ink-3)', margin: '4px 0' }}>↓</div>
                <span className="label">target</span>
                <div className="serif ital" style={{ fontSize: 30, color: 'var(--coral)', fontWeight: 500 }}>Pliny the Elder</div>
              </div>
              <div className="hr" style={{ margin: '20px 0' }}/>
              <div className="news ital" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                "I did it in 4 steps. Beat me."
              </div>
            </div>
            <div className="card" style={{ padding: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="mono" style={{ flex: 1, fontSize: 13, padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                wikihunt.vercel.app/c/RtX7
              </span>
              <button className="btn primary">📋 Copy link</button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" style={{ flex: 1 }}>🐦 Tweet it</button>
              <button className="btn" style={{ flex: 1 }}>💬 WhatsApp</button>
              <button className="btn" style={{ flex: 1 }}>✉ Email</button>
            </div>
          </>)}
        </div>
      </div>
    </MF>
  );
}

Object.assign(window, { ChallengeScreen });
