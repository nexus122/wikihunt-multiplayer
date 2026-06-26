// Mid-fi end-of-game modal + mobile Game HUD

function EndGameModal({ dark = false }) {
  return (
    <MF dark={dark} style={{ background: dark ? 'rgba(15,18,32,.85)' : 'rgba(26,30,46,.4)' }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <div className="card" style={{ width: 540, padding: 28, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,.55)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 4 }}>🏁</div>
            <span className="eyebrow">hunt complete</span>
            <h1 className="h2" style={{ marginTop: 4 }}>
              <span className="ital">You</span> got there first.
            </h1>
            <div className="news" style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 6 }}>
              4 steps · 0:42 · 3 others still hunting
            </div>
          </div>

          {/* PATH TAKEN */}
          <div className="card flat" style={{ background: 'var(--bg-2)', border: 'none', padding: 14, marginTop: 18 }}>
            <span className="label">your path</span>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', lineHeight: 1.6 }}>
              {['Roman Empire','Augustus','Naturalis Historia','Pliny the Elder'].map((p, i, a) => (
                <React.Fragment key={i}>
                  <span className="news" style={{
                    padding: '4px 10px', borderRadius: 6, background: 'var(--surface)',
                    color: i === a.length - 1 ? 'var(--coral)' : 'var(--ink)',
                    fontStyle: i === a.length - 1 ? 'italic' : 'normal',
                    fontWeight: i === a.length - 1 ? 600 : 400,
                    fontSize: 14,
                  }}>{p}</span>
                  {i < a.length - 1 && <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 12 }}>→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* RESULTS TABLE */}
          <div style={{ marginTop: 18 }}>
            <div className="label" style={{ marginBottom: 6 }}>results</div>
            {[
              ['🥇','😎','jpdev','4','0:42',true,'done'],
              ['🥈','🦊','sam','5','0:58',false,'done'],
              ['·','🐙','lia','—','—',false,'hunting · at Mediterranean'],
              ['·','🦄','max','—','—',false,'hunting · at Augustus'],
            ].map(([r,e,n,s,t,me,note], i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '28px 32px 1fr auto auto', alignItems: 'center', gap: 10,
                padding: '10px 6px', borderTop: i ? '1px solid var(--rule)' : 'none',
                background: me ? 'var(--coral-soft)' : 'transparent',
              }}>
                <span className="serif" style={{ fontSize: 18, textAlign: 'center', color: 'var(--ink-3)' }}>{r}</span>
                <span className={'av sm' + (me ? ' coral' : '')}>{e}</span>
                <div>
                  <div style={{ fontWeight: me ? 600 : 500, fontSize: 14 }}>{n}{me && <span className="mono" style={{ fontSize: 10, marginLeft: 6, color: 'var(--ink-3)' }}>· you</span>}</div>
                  <div className="news ital" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{note}</div>
                </div>
                <span className="num" style={{ textAlign: 'right' }}>{s}</span>
                <span className="num" style={{ textAlign: 'right', minWidth: 40 }}>{t}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn ghost lg" style={{ flex: 1 }}>🔁 Play again</button>
            <button className="btn primary lg" style={{ flex: 1 }}>📤 Share result</button>
          </div>
          <button className="btn sm ghost" style={{ width: '100%', marginTop: 8, borderColor: 'transparent' }}>← back to home</button>
        </div>
      </div>
    </MF>
  );
}

// MOBILE GAME — phone-shaped HUD
function MobileGame({ dark = false }) {
  return (
    <MF dark={dark} style={{ borderRadius: 28, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* status bar */}
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 18px', fontSize: 11, color: 'var(--ink-3)' }}>
          <span>9:41</span>
          <span>•••</span>
        </div>
        {/* sticky target top bar */}
        <div style={{ padding: '10px 14px', background: 'var(--coral)', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.14em', opacity: .8 }}>🎯 TARGET</div>
              <div className="serif" style={{ fontSize: 22, lineHeight: 1, fontWeight: 500 }}>Pliny <span className="ital">the Elder</span></div>
            </div>
            <button style={{
              background: 'rgba(255,255,255,.18)', color: '#fff', border: 0, padding: '6px 10px',
              borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: 'Inter',
            }}>leave</button>
          </div>
        </div>
        {/* stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--rule)', background: 'var(--surface)' }}>
          {[['steps','4'],['time','1:23'],['rank','1/4']].map(([k,v],i) => (
            <div key={i} style={{ textAlign: 'center', padding: 8, borderRight: i < 2 ? '1px solid var(--rule)' : 'none' }}>
              <div className="label">{k}</div>
              <div className="num" style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
        {/* mini article */}
        <div className="article" style={{ flex: 1, margin: 12, padding: 14, fontSize: 13, borderRadius: 8, overflow: 'hidden' }}>
          <h2 style={{ fontSize: 20, marginBottom: 8, paddingBottom: 6 }}>Roman Empire</h2>
          <p style={{ margin: '0 0 8px' }}>
            The <a>Roman Empire</a> was the post-Republican state of <a>ancient Rome</a>. Naturalists
            of the era included <mark><a>Pliny the Elder</a></mark>, whose <a>Naturalis Historia</a>…
          </p>
          <p style={{ margin: 0 }}>
            Following the <a>Crisis of the Third Century</a>, <a>Diocletian</a> reorganised the
            <a> empire</a> into the <a>Tetrarchy</a>; under <a>Constantine the Great</a> …
          </p>
        </div>
        {/* bottom action dock */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="iconbtn" style={{ border: '1px solid var(--rule)' }}>←</button>
          <div style={{ flex: 1, display: 'flex', gap: -2 }}>
            {['😎','🦊','🐙','🦄'].map((e,i) => (
              <span key={i} className={'av sm' + (i === 0 ? ' coral' : '')} style={{ marginLeft: i ? -8 : 0, border: '2px solid var(--bg)' }}>{e}</span>
            ))}
          </div>
          <button className="btn sm" style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}>give up</button>
        </div>
        {/* home indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: 6 }}>
          <div style={{ width: 100, height: 4, borderRadius: 2, background: 'var(--ink)', opacity: .4 }}/>
        </div>
      </div>
    </MF>
  );
}

Object.assign(window, { EndGameModal, MobileGame });
