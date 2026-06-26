// Mid-fi kit: brand tokens, theme system, logo, primitives, shared components.
// Light = paper/ink. Dark = navy ink with cream foreground.
// Components consume CSS vars so a single .mf.dark switch flips everything.

(function inject() {
  if (document.getElementById('mf-css')) return;
  const s = document.createElement('style');
  s.id = 'mf-css';
  s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

.mf {
  --bg:           #f6f1e6;
  --bg-2:         #efe7d4;
  --bg-3:         #e7dcc1;
  --surface:      #fbf7ec;
  --ink:          #1a1e2e;
  --ink-2:        #3d4256;
  --ink-3:        #7a7e8f;
  --rule:         #d8cfb8;
  --rule-2:       #c6bb9d;
  --coral:        #ff5a3c;
  --coral-2:      #e64a2d;
  --coral-soft:   #ffe2d8;
  --bluek:        #1a3a8c;
  --bluek-soft:   #dbe2f5;
  --butter:       #ffd84a;
  --butter-deep:  #b58c00;
  --shadow:       0 1px 0 rgba(26,30,46,.04), 0 6px 24px -10px rgba(26,30,46,.18);
  --ring:         0 0 0 3px rgba(255,90,60,.22);
  position:relative;width:100%;height:100%;overflow:hidden;
  background:var(--bg);color:var(--ink);
  font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.45;
}
.mf.dark {
  --bg:           #0f1220;
  --bg-2:         #161a30;
  --bg-3:         #1f243f;
  --surface:      #181c33;
  --ink:          #f0ebde;
  --ink-2:        #b9b4a5;
  --ink-3:        #7a7e8f;
  --rule:         #2a2f4a;
  --rule-2:       #3a4060;
  --coral:        #ff6b50;
  --coral-2:      #ff8268;
  --coral-soft:   #3a1e1a;
  --bluek:        #6f8eff;
  --bluek-soft:   #1c2645;
  --butter:       #ffd84a;
  --butter-deep:  #ffd84a;
  --shadow:       0 1px 0 rgba(0,0,0,.3), 0 8px 28px -10px rgba(0,0,0,.6);
}
.mf *{box-sizing:border-box}
.mf .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-0.01em}
.mf .news{font-family:'Newsreader',Georgia,serif}
.mf .mono{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace}
.mf .ital{font-style:italic}
.mf h1,.mf h2,.mf h3{margin:0;font-weight:400}
.mf .h1{font-family:'Instrument Serif',serif;font-size:80px;line-height:.92;letter-spacing:-0.02em}
.mf .h2{font-family:'Instrument Serif',serif;font-size:44px;line-height:1;letter-spacing:-0.015em}
.mf .h3{font-family:'Instrument Serif',serif;font-size:28px;line-height:1.05}
.mf .eyebrow{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--coral);font-weight:500}
.mf .label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);font-weight:500}
.mf .muted{color:var(--ink-3)}
.mf .ink-2{color:var(--ink-2)}

/* logo */
.mf .logo{font-family:'Instrument Serif',serif;letter-spacing:-0.02em;display:inline-flex;align-items:baseline;line-height:1;color:var(--ink);user-select:none}
.mf .logo .bk{color:var(--coral);font-weight:400}
.mf .logo .hunt{font-style:italic;font-weight:600}

/* button */
.mf .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:11px 18px;border-radius:8px;border:1.5px solid var(--ink);
  background:transparent;color:var(--ink);font-family:Inter;font-weight:600;font-size:14px;
  cursor:pointer;transition:transform .12s ease,background .15s ease,box-shadow .15s ease;text-decoration:none;white-space:nowrap}
.mf .btn:hover{transform:translateY(-1px)}
.mf .btn.primary{background:var(--coral);border-color:var(--coral);color:#fff}
.mf .btn.primary:hover{background:var(--coral-2);border-color:var(--coral-2);box-shadow:var(--ring)}
.mf .btn.ghost{border-color:var(--rule-2);color:var(--ink-2)}
.mf .btn.lg{padding:14px 22px;font-size:16px;border-radius:10px}
.mf .btn.xl{padding:16px 26px;font-size:17px;border-radius:10px}
.mf .btn.sm{padding:6px 10px;font-size:12px;border-radius:6px}

/* card */
.mf .card{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:20px;box-shadow:var(--shadow)}
.mf .card.flat{box-shadow:none}
.mf .card.coral{background:var(--coral);color:#fff;border-color:var(--coral)}
.mf .card.coral .label{color:rgba(255,255,255,.7)}
.mf .card.coral .eyebrow{color:rgba(255,255,255,.85)}
.mf .card.tint{background:var(--coral-soft);border-color:var(--coral-soft)}
.mf .card.knowledge{background:var(--bluek-soft);border-color:var(--bluek-soft)}
.mf .card.butter{background:var(--butter);color:var(--ink);border-color:var(--butter)}

/* divider */
.mf .hr{height:1px;background:var(--rule);width:100%;border:0;margin:0}
.mf .hrd{height:0;border:0;border-top:1px dashed var(--rule-2);width:100%}

/* input */
.mf .input{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;
  border:1.5px solid var(--rule-2);background:var(--surface);color:var(--ink);
  font-family:Inter;font-size:14px;min-height:42px}
.mf .input:focus-within{border-color:var(--coral);box-shadow:var(--ring)}
.mf .input input{flex:1;border:0;outline:none;background:transparent;color:inherit;font:inherit;width:100%}
.mf .input.lg{padding:14px 16px;font-size:16px;min-height:50px}

/* pill / chip */
.mf .pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;
  font-size:12px;font-weight:500;background:var(--bg-2);color:var(--ink-2);border:1px solid var(--rule)}
.mf .pill.coral{background:var(--coral);color:#fff;border-color:var(--coral)}
.mf .pill.knowledge{background:var(--bluek-soft);color:var(--bluek);border-color:transparent}
.mf .pill.butter{background:var(--butter);color:var(--ink);border-color:transparent}
.mf .pill.ghost{background:transparent}
.mf .pill.live::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--coral);box-shadow:0 0 0 3px rgba(255,90,60,.25);animation:mfpulse 2s infinite}
@keyframes mfpulse{50%{box-shadow:0 0 0 5px rgba(255,90,60,0)}}

