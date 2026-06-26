// Mid-fi Game — article reading area + left sidebar HUD
// Target = HERO, mono stats, live player list

function WikiArticle() {
  return (
    <div className="article" style={{ height: '100%' }}>
      <h2>Roman Empire</h2>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic', borderBottom: '1px solid var(--rule)', paddingBottom: 8, marginBottom: 14 }}>
        From Wikipedia, the free encyclopedia
      </p>
      <p>
        The <a>Roman Empire</a> was the post-Republican state of <a>ancient Rome</a>. It included
        <a> territory</a> around the <a>Mediterranean</a> in <a>Europe</a>, <a>North Africa</a>,
        and <a>Western Asia</a>. The Empire was ruled by <a>emperors</a>, and after the reign of
        <a> Augustus</a> it lasted nearly five centuries until the fall of the <a>Western Roman Empire</a>.
      </p>
      <p>
        <a>Naturalists</a> of the era included <mark><a>Pliny the Elder</a></mark>, whose
        <a> Naturalis Historia</a> remains a standard reference for the natural sciences as
        understood in the <a>1st century</a>. The empire's <a>roads</a>, <a>aqueducts</a>, and
        <a>monumental architecture</a> persisted long after its political collapse.
      </p>
      <p>
        Following the <a>Crisis of the Third Century</a>, <a>Diocletian</a> reorganised the empire
        into the <a>Tetrarchy</a>; under <a>Constantine the Great</a> the capital moved east to
        <a> Constantinople</a>, ushering in what historians call the <a>Byzantine Empire</a>.
      </p>
      <p>
        The empire's lasting influence on <a>law</a>, <a>language</a>, <a>religion</a> and
        <a>architecture</a> is studied today across virtually every modern discipline.
      </p>
    </div>
  );
}

function GameScreen({ dark = false }) {
  return (
    <MF dark={dark}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppHeader context="game · ABCD-42" back/>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, padding: 20, flex: 1, minHeight: 0 }}>
          {/* SIDEBAR */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* TARGET — hero */}
            <div className="card coral" style={{ padding: 18 }}>
              <span className="eyebrow" style={{ color: 'rgba(255,255,255,.85)' }}>🎯 your target</span>
              <h2 className="h3" style={{ color: '#fff', marginTop: 4, fontSize: 32, lineHeight: 1, fontWeight: 500 }}>
                Pliny<br/>
                <span className="ital">the Elder</span>
              </h2>
              <div className="news" style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, marginTop: 10, fontStyle: 'italic' }}>
                roman author · naturalist · 23–79 AD
              </div>
            </div>
            {/* STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="card" style={{ padding: 14, textAlign: 'center' }}>
                <div className="label">steps</div>
                <div className="num" style={{ fontSize: 40, lineHeight: 1, marginTop: 4 }}>4</div>
              </div>
              <div className="card" style={{ padding: 14, textAlign: 'center' }}>
                <div className="label">time</div>
                <div className="num" style={{ fontSize: 40, lineHeight: 1, marginTop: 4 }}>1:23</div>
              </div>
            </div>
            {/* CURRENT */}
            <div className="card flat" style={{ background: 'var(--bg-2)', padding: '10px 14px', border: 'none' }}>
              <div className="label">currently at</div>
              <div className="news" style={{ fontSize: 16, marginTop: 2 }}>Roman Empire</div>
            </div>
            {/* PLAYERS */}
            <div className="card" style={{ padding: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>players · live</div>
              {[
                ['😎','jpdev','4','at Roman Empire',true],
                ['🦊','sam','3','at Augustus'],
                ['🐙','lia','5','at Mediterranean'],
                ['🦄','max','—','still on Start'],
              ].map(([e,n,s,where,me],i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i ? '1px dashed var(--rule)' : 'none' }}>
                  <span className={'av sm' + (me ? ' coral' : '')}>{e}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: me ? 600 : 500 }}>{n}{me && <span className="mono" style={{ fontSize: 10, marginLeft: 6, color: 'var(--ink-3)' }}>· you</span>}</div>
                    <div className="news" style={{ fontSize: 11, color: 'var(--ink-3)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{where}</div>
                  </div>
                  <span className="num" style={{ fontSize: 14, color: 'var(--ink-2)' }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn sm ghost" style={{ flex: 1 }}>↩ leave</button>
              <button className="btn sm" style={{ flex: 1, color: 'var(--coral)', borderColor: 'var(--coral)' }}>give up</button>
            </div>
          </aside>
          {/* MAIN ARTICLE */}
          <main style={{ minHeight: 0, position: 'relative' }}>
            <WikiArticle/>
          </main>
        </div>
      </div>
    </MF>
  );
}

Object.assign(window, { GameScreen, WikiArticle });
