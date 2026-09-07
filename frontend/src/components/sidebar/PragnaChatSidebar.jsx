import { useState, useEffect, useRef } from 'react';
import { useUIStore, useEditorStore, useDocumentStore } from '@/store';
import { markdownToHtml } from '@/services/ai';
import { aiApi } from '@/services/api';

const QUICK_PROMPTS = [
  { label: '⚡ Summary', prompt: 'Provide a concise, punchy executive summary of the attached document/selection with key takeaways.' },
  { label: '👔 Professional', prompt: 'Rewrite the attached text in an authoritative, executive, and highly polished corporate tone.' },
  { label: '✓ Polish & Flow', prompt: 'Proofread and correct all grammar, punctuation, and phrasing issues while improving sentence flow.' },
  { label: '📊 Table', prompt: 'Analyze the information in the attached text and structure it into a clean, markdown data table.' },
  { label: '📝 Action Items', prompt: 'Extract all actionable tasks and obligations into a structured checklist.' },
  { label: '🎯 Simplify', prompt: 'Simplify the language, eliminate unnecessary jargon, and make the content effortless to read.' },
  { label: '💡 Brainstorm', prompt: 'Brainstorm creative directions, missing sections, and compelling angles to enhance this document.' },
];

const AVAILABLE_MODELS = [
  { id: 'gemma4:31b', name: 'Gemma 4 31B Cloud' },
  { id: 'gpt-oss:120b', name: 'GPT-OSS 120B Cloud' },
  { id: 'nemotron-3-nano:30b', name: 'Nemotron 30B' },
];

