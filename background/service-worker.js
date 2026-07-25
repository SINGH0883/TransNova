/**
 * TransNova — Background Service Worker
 * Handles translation via Google Translate (free) with MyMemory fallback.
 * Manages settings, caching, and keyboard shortcuts.
 */

// ── Default Settings ─────────────────────────────────────────
const DEFAULT_SETTINGS = {
  enabled: true,
  mode: 'off',
  sendMode: 'off',
  readMode: 'off',
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  const merged = { ...DEFAULT_SETTINGS, ...existing };
  await chrome.storage.local.set(merged);
  console.log('[TransNova SW] Extension installed, settings initialized.');
});

// ── Translation Cache ────────────────────────────────────────
const translationCache = new Map();
const CACHE_MAX = 300;

function getCacheKey(text, from, to) {
  return `${from}|${to}|${text.trim().toLowerCase()}`;
}

// ── Google Translate (Free) ──────────────────────────────────
// Uses the same endpoint as Google Translate web — supports
// auto-detection and handles Romanized Hindi perfectly.
const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';

async function translateViaGoogle(text, from, to) {
  try {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: from === 'auto' ? 'auto' : from,
      tl: to,
      dt: 't',
      q: text.trim(),
    });

    const response = await fetch(`${GOOGLE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error(`Google API ${response.status}`);

    const data = await response.json();

    // Response format: [[["translated text","source text",...],...],...,"detected_lang"]
    if (data && data[0]) {
      let translated = '';
      for (const segment of data[0]) {
        if (segment[0]) translated += segment[0];
      }
      if (translated.trim()) {
        console.log(`[TransNova SW] Google translated: "${text}" → "${translated}"`);
        return translated.trim();
      }
    }
    throw new Error('Empty Google response');
  } catch (err) {
    console.warn('[TransNova SW] Google Translate failed:', err.message);
    return null;
  }
}

// ── MyMemory Fallback ────────────────────────────────────────
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

async function translateViaMyMemory(text, from, to) {
  try {
    const params = new URLSearchParams({
      q: text.trim(),
      langpair: `${from}|${to}`,
    });

    const response = await fetch(`${MYMEMORY_URL}?${params.toString()}`);
    if (!response.ok) throw new Error(`MyMemory ${response.status}`);

    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const result = data.responseData.translatedText;
      console.log(`[TransNova SW] MyMemory translated: "${text}" → "${result}"`);
      return result;
    }
    throw new Error('Bad MyMemory response');
  } catch (err) {
    console.warn('[TransNova SW] MyMemory failed:', err.message);
    return null;
  }
}

// ── Main Translation Function ────────────────────────────────
async function translateText(text, from, to) {
  const key = getCacheKey(text, from, to);

  // Check cache
  if (translationCache.has(key)) {
    console.log('[TransNova SW] Cache hit for:', text.substring(0, 30));
    return translationCache.get(key);
  }

  // Use auto-detect for source language — this handles
  // both Devanagari Hindi and Romanized Hindi (Hinglish)
  const effectiveFrom = 'auto';

  // Try Google Translate first (handles Romanized Hindi well)
  let translation = await translateViaGoogle(text, effectiveFrom, to);

  // Fallback to MyMemory if Google fails
  if (!translation) {
    translation = await translateViaMyMemory(text, from, to);
  }

  if (translation && translation.trim().toLowerCase() !== text.trim().toLowerCase()) {
    // Cache successful translation
    if (translationCache.size >= CACHE_MAX) {
      const oldest = translationCache.keys().next().value;
      translationCache.delete(oldest);
    }
    translationCache.set(key, translation);
    return translation;
  }

  return null; // Translation failed or was a no-op
}

// ── Message Handler ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE') {
    const { text, from, to } = message;
    translateText(text, from, to).then((translation) => {
      sendResponse({
        success: !!translation,
        translation: translation || text,
        original: text,
      });
    });
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local
      .get(['enabled', 'mode', 'sendMode', 'readMode'])
      .then((res) => {
        sendResponse({
          enabled: res.enabled !== false,
          mode: res.mode !== undefined ? res.mode : 'off',
          sendMode: res.sendMode !== undefined ? res.sendMode : 'off',
          readMode: res.readMode !== undefined ? res.readMode : 'off',
        });
      });
    return true;
  }

  if (message.type === 'UPDATE_SETTINGS') {
    chrome.storage.local.set(message.settings).then(async () => {
      const fullSettings = await chrome.storage.local.get(['enabled', 'mode', 'sendMode', 'readMode']);
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_CHANGED',
            settings: fullSettings,
          }).catch(() => {});
        });
      });
      sendResponse({ success: true });
    });
    return true;
  }
});

// ── Keyboard Shortcut ────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-translation') {
    const { enabled } = await chrome.storage.local.get('enabled');
    const newState = !enabled;
    await chrome.storage.local.set({ enabled: newState });
    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_CHANGED',
        settings: { enabled: newState },
      }).catch(() => {});
    });
    console.log(`[TransNova SW] Translation ${newState ? 'enabled' : 'disabled'} via shortcut`);
  }
});
