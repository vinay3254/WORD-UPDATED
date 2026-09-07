import { useEffect } from 'react';
import { useUIStore } from '@/store';

const ICONS  = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
const COLORS = { success: '#4caf50', error: '#e74c3c', info: '#d4af37', warning: '#e67e22' };

function Toast({ toast, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration || 3200);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onRemove]);

  const c = COLORS[toast.type] || COLORS.info;
  return (
    <div className="anim-fade-up" style={{
      background: 'var(--bg-surface)', border: `1px solid ${c}`,
      borderLeft: `3px solid ${c}`, borderRadius: 'var(--radius-md)',
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
      minWidth: 240, maxWidth: 340, boxShadow: 'var(--shadow-md)', pointerEvents: 'all',
    }}>
      <span style={{ color: c, fontWeight: 700, fontSize: 14 }}>{ICONS[toast.type] || ICONS.info}</span>
      <span style={{ color: 'var(--text-primary)', flex: 1, fontSize: 13, fontFamily: 'var(--font-ui)' }}>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)}
        style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:13, padding:'0 2px' }}>✕</button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  return (
    <div style={{ position:'fixed', bottom:20, right:20, display:'flex', flexDirection:'column', gap:8, zIndex:9999, pointerEvents:'none' }}>
      {toasts.map((t) => <Toast key={t.id} toast={t} onRemove={removeToast} />)}
    </div>
  );
}
