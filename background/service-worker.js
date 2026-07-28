/**
 * TransNova — Background Service Worker
 * Handles translation via Google Translate (free) with MyMemory fallback.
 * Manages settings, caching, and keyboard shortcuts.
 */

// ── Default Settings ─────────────────────────────────────────
const DEFAULT_SETTINGS = {
  enabled: true,
  myLanguage: 'en',
  partnerLanguage: 'es',
  sendMode: 'off',
  readMode: 'off',
  mode: 'off',
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  const merged = { ...DEFAULT_SETTINGS, ...existing };
  await chrome.storage.local.set(merged);
  console.log('[TransNova SW] Extension installed, settings initialized.');
});

// ── Translation Cache ────────────────────────────────────────
const translationCache = new Map();
const CACHE_MAX = 500;

function getCacheKey(text, from, to) {
  return `${from}|${to}|${text.trim().toLowerCase()}`;
}

// ── Google Translate (Free) ──────────────────────────────────
const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';

function devanagariToHinglish(text) {
  if (!text) return text;
  const map = {
    'अ':'a', 'आ':'aa', 'इ':'i', 'ई':'ee', 'उ':'u', 'ऊ':'oo', 'ऋ':'ri', 'ए':'e', 'ऐ':'ai', 'ओ':'o', 'औ':'au', 'अं':'an', 'अः':'ah',
    'क':'k', 'ख':'kh', 'ग':'g', 'घ':'gh', 'ङ':'ng',
    'च':'ch', 'छ':'chh', 'ज':'j', 'झ':'jh', 'ञ':'nya',
    'ट':'t', 'ठ':'th', 'ड':'d', 'ढ':'dh', 'ण':'n',
    'त':'t', 'थ':'th', 'द':'d', 'ध':'dh', 'न':'n',
    'प':'p', 'फ':'ph', 'ब':'b', 'भ':'bh', 'म':'m',
    'य':'y', 'र':'r', 'ल':'l', 'व':'v', 'श':'sh', 'ष':'sh', 'स':'s', 'ह':'h',
    'क़':'q', 'ख़':'kh', 'ग़':'g', 'ज़':'z', 'ड़':'r', 'ढ़':'rh', 'फ़':'f',
    'ा':'a', 'ि':'i', 'ी':'ee', 'ु':'u', 'ू':'oo', 'ृ':'ri', 'े':'e', 'ै':'ai', 'ो':'o', 'ौ':'au', 'ं':'n', 'ँ':'n', 'ः':'h',
    '्': ''
  };
  const consonants = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़';
  const matras = 'ािीुूृेैोौंशँ';

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = i + 1 < text.length ? text[i + 1] : '';

    if (consonants.includes(char)) {
      const roman = map[char] || char;
      if (matras.includes(nextChar) || nextChar === '्' || !nextChar || nextChar === ' ' || /[^\u0900-\u097F]/.test(nextChar)) {
        result += roman;
      } else {
        result += roman + 'a';
      }
    } else if (map[char] !== undefined) {
      result += map[char];
    } else {
      result += char;
    }
  }
  return result.replace(/\s+/g, ' ').trim();
}

async function translateViaGoogle(text, from, to) {
  try {
    const isHinglishTarget = to === 'hi-Latn' || to === 'hinglish';
    const targetLang = isHinglishTarget ? 'hi' : to;

    const params = new URLSearchParams({
      client: 'gtx',
      sl: !from || from === 'auto' ? 'auto' : from,
      tl: targetLang,
      dt: 't',
      q: text.trim(),
    });

    if (isHinglishTarget) {
      params.append('dt', 'rm');
    }

    const response = await fetch(`${GOOGLE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error(`Google API ${response.status}`);

    const data = await response.json();

    if (data && data[0]) {
      // If target is Hinglish, check for Romanized output from Google API
      if (isHinglishTarget) {
        let romanized = '';
        for (const segment of data[0]) {
          if (segment && segment[2]) {
            romanized += segment[2] + ' ';
          } else if (segment && segment[3]) {
            romanized += segment[3] + ' ';
          }
        }
        if (romanized.trim()) {
          console.log(`[TransNova SW] Google translated to Hinglish: "${text}" → "${romanized.trim()}"`);
          return romanized.trim();
        }
      }

      let translated = '';
      for (const segment of data[0]) {
        if (segment && segment[0]) translated += segment[0];
      }
      if (translated.trim()) {
        if (isHinglishTarget && /[\u0900-\u097F]/.test(translated)) {
          translated = devanagariToHinglish(translated);
        }
        console.log(`[TransNova SW] Google translated: "${text}" (${from || 'auto'} → ${to}) → "${translated}"`);
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
      langpair: `${!from || from === 'auto' ? 'autodetect' : from}|${to}`,
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
  if (!text || !text.trim()) return text;
  const key = getCacheKey(text, from || 'auto', to);

  // Check cache
  if (translationCache.has(key)) {
    console.log('[TransNova SW] Cache hit for:', text.substring(0, 30));
    return translationCache.get(key);
  }

  // Try Google Translate first (handles 100+ languages & auto-detection)
  let translation = await translateViaGoogle(text, from, to);

  // Fallback to MyMemory if Google fails
  if (!translation) {
    translation = await translateViaMyMemory(text, from, to);
  }

  if (translation && translation.trim().toLowerCase() !== text.trim().toLowerCase()) {
    if (translationCache.size >= CACHE_MAX) {
      const oldest = translationCache.keys().next().value;
      translationCache.delete(oldest);
    }
    translationCache.set(key, translation);
    return translation;
  }

  return null;
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
      .get(['enabled', 'myLanguage', 'partnerLanguage', 'mode', 'sendMode', 'readMode'])
      .then((res) => {
        sendResponse({
          enabled: res.enabled !== false,
          myLanguage: res.myLanguage || 'en',
          partnerLanguage: res.partnerLanguage || 'es',
          mode: res.mode !== undefined ? res.mode : 'off',
          sendMode: res.sendMode !== undefined ? res.sendMode : 'off',
          readMode: res.readMode !== undefined ? res.readMode : 'off',
        });
      });
    return true;
  }

  if (message.type === 'UPDATE_SETTINGS') {
    chrome.storage.local.set(message.settings).then(async () => {
      const fullSettings = await chrome.storage.local.get(['enabled', 'myLanguage', 'partnerLanguage', 'mode', 'sendMode', 'readMode']);
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
    const current = await chrome.storage.local.get(['enabled', 'sendMode', 'readMode']);
    const newState = !current.enabled;

    const updates = { enabled: newState };
    if (newState && (current.sendMode === 'off' || !current.sendMode) && (current.readMode === 'off' || !current.readMode)) {
      updates.sendMode = 'translate';
      updates.readMode = 'translate';
      updates.mode = 'both';
    }

    await chrome.storage.local.set(updates);

    const fullSettings = await chrome.storage.local.get(['enabled', 'myLanguage', 'partnerLanguage', 'mode', 'sendMode', 'readMode']);

    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_CHANGED',
        settings: fullSettings,
        triggeredByShortcut: true,
      }).catch(() => {});
    });
    console.log(`[TransNova SW] Translation ${newState ? 'enabled' : 'disabled'} via shortcut`);
  }
});
