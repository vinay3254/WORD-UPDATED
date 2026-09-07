const express = require('express');
const router = express.Router();
const ollamaService = require('../utils/ollamaService');
const webToolsService = require('../utils/webToolsService');

// Execute Pragna AI action (generate, summarize, grammar, rewrite, title, translate, prompt)
router.post('/action', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      action = 'generate',
      text = '',
      topic = '',
      tone = 'professional',
      pages = 1,
      mode = 'clear',
      fallbackTitle = '',
      language = 'English',
      prompt = '',
      instructions = '',
      instruction = '',
      model = '',
    } = req.body;

    const effectivePrompt = prompt || instructions || instruction || '';

    const result = await ollamaService.executeAction({
      action,
      text,
      topic,
      tone,
      pages,
      mode,
      fallbackTitle,
      language,
      prompt: effectivePrompt,
      instructions: effectivePrompt,
      model,
    });

    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      action,
      latencyMs,
      ...result,
    });
  } catch (err) {
    console.error('❌ Pragna AI Action error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Pragna AI processing failed',
      latencyMs: Date.now() - startTime,
    });
  }
});

// Interactive chat/assistant with Pragna (with optional Web Grounding)
router.post('/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const { messages = [], context = '', webSearch = false, model } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages array is required' });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    let webContext = '';
    let webSources = [];
    if (webSearch && lastUserMessage.trim()) {
      try {
        webSources = await webToolsService.searchWeb({ query: lastUserMessage, limit: 4 });
        if (webSources.length) {
          webContext = '\n\nLive Web Findings:\n' + webSources.map((s, i) => `[Source ${i + 1}] "${s.title}": ${s.snippet} (URL: ${s.url})`).join('\n');
        }
      } catch (wErr) {
        console.warn('⚠️ Web grounding failed during chat:', wErr.message);
      }
    }

    const systemPrompt = `You are Pragna, the advanced AI writing assistant built into EtherX Word (equivalent to ChatGPT/Claude Copilot for MS Word).
You give succinct, highly intelligent, and practical advice on writing, formatting, editing, analyzing, and perfecting documents.
When answering, use clear markdown formatting with headers, lists, code blocks, or tables where appropriate.
${context ? `Current document context:\n${context}` : ''}
${webContext ? `Incorporate the following live web research into your response and cite sources where appropriate:\n${webContext}` : ''}`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || ''),
      })),
    ];

    const response = await ollamaService.chatCompletion({ messages: formattedMessages, model });
    const latencyMs = Date.now() - startTime;

    return res.json({
      success: true,
      message: response.content,
      model: response.model,
      sources: webSources,
      latencyMs,
    });
  } catch (err) {
    console.error('❌ Pragna Chat error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Pragna Chat failed',
      latencyMs: Date.now() - startTime,
    });
  }
});

// ══════════════════════════════════════════════════════════════════
// WEB TOOLS FOR PRAGNA AI
// ══════════════════════════════════════════════════════════════════

// 1. Web Search endpoint
router.post('/web/search', async (req, res) => {
  const startTime = Date.now();
  try {
    const { query = '', category = 'all', limit = 8 } = req.body;
    if (!query.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const results = await webToolsService.searchWeb({ query: query.trim(), category, limit });
    return res.json({
      success: true,
      query: query.trim(),
      category,
      results,
      count: results.length,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('❌ Pragna Web Search error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Fetch webpage content
router.post('/web/fetch', async (req, res) => {
  const startTime = Date.now();
  try {
    const { url = '' } = req.body;
    if (!url.trim()) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const pageData = await webToolsService.fetchUrlContent(url.trim());
    return res.json({
      success: true,
      ...pageData,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('❌ Pragna Web Fetch error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Synthesize live web research with Pragna AI
router.post('/web/research', async (req, res) => {
  const startTime = Date.now();
  try {
    const { query = '', category = 'all', mode = 'synthesize', documentContext = '' } = req.body;
    if (!query.trim()) {
      return res.status(400).json({ success: false, message: 'Research query is required' });
    }

    const result = await webToolsService.researchWithPragna({
      query: query.trim(),
      category,
      mode,
      documentContext,
    });

    return res.json({
      success: true,
      ...result,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('❌ Pragna Web Research error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Summarize URL with Pragna AI
router.post('/web/summarize-url', async (req, res) => {
  const startTime = Date.now();
  try {
    const { url = '', action = 'summary' } = req.body;
    if (!url.trim()) {
      return res.status(400).json({ success: false, message: 'Target URL is required' });
    }

    const result = await webToolsService.summarizeUrlWithPragna({ url: url.trim(), action });
    return res.json({
      success: true,
      ...result,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('❌ Pragna Summarize URL error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Status check
router.get('/status', (req, res) => {
  try {
    const status = ollamaService.getStatus();
    return res.json({
      ...status,
      webToolsEnabled: true,
      webSources: ['Google News RSS', 'Wikipedia', 'ArXiv Academic', 'DuckDuckGo'],
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