/* avatar */
.mf .av{width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;
  font-size:16px;background:var(--bg-2);border:1.5px solid var(--rule);flex:0 0 auto}
.mf .av.coral{background:var(--coral);color:#fff;border-color:var(--coral)}
.mf .av.butter{background:var(--butter);border-color:var(--butter)}
.mf .av.lg{width:48px;height:48px;font-size:24px}
.mf .av.xl{width:72px;height:72px;font-size:36px}
.mf .av.sm{width:24px;height:24px;font-size:13px}

/* number display */
.mf .num{font-family:'JetBrains Mono',monospace;font-weight:500;font-variant-numeric:tabular-nums}

/* header */
.mf .hd{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-bottom:1px solid var(--rule);background:var(--bg)}
.mf .hd .right{display:flex;align-items:center;gap:10px}
.mf .iconbtn{width:34px;height:34px;border-radius:8px;background:transparent;border:1px solid transparent;
  color:var(--ink-2);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px}
.mf .iconbtn:hover{background:var(--bg-2);color:var(--ink)}

/* route display (start → target) */
.mf .route{display:flex;align-items:center;gap:10px}
.mf .route .pg{flex:1;padding:10px 14px;border-radius:8px;border:1.5px solid;font-weight:500}
.mf .route .pg.start{background:var(--bluek-soft);border-color:transparent;color:var(--bluek)}
.mf .route .pg.target{background:var(--coral-soft);border-color:transparent;color:var(--coral)}
.mf .route .arr{color:var(--ink-3);font-family:'JetBrains Mono',monospace}

/* mode card */
.mf .mode{display:flex;flex-direction:column;gap:8px;padding:18px;border-radius:14px;
  border:1px solid var(--rule);background:var(--surface);cursor:pointer;
  transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease;position:relative;overflow:hidden}
.mf .mode:hover{transform:translateY(-2px);box-shadow:var(--shadow);border-color:var(--rule-2)}
.mf .mode .ico{font-size:28px;line-height:1}
.mf .mode h3{font-family:'Instrument Serif',serif;font-size:22px;line-height:1.05;letter-spacing:-0.01em}
.mf .mode .tag{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}

/* wiki article-ish */
.mf .article{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:24px 28px;overflow:hidden;font-family:'Newsreader',Georgia,serif;font-size:15px;line-height:1.55;color:var(--ink)}
.mf .article h2{font-family:'Newsreader',Georgia,serif;font-size:28px;font-weight:600;margin:0 0 12px;border-bottom:1px solid var(--rule);padding-bottom:8px}
.mf .article p{margin:0 0 12px}
.mf .article a{color:var(--bluek);text-decoration:none;border-bottom:1px solid transparent}
.mf .article a:hover{border-bottom-color:var(--bluek)}
.mf .article mark{background:var(--butter);padding:1px 2px;border-radius:2px}
  `;
  document.head.appendChild(s);
})();

// Logo component
function Logo({ size = 24, mono = false }) {
  return (
    <span className="logo" style={{ fontSize: size }}>
      <span className="bk">[[</span>
      <span>Wiki</span>
      <span className="hunt">Hunt</span>
      <span className="bk">]]</span>
    </span>
  );
}

// Theme wrapper — applies vars
function MF({ dark = false, children, style }) {
  return (
    <div className={'mf' + (dark ? ' dark' : '')} style={style}>
      {children}
    </div>
  );
}

// App header
function AppHeader({ context = null, user = '😎', name = 'jpdev', back = false }) {
  return (
    <header className="hd">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {back && <button className="iconbtn">←</button>}
        <Logo size={22}/>
        {context && (<>
          <span style={{ color: 'var(--ink-3)' }}>/</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{context}</span>
        </>)}
      </div>
      <div className="right">
        <button className="iconbtn mono" style={{ fontSize: 11, width: 'auto', padding: '0 10px' }}>EN</button>
        <button className="iconbtn">☾</button>
        <button className="pill" style={{ padding: '4px 10px 4px 4px', border: '1px solid var(--rule)', background: 'var(--surface)', cursor: 'pointer' }}>
          <span className="av coral sm">{user}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
        </button>
      </div>
    </header>
  );
}

// Route component (start → target)
function RouteDisplay({ start = 'Roman Empire', target = 'Pliny the Elder' }) {
  return (
    <div className="route">
      <span className="pg start">{start}</span>
      <span className="arr">→</span>
      <span className="pg target">{target}</span>
    </div>
  );
}

Object.assign(window, { Logo, MF, AppHeader, RouteDisplay });
