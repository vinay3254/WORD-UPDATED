import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore, useEditorStore, useDocumentStore } from '@/store';
import { Modal, Button, Label, Stack, Input } from '@/components/ui';
import { RibbonGroup } from '../RibbonGroup';
import { runImageTextCapture, runSmartSuggestions } from '@/utils/smartFeatures';

const CARET = String.fromCharCode(9662);
const DESIGN_DEFAULT_KEY = 'etherx-design-default';

// 10 Curated Document Style Presets
const THEMES = [
  {
    name: 'Executive Gold',
    label: 'Executive',
    headingFont: 'Crimson Pro',
    bodyFont: 'Inter',
    accent: '#c9a84c',
    heading: '#c9a84c',
    subtle: '#5c4a1a',
    spacing: '1.7',
    pageColor: '#1a1a1a',
    effect: 'soft',
  },
  {
    name: 'Modern Minimal',
    label: 'Modern',
    headingFont: 'Inter',
    bodyFont: 'Roboto',
    accent: '#3b82f6',
    heading: '#1d4ed8',
    subtle: '#64748b',
    spacing: '1.6',
    pageColor: '#ffffff',
    effect: 'none',
  },
  {
    name: 'Editorial Classic',
    label: 'Editorial',
    headingFont: 'Georgia',
    bodyFont: 'Garamond',
    accent: '#b8941e',
    heading: '#b8941e',
    subtle: '#5e4a17',
    spacing: '1.75',
    pageColor: '#fdfbf7',
    effect: 'soft',
  },
  {
    name: 'Academic Serif',
    label: 'Academic',
    headingFont: 'Times New Roman',
    bodyFont: 'Times New Roman',
    accent: '#9f7b17',
    heading: '#9f7b17',
    subtle: '#4b5563',
    spacing: '1.65',
    pageColor: '#ffffff',
    effect: 'none',
  },
  {
    name: 'Nordic Slate',
    label: 'Nordic',
    headingFont: 'Merriweather',
    bodyFont: 'Lato',
    accent: '#64748b',
    heading: '#334155',
    subtle: '#94a3b8',
    spacing: '1.7',
    pageColor: '#f8fafc',
    effect: 'none',
  },
  {
    name: 'Royal Emerald',
    label: 'Emerald',
    headingFont: 'Playfair Display',
    bodyFont: 'Montserrat',
    accent: '#10b981',
    heading: '#047857',
    subtle: '#064e3b',
    spacing: '1.7',
    pageColor: '#f0fdf4',
    effect: 'soft',
  },
  {
    name: 'Crimson Elegance',
    label: 'Crimson',
    headingFont: 'Crimson Pro',
    bodyFont: 'Merriweather',
    accent: '#e11d48',
    heading: '#be123c',
    subtle: '#881337',
    spacing: '1.8',
    pageColor: '#fff1f2',
    effect: 'soft',
  },
  {
    name: 'Warm Amber',
    label: 'Amber',
    headingFont: 'Georgia',
    bodyFont: 'Crimson Pro',
    accent: '#d97706',
    heading: '#b45309',
    subtle: '#78350f',
    spacing: '1.65',
    pageColor: '#fffbeb',
    effect: 'none',
  },
  {
    name: 'Cobalt Tech',
    label: 'Cobalt',
    headingFont: 'Roboto',
    bodyFont: 'Inter',
    accent: '#2563eb',
    heading: '#1e40af',
    subtle: '#3b82f6',
    spacing: '1.6',
    pageColor: '#f0f9ff',
    effect: 'strong',
  },
  {
    name: 'Noir Prestige',
    label: 'Noir',
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    accent: '#d4af37',
    heading: '#d4af37',
    subtle: '#737373',
    spacing: '1.8',
    pageColor: '#0d0d0d',
    effect: 'strong',
  },
];

