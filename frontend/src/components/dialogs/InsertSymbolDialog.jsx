import { useState } from 'react';
import { useUIStore, useEditorStore } from '@/store';
import { Modal, Input, Label } from '@/components/ui';

const CATEGORIES = {
  'Common':    ['©','®','™','°','±','×','÷','≠','≤','≥','∞','√','∑','∏','∫','∂','∆','Ω','μ','π','λ','φ','ψ'],
  'Currency':  ['$','€','£','¥','₹','₿','¢','₩','₪','₦','₱','฿','₭','₡','₲'],
  'Arrows':    ['←','→','↑','↓','↔','↕','⇐','⇒','⇑','⇓','⇔','⇕','↩','↪','↰','↱','⤴','⤵'],
  'Bullets':   ['•','◦','▪','▫','■','□','●','○','◆','◇','★','☆','✓','✗','✦','✧','→','›'],
  'Brackets':  ['«','»','‹','›','„','"','"','‚',"'", "'",'‐','–','—','…','•','·','‑','‒'],
  'Math':      ['½','¼','¾','⅓','⅔','⅛','⅜','⅝','⅞','¹','²','³','⁴','₁','₂','₃','₄'],
  'Greek':     ['Α','Β','Γ','Δ','Ε','Ζ','Η','Θ','Ι','Κ','Λ','Μ','Ν','Ξ','Ο','Π','Ρ','Σ','Τ','Υ','Φ','Χ','Ψ','Ω','α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','ο','π','ρ','σ','τ','υ','φ','χ','ψ','ω'],
};

export function InsertSymbolDialog() {
  const { closeDialog } = useUIStore();
  const { editor }      = useEditorStore();
  const [search, setSearch]   = useState('');
  const [active, setActive]   = useState('Common');
  const [last,   setLast]     = useState(null);

  const insert = (sym) => {
    editor?.chain().focus().insertContent(sym).run();
    setLast(sym);
  };

  const filtered = search
    ? Object.values(CATEGORIES).flat().filter((s) => s.includes(search))
    : CATEGORIES[active] || [];

  return (
    <Modal title="Insert Symbol" onClose={() => closeDialog('insertSymbol')} width={500}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {/* Search */}
        <Input value={search} onChange={setSearch} placeholder="Search symbol…" autoFocus />

        {/* Category tabs */}
        {!search && (
          <div style={{ display:'flex', gap:0, flexWrap:'wrap', borderBottom:'1px solid var(--border)' }}>
            {Object.keys(CATEGORIES).map((cat) => (
              <button key={cat} onClick={() => setActive(cat)} style={{
                background:'none', border:'none',
                borderBottom: active===cat ? '2px solid var(--gold)':'2px solid transparent',
                color: active===cat ? 'var(--gold)':'var(--text-muted)',
                fontFamily:'var(--font-ui)', fontSize:11, fontWeight: active===cat ? 700:400,
                padding:'5px 10px', cursor:'pointer', letterSpacing:'.04em',
                textTransform:'uppercase',
              }}>{cat}</button>
            ))}
          </div>
        )}

        {/* Symbol grid */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:3, maxHeight:200, overflowY:'auto' }}>
          {filtered.map((sym, i) => (
            <button key={i} onClick={() => insert(sym)} title={`Insert ${sym} (U+${sym.codePointAt(0)?.toString(16).toUpperCase()})`}
              style={{
                width:34, height:34, fontSize:18, background:'var(--bg-elevated)',
                border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
                cursor:'pointer', color:'var(--text-primary)', display:'flex',
                alignItems:'center', justifyContent:'center', transition:'var(--transition)',
                lineHeight:1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background='var(--bg-active)'; e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background='var(--bg-elevated)'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-primary)'; }}>
              {sym}
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ color:'var(--text-muted)', fontFamily:'var(--font-ui)', fontSize:13, padding:'20px 0' }}>No symbols found</div>
          )}
        </div>

        {/* Last inserted */}
        {last && (
          <div style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--text-muted)', borderTop:'1px solid var(--border)', paddingTop:8 }}>
            Last inserted: <span style={{ fontSize:20, color:'var(--gold)', marginLeft:4 }}>{last}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
