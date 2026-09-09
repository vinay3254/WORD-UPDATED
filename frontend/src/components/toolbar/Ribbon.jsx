import { useRef, useEffect, useCallback } from 'react';
import { useUIStore, useEditorStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { HomeTab }      from './tabs/HomeTab';
import { InsertTab }    from './tabs/InsertTab';
import { DrawTab }      from './tabs/DrawTab';
import { DesignTab }    from './tabs/DesignTab';
import { LayoutTab }    from './tabs/LayoutTab';
import { ReferenceTab } from './tabs/ReferenceTab';
import { MailingsTab }  from './tabs/MailingsTab';
import { ReviewTab }    from './tabs/ReviewTab';
import { ViewTab }      from './tabs/ViewTab';
import { AITab }        from './tabs/AITab';
import { HelpTab }      from './tabs/HelpTab';
import { RibbonFeatureSearch } from './RibbonFeatureSearch';

const TABS = [
  { id: 'file',      label: 'File'      },
  { id: 'home',      label: 'Home'      },
  { id: 'insert',    label: 'Insert'    },
  { id: 'draw',      label: 'Draw'      },
  { id: 'design',    label: 'Design'    },
  { id: 'layout',    label: 'Layout'    },
  { id: 'reference', label: 'References'},
  { id: 'mailings',  label: 'Mailings'  },
  { id: 'review',    label: 'Review'    },
  { id: 'view',      label: 'View'      },
  { id: 'help',      label: 'Help'      },
];

const TAB_CONTENT = {
  home: HomeTab, insert: InsertTab, draw: DrawTab, design: DesignTab,
  layout: LayoutTab, reference: ReferenceTab, mailings: MailingsTab,
  review: ReviewTab, view: ViewTab, ai: AITab, help: HelpTab,
};

export function Ribbon() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, setActiveTab, openDialog } = useUIStore();
  const Content = TAB_CONTENT[activeTab] || HomeTab;
  const ribbonScrollRef = useRef(null);
  const fadeLeftRef = useRef(null);
  const fadeRightRef = useRef(null);

  const updateScrollFades = useCallback(() => {
    const el = ribbonScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const canScrollLeft = scrollLeft > 2;
    const canScrollRight = scrollLeft + clientWidth < scrollWidth - 2;
    if (fadeLeftRef.current) fadeLeftRef.current.style.opacity = canScrollLeft ? '1' : '0';
    if (fadeRightRef.current) fadeRightRef.current.style.opacity = canScrollRight ? '1' : '0';
  }, []);

  useEffect(() => {
    updateScrollFades();
    const el = ribbonScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollFades, { passive: true });
    const ro = new ResizeObserver(updateScrollFades);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateScrollFades); ro.disconnect(); };
  }, [updateScrollFades, activeTab]);

  const onTabClick = (id) => {
    if (id === 'file') {
      navigate('/home', { state: { returnTo: location.pathname } });
      return;
    }
    setActiveTab(id);
  };
  const ribbonVars = {
    '--ribbon-surface': 'var(--bg-surface)',
    '--ribbon-surface-2': 'var(--bg-elevated)',
    '--ribbon-ink': 'var(--text-primary)',
    '--ribbon-divider': 'var(--border)',
    '--ribbon-hover': 'var(--bg-hover)',
  };

  return (
    <div style={{ flexShrink: 0, ...ribbonVars }}>
      {/* ── Tab strip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 30,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-app)',
          fontFamily: 'var(--font-ui)',
          gap: 0,
        }}
      >
        {/* Scrollable tabs container */}
        <div
          className="ribbon-scroll"
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            padding: '0 8px',
            gap: 2,
            overflowX: 'auto',
            overflowY: 'hidden',
            minWidth: 0,
          }}
        >
          {TABS.map((t) => {
            const active = t.id === activeTab;
            const isFile = t.id === 'file';
            return (
              <button
                key={t.id}
                onClick={() => onTabClick(t.id)}
                style={{
                  background: isFile ? '#1e1400' : active ? 'var(--bg-elevated)' : 'transparent',
                  border: '1px solid transparent',
                  borderTop: active ? '2px solid var(--gold)' : '2px solid transparent',
                  borderRadius: 2,
                  color: isFile ? 'var(--gold)' : active ? 'var(--text-primary)' : 'var(--gold)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  padding: '0 12px',
                  height: 28,
                  cursor: 'pointer',
                  transition: 'background 0.1s, border-color 0.1s',
                  outline: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--ribbon-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Feature search bar and quick actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 30,
            paddingRight: 6,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-app)',
            flexShrink: 0,
            gap: 4,
          }}
        >
          <RibbonFeatureSearch onActivateTab={(id) => setActiveTab(id)} />
          <button
            onClick={() => openDialog('shortcuts')}
            title="Remap Keyboard Shortcuts"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 2,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            ⌨
          </button>
          <button
            onClick={() => openDialog('help')}
            title="Help & Reference (F1)"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 2,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            ?
          </button>
        </div>

      </div>


      {/* ── Ribbon content ── */}
      <div
        style={{
          position: 'relative',
          background: 'var(--ribbon-surface)',
          borderBottom: '1px solid var(--border)',
          minHeight: 92,
        }}
      >
        <div
          ref={ribbonScrollRef}
          className="ribbon-scroll"
          style={{
            padding: '2px 8px 0',
            overflowX: 'auto',
            overflowY: 'hidden',
            display: 'flex',
            alignItems: 'stretch',
            gap: 6,
            scrollBehavior: 'smooth',
            scrollbarWidth: 'thin',
          }}
        >
          <Content />
        </div>
        {/* Left scroll fade */}
        <div
          ref={fadeLeftRef}
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 32,
            background: 'linear-gradient(to right, var(--ribbon-surface), transparent)',
            pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s',
            zIndex: 2,
          }}
        />
        {/* Right scroll fade */}
        <div
          ref={fadeRightRef}
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 32,
            background: 'linear-gradient(to left, var(--ribbon-surface), transparent)',
            pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s',
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}