// Color Palettes
const COLOR_PALETTES = [
  { id: 'office-gold', name: 'Office Gold', accent: '#c9a84c', heading: '#c9a84c', subtle: '#5c4a1a', swatches: ['#c9a84c', '#d4af37', '#b8941e', '#e0c36f'] },
  { id: 'ocean-blue', name: 'Ocean Blue', accent: '#2563eb', heading: '#1d4ed8', subtle: '#1e3a8a', swatches: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'] },
  { id: 'forest-emerald', name: 'Forest Emerald', accent: '#059669', heading: '#047857', subtle: '#064e3b', swatches: ['#059669', '#10b981', '#34d399', '#6ee7b7'] },
  { id: 'crimson-ruby', name: 'Crimson Ruby', accent: '#e11d48', heading: '#be123c', subtle: '#881337', swatches: ['#e11d48', '#f43f5e', '#fb7185', '#fda4af'] },
  { id: 'amethyst-violet', name: 'Amethyst Violet', accent: '#7c3aed', heading: '#6d28d9', subtle: '#4c1d95', swatches: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'] },
  { id: 'amber-bronze', name: 'Amber Bronze', accent: '#d97706', heading: '#b45309', subtle: '#78350f', swatches: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d'] },
  { id: 'slate-graphite', name: 'Slate Graphite', accent: '#475569', heading: '#334155', subtle: '#1e293b', swatches: ['#475569', '#64748b', '#94a3b8', '#cbd5e1'] },
];

// Font Pairings
const FONT_PAIRINGS = [
  { name: 'Serif Elegance', headingFont: 'Crimson Pro', bodyFont: 'Crimson Pro', preview: 'Crimson Pro + Crimson Pro' },
  { name: 'Editorial Modern', headingFont: 'Georgia', bodyFont: 'Inter', preview: 'Georgia + Inter' },
  { name: 'Academic Classical', headingFont: 'Times New Roman', bodyFont: 'Times New Roman', preview: 'Times New Roman' },
  { name: 'Literary Journal', headingFont: 'Merriweather', bodyFont: 'Georgia', preview: 'Merriweather + Georgia' },
  { name: 'Modern Clean', headingFont: 'Inter', bodyFont: 'Roboto', preview: 'Inter + Roboto' },
  { name: 'Luxury Editorial', headingFont: 'Playfair Display', bodyFont: 'Lato', preview: 'Playfair Display + Lato' },
];

// Paragraph Spacings
const SPACING_PRESETS = [
  { label: 'Compact', value: '1.15', desc: 'Tight 1.15 line spacing' },
  { label: 'Normal', value: '1.5', desc: 'Standard 1.5 line spacing' },
  { label: 'Relaxed', value: '1.7', desc: 'Comfortable 1.7 line spacing' },
  { label: 'Double', value: '2.0', desc: 'Formal 2.0 double spacing' },
];

// Visual Effects
const EFFECT_PRESETS = [
  { label: 'None', value: 'none', desc: 'Clean flat page' },
  { label: 'Soft Depth', value: 'soft', desc: 'Subtle shadow & contrast' },
  { label: 'Strong Depth', value: 'strong', desc: 'Rich elevation & depth' },
];

// Page Colors
const THEME_COLOR_COLUMNS = [
  ['#ffffff', '#f2f2f2', '#d9d9d9', '#bfbfbf', '#7f7f7f'],
  ['#000000', '#1f1f1f', '#404040', '#606060', '#808080'],
  ['#dbe2ea', '#c0cad7', '#9eacbf', '#73839b', '#4d5b6f'],
  ['#dbe6f7', '#b8ccf0', '#7fa3db', '#4f78c4', '#30508e'],
  ['#e1efff', '#b9d4ff', '#7fb1ff', '#4b8cf0', '#2a63c7'],
  ['#fff0e2', '#ffd1a8', '#ffaf66', '#f38a1e', '#b65b06'],
  ['#eeeeee', '#bfbfbf', '#8d8d8d', '#666666', '#3a3a3a'],
  ['#fff4cf', '#ffe48a', '#ffd000', '#f0b400', '#a67600'],
  ['#e8f2ff', '#c4dcff', '#8cbaff', '#5695e6', '#3465ad'],
  ['#e8f4df', '#c7e4ae', '#95cf6b', '#5fad37', '#3a7a1f'],
];
const STANDARD_COLORS = ['#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'];

const BORDER_STYLES = ['none', 'solid', 'double', 'dashed'];
const BORDER_WIDTHS = [1, 2, 3, 4, 6];
const BORDER_COLORS = ['#6f5320', '#c9a84c', '#8b6b1a', '#4a4a4a', '#8f3d3d', '#2f5d62', '#2563eb', '#059669'];

export function DesignTab() {
  const { toast, watermarkText, setWatermarkText, setActiveTab } = useUIStore();
  const { editor } = useEditorStore();
  const { design, setDesign } = useDocumentStore();

  // Popover state management
  const [activePopover, setActivePopover] = useState(null); // 'colors' | 'fonts' | 'spacing' | 'effects' | 'watermark' | 'pageColor'
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  // Border modal state
  const [borderModalOpen, setBorderModalOpen] = useState(false);
  const [tempBorderSetting, setTempBorderSetting] = useState(design.borderSetting || 'box');
  const [tempBorderStyle, setTempBorderStyle] = useState(design.borderStyle || 'solid');
  const [tempBorderColor, setTempBorderColor] = useState(design.borderColor || '#6f5320');
  const [tempBorderWidth, setTempBorderWidth] = useState(design.borderWidth || 2);
  const [customWatermarkInput, setCustomWatermarkInput] = useState(design.watermark || watermarkText || '');

  const tempBorderSettingRef = useRef(design.borderSetting || 'box');
  const tempBorderStyleRef = useRef(design.borderStyle || 'solid');
  const tempBorderColorRef = useRef(design.borderColor || '#6f5320');
  const tempBorderWidthRef = useRef(design.borderWidth || 2);

  // Keep border modal temp state in sync with active document design
  useEffect(() => {
    if (borderModalOpen) {
      const s = design.borderSetting || 'box';
      const st = design.borderStyle || 'solid';
      const c = design.borderColor || '#6f5320';
      const w = design.borderWidth || 2;
      setTempBorderSetting(s);
      setTempBorderStyle(st);
      setTempBorderColor(c);
      setTempBorderWidth(w);
      tempBorderSettingRef.current = s;
      tempBorderStyleRef.current = st;
      tempBorderColorRef.current = c;
      tempBorderWidthRef.current = w;
    }
  }, [borderModalOpen, design]);

  // Voice Typing & TTS state
  const [isDictating, setIsDictating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest('[data-design-popover="true"]') && !e.target.closest('[data-design-trigger="true"]')) {
        setActivePopover(null);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  const openPopover = (name, e) => {
    e.stopPropagation();
    if (activePopover === name) {
      setActivePopover(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPos({ top: rect.bottom + 6, left: Math.max(8, Math.min(window.innerWidth - 300, rect.left)) });
    setActivePopover(name);
  };

  // Apply full theme preset (B2)
  const handleApplyTheme = (theme) => {
    setDesign({
      headingFont: theme.headingFont,
      bodyFont: theme.bodyFont,
      font: theme.bodyFont,
      accent: theme.accent,
      heading: theme.heading,
      subtle: theme.subtle,
      spacing: theme.spacing,
      pageColor: theme.pageColor,
      effect: theme.effect,
      pageColorMode: theme.pageColor === '#ffffff' || theme.pageColor === '#1a1a1a' ? 'theme' : 'custom',
    });
    toast(`Theme "${theme.name}" applied`, 'success');
  };

  // Set current design as default (B2)
  const handleSetAsDefault = () => {
    try {
      localStorage.setItem(DESIGN_DEFAULT_KEY, JSON.stringify(design));
      toast('Current design set as default for new documents', 'success');
    } catch {
      toast('Could not save design default', 'warning');
    }
  };

  // Voice Typing (B6)
  const toggleVoiceTyping = () => {
    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
      toast('Voice typing stopped', 'info');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('Voice Typing is not supported in this browser', 'warning');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsDictating(true);
        toast('🎤 Listening... speak into your microphone', 'success');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript && editor) {
          editor.chain().focus().insertContent(finalTranscript).run();
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast('Microphone permission denied', 'error');
        }
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      toast('Voice typing failed: ' + err.message, 'error');
      setIsDictating(false);
    }
  };

  // Text-to-Speech (B6)
  const toggleReadAloud = () => {
    if (!window.speechSynthesis) {
      toast('Text-to-speech is not supported in this browser', 'warning');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      toast('Speech stopped', 'info');
      return;
    }

    let textToRead = '';
    if (editor) {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        textToRead = editor.state.doc.textBetween(from, to, ' ').trim();
      } else {
        textToRead = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ').trim();
      }
    }

    if (!textToRead) {
      toast('Document is empty', 'info');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      toast('🔊 Reading aloud...', 'success');
    };
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopRead = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    toast('Read aloud stopped', 'info');
  };

  const handleWatermarkPreset = (text) => {
    setDesign({ watermark: text });
    setWatermarkText(text);
    setActivePopover(null);
    toast(text ? `Watermark "${text}" applied` : 'Watermark removed', 'success');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        height: '100%',
        width: '100%',
        minWidth: 1100,
        background: 'var(--ribbon-surface)',
        borderBottom: '1px solid var(--ribbon-divider)',
        userSelect: 'none',
      }}
    >
      {/* ── Document Formatting: Style Gallery ── */}
      <RibbonGroup label="Document Formatting">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 68 }}>
          {THEMES.map((theme, idx) => {
            const active = design.accent === theme.accent && (design.headingFont === theme.headingFont || design.font === theme.headingFont);
            return (
              <button
                key={`${theme.name}-${idx}`}
                onClick={() => handleApplyTheme(theme)}
                style={{
                  width: 78,
                  height: 60,
                  border: active ? '1.5px solid var(--gold)' : '1px solid var(--ribbon-divider)',
                  background: active ? 'rgba(212,175,55,0.12)' : 'var(--bg-elevated)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  padding: '3px 4px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: active ? '0 0 8px rgba(212,175,55,0.2)' : 'none',
                  transition: 'all 0.1s ease',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: `${theme.headingFont}, serif`,
                    fontWeight: 600,
                    color: theme.accent,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {theme.label}
                </div>
                <div style={{ fontSize: 8, color: 'var(--text-secondary)', lineHeight: 1.15 }}>
                  <div style={{ color: theme.accent, fontWeight: 700 }}>Heading</div>
                  <div style={{ opacity: 0.75 }}>Body Text Style</div>
                </div>
              </button>
            );
          })}
        </div>
      </RibbonGroup>

      {/* ── Design Controls (Colors, Fonts, Spacing, Effects, Default) ── */}
      <RibbonGroup label="Document Design">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 68 }}>
          {/* Colors Dropdown */}
          <button
            data-design-trigger="true"
            onClick={(e) => openPopover('colors', e)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '2px 4px',
            }}
          >
            <div style={{ width: 22, height: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ background: design.accent || '#c9a84c' }} />
              <div style={{ background: design.heading || '#d4af37' }} />
              <div style={{ background: '#b8941e' }} />
              <div style={{ background: '#64748b' }} />
            </div>
            <span style={{ fontSize: 11 }}>Colors {CARET}</span>
          </button>

          {/* Fonts Dropdown */}
          <button
            data-design-trigger="true"
            onClick={(e) => openPopover('fonts', e)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '2px 4px',
            }}
          >
            <div style={{ width: 22, height: 22, border: '1px solid var(--border)', borderRadius: 2, display: 'grid', placeItems: 'center', background: 'var(--bg-elevated)', fontSize: 13, fontWeight: 700 }}>
              A
            </div>
            <span style={{ fontSize: 11 }}>Fonts {CARET}</span>
          </button>

          {/* Paragraph Spacing & Effects stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              data-design-trigger="true"
              onClick={(e) => openPopover('spacing', e)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                padding: '2px 4px',
              }}
            >
              <span>|||</span>
              <span>Spacing: {design.spacing || '1.7'} {CARET}</span>
            </button>

            <button
              data-design-trigger="true"
              onClick={(e) => openPopover('effects', e)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                padding: '2px 4px',
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid var(--gold)' }} />
              <span>Effects: {design.effect || 'none'} {CARET}</span>
            </button>
          </div>

          {/* Set as Default */}
          <button
            onClick={handleSetAsDefault}
            title="Set as Default for all new documents"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '2px 4px',
            }}
          >
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--gold)', display: 'grid', placeItems: 'center', color: 'var(--gold)', fontSize: 11 }}>
              ✓
            </div>
            <span style={{ fontSize: 11 }}>Set Default</span>
          </button>
        </div>
      </RibbonGroup>

      {/* ── Smart Features ── */}
      <RibbonGroup label="Smart Features">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 68 }}>
          {/* Voice Typing */}
          <button
            onClick={toggleVoiceTyping}
            style={{
              background: isDictating ? 'rgba(239, 68, 68, 0.18)' : 'transparent',
              border: `1px solid ${isDictating ? '#ef4444' : 'transparent'}`,
              borderRadius: 4,
              color: isDictating ? '#ef4444' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '3px 6px',
            }}
          >
            <span style={{ fontSize: 16 }}>{isDictating ? '🔴' : '🎤'}</span>
            <span style={{ fontSize: 10 }}>{isDictating ? 'Listening...' : 'Voice Typing'}</span>
          </button>

          {/* Text-to-Speech */}
          <button
            onClick={toggleReadAloud}
            style={{
              background: isSpeaking ? 'rgba(212,175,55,0.18)' : 'transparent',
              border: `1px solid ${isSpeaking ? 'var(--gold)' : 'transparent'}`,
              borderRadius: 4,
              color: isSpeaking ? 'var(--gold)' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '3px 6px',
            }}
          >
            <span style={{ fontSize: 16 }}>🔊</span>
            <span style={{ fontSize: 10 }}>{isSpeaking ? 'Reading...' : 'Read Aloud'}</span>
          </button>

          {isSpeaking && (
            <button
              onClick={handleStopRead}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '3px 4px',
              }}
            >
              <span style={{ fontSize: 16 }}>🔇</span>
              <span style={{ fontSize: 10 }}>Stop</span>
            </button>
          )}

          {/* Handwriting OCR / Draw */}
          <button
            onClick={() => {
              setActiveTab('draw');
              toast('Switched to Inking & Draw canvas', 'info');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '3px 6px',
            }}
          >
            <span style={{ fontSize: 16 }}>✍</span>
            <span style={{ fontSize: 10 }}>Draw / Ink</span>
          </button>

          {/* Suggestions */}
          <button
            onClick={() => runSmartSuggestions({ editor, toast })}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '3px 6px',
            }}
          >
            <span style={{ fontSize: 16 }}>✨</span>
            <span style={{ fontSize: 10 }}>Suggest</span>
          </button>
        </div>
      </RibbonGroup>

      {/* ── Page Background (Watermark, Page Color, Page Borders) ── */}
      <RibbonGroup label="Page Background">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 68 }}>
          {/* Watermark */}
          <button
            data-design-trigger="true"
            onClick={(e) => openPopover('watermark', e)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '3px 6px',
            }}
          >
            <div style={{ width: 22, height: 22, border: '1px solid #8f3d3d', background: '#fff', transform: 'skew(-6deg)', display: 'grid', placeItems: 'center', fontSize: 9, color: '#8f3d3d', fontWeight: 700 }}>
              W
            </div>
            <span style={{ fontSize: 10 }}>Watermark {CARET}</span>
          </button>

          {/* Page Color */}
          <button
            data-design-trigger="true"
            onClick={(e) => openPopover('pageColor', e)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '3px 6px',
            }}
          >
            <div style={{ width: 22, height: 22, border: '1px solid var(--border)', background: design.pageColor || '#1a1a1a', borderRadius: 2 }} />
            <span style={{ fontSize: 10 }}>Page Color {CARET}</span>
          </button>

          {/* Page Border */}
          <button
            onClick={() => setBorderModalOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '3px 6px',
            }}
          >
            <div style={{ width: 22, height: 22, border: '2px solid var(--gold)', borderRadius: 2 }} />
            <span style={{ fontSize: 10 }}>Page Borders</span>
          </button>
        </div>
      </RibbonGroup>

      {/* ── PORTAL: POPOVERS ── */}
      {activePopover && createPortal(
        <div
          data-design-popover="true"
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            zIndex: 3000,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: 10,
            boxShadow: 'var(--shadow-md)',
            minWidth: 220,
            fontFamily: 'var(--font-ui)',
            color: 'var(--text-primary)',
          }}
        >
          {/* Colors Palette Popover */}
          {activePopover === 'colors' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>Color Palettes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {COLOR_PALETTES.map((pal) => (
                  <button
                    key={pal.id}
                    onClick={() => {
                      setDesign({ accent: pal.accent, heading: pal.heading, subtle: pal.subtle });
                      setActivePopover(null);
                      toast(`Applied ${pal.name}`, 'success');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: design.accent === pal.accent ? 'var(--bg-hover)' : 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ fontSize: 11 }}>{pal.name}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {pal.swatches.map((c) => (
                        <span key={c} style={{ width: 10, height: 10, background: c, borderRadius: 1 }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fonts Popover */}
          {activePopover === 'fonts' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>Font Pairings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {FONT_PAIRINGS.map((fp) => (
                  <button
                    key={fp.name}
                    onClick={() => {
                      setDesign({ headingFont: fp.headingFont, bodyFont: fp.bodyFont, font: fp.bodyFont });
                      setActivePopover(null);
                      toast(`Font pairing "${fp.name}" applied`, 'success');
                    }}
                    style={{
                      background: (design.headingFont === fp.headingFont && design.bodyFont === fp.bodyFont) ? 'var(--bg-hover)' : 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '6px 8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: `${fp.headingFont}, serif` }}>{fp.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fp.preview}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Spacing Popover */}
          {activePopover === 'spacing' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>Paragraph Spacing</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SPACING_PRESETS.map((sp) => (
                  <button
                    key={sp.value}
                    onClick={() => {
                      setDesign({ spacing: sp.value });
                      setActivePopover(null);
                      toast(`Spacing set to ${sp.label} (${sp.value})`, 'success');
                    }}
                    style={{
                      background: design.spacing === sp.value ? 'var(--bg-hover)' : 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '5px 8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{sp.label} ({sp.value})</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sp.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Effects Popover */}
          {activePopover === 'effects' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>Page Depth & Effects</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {EFFECT_PRESETS.map((ef) => (
                  <button
                    key={ef.value}
                    onClick={() => {
                      setDesign({ effect: ef.value });
                      setActivePopover(null);
                      toast(`Effect "${ef.label}" applied`, 'success');
                    }}
                    style={{
                      background: design.effect === ef.value ? 'var(--bg-hover)' : 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '5px 8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{ef.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ef.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Watermark Popover */}
          {activePopover === 'watermark' && (
            <div style={{ width: 220 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>Watermark</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {['DRAFT', 'CONFIDENTIAL', 'URGENT', 'DO NOT COPY'].map((txt) => (
                  <button
                    key={txt}
                    onClick={() => handleWatermarkPreset(txt)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 3,
                      padding: '4px 6px',
                      fontSize: 10,
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {txt}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Custom watermark..."
                  value={customWatermarkInput}
                  onChange={(e) => setCustomWatermarkInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: 11,
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                  }}
                />
                <button
                  onClick={() => handleWatermarkPreset(customWatermarkInput.trim())}
                  style={{
                    background: 'var(--gold)',
                    color: 'var(--text-on-gold)',
                    border: 'none',
                    borderRadius: 3,
                    padding: '4px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Set
                </button>
              </div>
              <button
                onClick={() => handleWatermarkPreset('')}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  borderRadius: 3,
                  padding: '4px',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                Remove Watermark
              </button>
            </div>
          )}

          {/* Page Color Popover */}
          {activePopover === 'pageColor' && (
            <div style={{ width: 260 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>Theme Colors</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2, marginBottom: 8 }}>
                {THEME_COLOR_COLUMNS.map((col, cIdx) => (
                  <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {col.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setDesign({ pageColor: color, pageColorMode: 'custom' });
                          setActivePopover(null);
                          toast(`Page color applied: ${color}`, 'success');
                        }}
                        title={color}
                        style={{
                          width: '100%',
                          height: 14,
                          background: color,
                          border: color === '#ffffff' ? '1px solid #777' : '1px solid rgba(0,0,0,0.2)',
                          padding: 0,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>Standard Colors</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2, marginBottom: 8 }}>
                {STANDARD_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setDesign({ pageColor: c, pageColorMode: 'custom' });
                      setActivePopover(null);
                      toast(`Page color applied: ${c}`, 'success');
                    }}
                    title={c}
                    style={{ width: '100%', height: 14, background: c, border: '1px solid rgba(0,0,0,0.2)', padding: 0, cursor: 'pointer' }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => {
                    setDesign({ pageColor: '#1a1a1a', pageColorMode: 'theme' });
                    setActivePopover(null);
                    toast('Page color reset to theme default', 'success');
                  }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    padding: '4px',
                    fontSize: 10,
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                  }}
                >
                  No Color (Default)
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ── BORDER MODAL (B5) ── */}
      {borderModalOpen && (
        <Modal title="Borders and Shading" onClose={() => setBorderModalOpen(false)} width={540}>
          <Stack gap={12}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              {/* Setting */}
              <div>
                <Label>Setting</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['none', 'box', 'shadow', '3d', 'custom'].map((st) => (
                    <Button
                      key={st}
                      type="button"
                      variant={tempBorderSetting === st ? 'primary' : 'subtle'}
                      onClick={() => {
                        setTempBorderSetting(st);
                        tempBorderSettingRef.current = st;
                      }}
                      style={{ justifyContent: 'flex-start', fontSize: 11 }}
                    >
                      {st === 'none' ? 'None' : st === '3d' ? '3-D' : st[0].toUpperCase() + st.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Style, Color, Width */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <Label>Style</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {BORDER_STYLES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setTempBorderStyle(st);
                          tempBorderStyleRef.current = st;
                        }}
                        style={{
                          background: tempBorderStyle === st ? 'var(--bg-hover)' : 'transparent',
                          border: tempBorderStyle === st ? '1px solid var(--gold)' : '1px solid var(--border)',
                          borderRadius: 3,
                          padding: '4px 6px',
                          fontSize: 11,
                          cursor: 'pointer',
                          color: 'var(--text-primary)',
                          textAlign: 'left',
                        }}
                      >
                        {st[0].toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Color</Label>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {BORDER_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setTempBorderColor(c);
                          tempBorderColorRef.current = c;
                        }}
                        style={{
                          width: 20,
                          height: 20,
                          background: c,
                          borderRadius: '50%',
                          border: tempBorderColor === c ? '2px solid var(--gold)' : '1px solid rgba(0,0,0,0.3)',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Width</Label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {BORDER_WIDTHS.map((w) => (
                      <Button
                        key={w}
                        type="button"
                        variant={tempBorderWidth === w ? 'primary' : 'subtle'}
                        onClick={() => {
                          setTempBorderWidth(w);
                          tempBorderWidthRef.current = w;
                        }}
                        style={{ padding: '2px 8px', fontSize: 11 }}
                      >
                        {w}pt
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
              <Button variant="subtle" onClick={() => setBorderModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const setting = tempBorderSettingRef.current;
                  const style = setting === 'none' ? 'none' : tempBorderStyleRef.current;
                  const color = tempBorderColorRef.current;
                  const width = tempBorderWidthRef.current;
                  setDesign({
                    borderSetting: setting,
                    borderStyle: style,
                    borderColor: color,
                    borderWidth: width,
                  });
                  setBorderModalOpen(false);
                  toast('Page borders updated', 'success');
                }}
              >
                OK
              </Button>
            </div>
          </Stack>
        </Modal>
      )}
    </div>
  );
}