export function PragnaChatSidebar() {
  const { copilotOpen, toggleCopilot, toast } = useUIStore();
  const { editor } = useEditorStore();
  const { title: docTitle, setTitle } = useDocumentStore();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am **Pragna**, your AI writing copilot.

I can help you:
- **Draft & Generate** content, proposals, or entire articles
- **Edit & Polish** selected text with custom instructions
- **Summarize & Extract** key findings, tables, or action items
- **Research the Live Web** with verifiable citations

Ask me anything or pick a quick prompt below!`,
      html: '',
      timestamp: new Date(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemma4:31b');
  const [includeContext, setIncludeContext] = useState(true);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [hasSelection, setHasSelection] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync editor selection dynamically
  useEffect(() => {
    if (!editor) return;

    const updateContext = () => {
      try {
        const { from, to } = editor.state.selection;
        const sel = from !== to
          ? editor.state.doc.textBetween(from, to, ' ').trim()
          : '';
        const fullDoc = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ').trim();

        if (sel) {
          setSelectedText(sel);
          setHasSelection(true);
        } else {
          setSelectedText(fullDoc);
          setHasSelection(false);
        }
      } catch {
        // ignore
      }
    };

    updateContext();
    editor.on('selectionUpdate', updateContext);
    editor.on('update', updateContext);

    return () => {
      editor.off('selectionUpdate', updateContext);
      editor.off('update', updateContext);
    };
  }, [editor]);

  useEffect(() => {
    if (copilotOpen) {
      scrollToBottom();
    }
  }, [messages, loading, copilotOpen]);

  const handleSendMessage = async (customText) => {
    const promptToSend = (customText || inputPrompt).trim();
    if (!promptToSend || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      role: 'user',
      content: promptToSend,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setLoading(true);

    try {
      const apiMessages = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const contextPayload = includeContext && selectedText
        ? selectedText.slice(0, 4000)
        : '';

      const response = await aiApi.chat({
        messages: apiMessages,
        context: contextPayload,
        webSearch: webSearchEnabled,
        model: selectedModel,
      });

      if (response && response.success) {
        const assistantMsg = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          html: markdownToHtml(response.message),
          model: response.model || selectedModel,
          latencyMs: response.latencyMs,
          sources: response.sources || [],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(response?.message || 'Pragna did not return a valid response');
      }
    } catch (err) {
      console.error('Pragna Sidebar Chat Error:', err);
      toast('Chat error: ' + err.message, 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error:** ${err.message || 'Unable to communicate with Pragna AI.'}`,
          html: '',
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInsertAtCursor = (msg) => {
    if (!editor) return;
    const htmlToInsert = msg.html || markdownToHtml(msg.content);
    editor.chain().focus().insertContent(htmlToInsert).run();
    toast('Inserted into document at cursor', 'success');
  };

  const handleReplaceSelection = (msg) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const htmlToInsert = msg.html || markdownToHtml(msg.content);
    if (from !== to) {
      editor.chain().focus().insertContentAt({ from, to }, htmlToInsert).run();
    } else {
      editor.chain().focus().insertContent(htmlToInsert).run();
    }
    toast('Replaced selection in document', 'success');
  };

  const handleCopyText = (content) => {
    navigator.clipboard?.writeText(content);
    toast('Copied response to clipboard', 'info');
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Chat cleared. Ready to help you with **${docTitle || 'your document'}**!`,
        html: '',
        timestamp: new Date(),
      },
    ]);
    toast('Pragna chat reset', 'info');
  };

  const wordCount = selectedText ? selectedText.trim().split(/\s+/).filter(Boolean).length : 0;

  if (!copilotOpen) {
    return (
      <button
        onClick={toggleCopilot}
        title="Open Pragna AI Copilot (Claude & ChatGPT inside Word)"
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          background: 'linear-gradient(180deg, #1f1a10 0%, #0e0d0a 100%)',
          border: '1px solid var(--gold-border)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '10px 8px',
          color: 'var(--gold)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          boxShadow: '-4px 0 16px rgba(0,0,0,0.35)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.paddingRight = '12px';
          e.currentTarget.style.boxShadow = '-6px 0 20px rgba(212,175,55,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.paddingRight = '8px';
          e.currentTarget.style.boxShadow = '-4px 0 16px rgba(0,0,0,0.35)';
        }}
      >
        <span style={{ fontSize: 16 }}>✦</span>
        <span style={{ writingMode: 'vertical-rl', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
          COPILOT
        </span>
      </button>
    );
  }

  return (
    <div
      style={{
        width: 380,
        minWidth: 340,
        maxWidth: 440,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 100,
        flexShrink: 0,
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          gap: 6,
        }}
      >
        {/* Brand & Model */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, color: 'var(--gold)' }}>✦</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            Pragna Copilot
          </span>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 10,
              outline: 'none',
              cursor: 'pointer',
              maxWidth: 130,
            }}
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Actions (Web, Clear, Close) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Web Toggle */}
          <button
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            title={`Web Grounding: ${webSearchEnabled ? 'ON' : 'OFF'}`}
            style={{
              background: webSearchEnabled ? 'var(--gold)' : 'var(--bg-elevated)',
              color: webSearchEnabled ? 'var(--text-on-gold)' : 'var(--text-secondary)',
              border: `1px solid ${webSearchEnabled ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 4,
              padding: '3px 6px',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🌐 {webSearchEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Clear */}
          <button
            onClick={handleClearChat}
            title="Clear Chat"
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
              padding: '3px 5px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            🗑️
          </button>

          {/* Close Sidebar */}
          <button
            onClick={toggleCopilot}
            title="Close Copilot Panel"
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
              padding: '3px 6px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Context Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 12px',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--gold)' }}>📎</span>
          <span>
            {hasSelection ? `Selection (${wordCount}w)` : `Entire Doc (${wordCount}w)`}
          </span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(e) => setIncludeContext(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Context</span>
        </label>
      </div>

      {/* Messages Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  marginBottom: 3,
                  padding: '0 2px',
                }}
              >
                <span style={{ fontWeight: 600, color: isUser ? 'var(--gold)' : 'var(--text-primary)' }}>
                  {isUser ? 'You' : '✦ Pragna'}
                </span>
                {msg.latencyMs && <span>• {(msg.latencyMs / 1000).toFixed(1)}s</span>}
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: '92%',
                  padding: '10px 12px',
                  borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  background: isUser ? 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.08) 100%)' : 'var(--bg-elevated)',
                  border: `1px solid ${isUser ? 'var(--gold-border)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}
              >
                {isUser ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                ) : (
                  <div
                    className="pragna-sidebar-rendered"
                    dangerouslySetInnerHTML={{
                      __html: msg.html || markdownToHtml(msg.content),
                    }}
                    style={{
                      '& p': { margin: '0 0 6px 0' },
                      '& h1, & h2, & h3': { fontSize: 13, color: 'var(--gold)', margin: '6px 0 3px' },
                      '& ul, & ol': { paddingLeft: 16, margin: '3px 0 6px 0' },
                      '& li': { marginBottom: 2 },
                      '& pre': { background: '#0a0a0a', padding: 8, borderRadius: 4, overflowX: 'auto', border: '1px solid var(--border)' },
                      '& code': { fontFamily: 'monospace', fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '1px 3px', borderRadius: 2 },
                    }}
                  />
                )}

                {/* Web sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 10 }}>
                    <div style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: 2 }}>🌐 Sources:</div>
                    {msg.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'block', color: 'var(--gold)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        [{idx + 1}] {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Response Action Buttons */}
              {!isUser && msg.id !== 'welcome' && !msg.isError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingLeft: 2 }}>
                  <button
                    onClick={() => handleInsertAtCursor(msg)}
                    title="Insert directly into document at cursor"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--gold)',
                      border: '1px solid var(--gold-border)',
                      borderRadius: 3,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📥 Insert
                  </button>

                  <button
                    onClick={() => handleReplaceSelection(msg)}
                    title="Replace current selection"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 3,
                      padding: '2px 6px',
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    🔄 Replace
                  </button>

                  <button
                    onClick={() => handleCopyText(msg.content)}
                    title="Copy to clipboard"
                    style={{
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 3,
                      padding: '2px 5px',
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    📋
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', color: 'var(--gold)', fontSize: 11, fontStyle: 'italic' }}>
            <span>✦</span>
            <span>Pragna is generating...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          padding: '6px 10px',
          background: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border)',
          whiteSpace: 'nowrap',
        }}
      >
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={loading}
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '3px 8px',
              fontSize: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div
        style={{
          padding: '8px 10px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 6,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={textareaRef}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Pragna, or prompt to draft, edit, summarize..."
          rows={2}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontSize: 12,
            fontFamily: 'var(--font-ui)',
            outline: 'none',
            resize: 'none',
            lineHeight: 1.35,
          }}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputPrompt.trim()}
          style={{
            height: 38,
            padding: '0 12px',
            background: inputPrompt.trim() && !loading ? 'var(--gold)' : 'var(--bg-elevated)',
            color: inputPrompt.trim() && !loading ? 'var(--text-on-gold)' : 'var(--text-muted)',
            border: `1px solid ${inputPrompt.trim() && !loading ? 'var(--gold-border)' : 'var(--border)'}`,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            cursor: inputPrompt.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ➔
        </button>
      </div>
    </div>
  );
}
