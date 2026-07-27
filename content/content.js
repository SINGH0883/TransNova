/**
 * TransNova — Universal Web Content Script (v2.2)
 * Works across ALL websites & web apps.
 * Intercepts Hindi/Hinglish in text inputs & textareas.
 * Robust against Chrome Extension Context Invalidation (tab reload detection).
 */

(() => {
  'use strict';

  // ── State ────────────────────────────────────────────────────
  let settings = { enabled: true, mode: 'off', sendMode: 'off', readMode: 'off' };
  let platform = null;
  const processedMessages = new WeakSet();
  const translationMap = new WeakMap();
  let isTranslatingInput = false;
  let skipInterceptionUntil = 0;
  let isContextInvalidated = false;

  // Search engines to exclude from auto-incoming page translation
  const SEARCH_ENGINES = ['google.', 'bing.com', 'duckduckgo.com', 'search.yahoo.com', 'baidu.com', 'yandex.'];

  function isSearchEnginePage() {
    const host = window.location.hostname;
    const path = window.location.pathname;
    return SEARCH_ENGINES.some((se) => host.includes(se)) || path.includes('/search');
  }

  function isCodeSnippet(text) {
    if (!text) return true;
    if (text.includes('function(') || text.includes('var ') || text.includes('const ') || text.includes('let ')) return true;
    if (text.includes('addEventListener') || text.includes('querySelector') || text.includes('document.')) return true;
    if (text.startsWith('http://') || text.startsWith('https://')) return true;
    if (text.includes('gad_source=') || text.includes('x3dC')) return true;
    return false;
  }

  let messageObserver = null;
  let existingMessageInterval = null;

  function stopAllObservers() {
    if (messageObserver) {
      try { messageObserver.disconnect(); } catch (e) {}
      messageObserver = null;
    }
    if (existingMessageInterval) {
      try { clearInterval(existingMessageInterval); } catch (e) {}
      existingMessageInterval = null;
    }
    const indicator = document.querySelector('.transnova-indicator');
    if (indicator) indicator.remove();
  }

  // ── Safe Service Worker Messaging ────────────────────────────
  async function sendMessageSafe(msg) {
    if (isContextInvalidated) return null;

    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      isContextInvalidated = true;
      stopAllObservers();
      showReloadToast();
      return null;
    }

    try {
      return await chrome.runtime.sendMessage(msg);
    } catch (err) {
      isContextInvalidated = true;
      stopAllObservers();
      showReloadToast();
      return null;
    }
  }

  // ── Initialize ───────────────────────────────────────────────
  async function init() {
    platform = TransNovaPlatforms.detectPlatform();
    if (!platform) {
      console.log('[TransNova Chat] Disabled: Not a supported chatting platform on', window.location.hostname);
      return;
    }

    console.log(`[TransNova Chat] Active platform: ${platform.name} (${window.location.hostname})`);

    try {
      const response = await sendMessageSafe({ type: 'GET_SETTINGS' });
      if (response) {
        settings.enabled = response.enabled !== false;
        settings.myLanguage = response.myLanguage || 'en';
        settings.partnerLanguage = response.partnerLanguage || 'es';
        settings.mode = response.mode || 'off';
        settings.sendMode = response.sendMode !== undefined ? response.sendMode : 'off';
        settings.readMode = response.readMode !== undefined ? response.readMode : 'off';
      }
    } catch (e) {
      // Ignore
    }

    showActivationToast();
    updateActivationIndicator();
    setupUniversalInputInterceptor();
    setupUniversalMessageObserver();

    try {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SETTINGS_CHANGED') {
          Object.assign(settings, message.settings);
          updateActivationIndicator();

          restoreAllOriginalMessages();

          if (settings.enabled && settings.readMode && settings.readMode !== 'off') {
            setTimeout(processExistingMessages, 50);
          }
        }
      });
    } catch (e) {
      // Ignore if context invalidated
    }
  }

  function restoreAllOriginalMessages() {
    document.querySelectorAll('.transnova-badge, .transnova-loading').forEach((badge) => badge.remove());

    document.querySelectorAll('[data-transnova-original]').forEach((el) => {
      const originalText = el.getAttribute('data-transnova-original');
      if (originalText !== null) {
        el.textContent = originalText;
      }
      el.removeAttribute('data-transnova-original');
      el.removeAttribute('data-transnova-translated');
      el.removeAttribute('data-transnova-showing');
    });

    document.querySelectorAll('[data-transnova-processed]').forEach((el) => {
      el.removeAttribute('data-transnova-processed');
    });
  }

  // ── Universal Input Interceptor ──────────────────────────────
  function setupUniversalInputInterceptor() {
    document.addEventListener('keydown', handleKeyDown, true);
    console.log('[TransNova Universal] Input interceptor active across all web inputs.');
  }

  async function handleKeyDown(e) {
    if (Date.now() < skipInterceptionUntil) return;
    if (!settings.enabled) return;

    if (e.key !== 'Enter' || e.shiftKey) return;
    if (isTranslatingInput) return;

    const active = document.activeElement;
    if (!active || !TransNovaPlatforms.isInputElement(active)) return;

    const inputEl = platform.getInputElement() || active;
    const text = platform.getInputText(inputEl);
    if (!text || !text.trim() || text.length < 2) return;

    let fromLang = settings.myLanguage || 'auto';
    let toLang = settings.partnerLanguage || 'es';

    const sendMode = settings.sendMode;
    if (sendMode === 'off') return;

    if (sendMode === 'en') {
      fromLang = 'auto';
      toLang = 'en';
    } else if (sendMode === 'hi') {
      fromLang = 'auto';
      toLang = 'hi';
    }

    // If context was invalidated (extension reloaded), do not block Enter!
    if (isContextInvalidated) {
      console.log('[TransNova Chat] Context invalidated, allowing original text send.');
      showReloadToast();
      return;
    }

    console.log('[TransNova Chat] Intercepted outgoing input:', text, '(', fromLang, '➔', toLang, ')');

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    isTranslatingInput = true;

    try {
      if (inputEl.style) inputEl.style.opacity = '0.6';

      const response = await sendMessageSafe({
        type: 'TRANSLATE',
        text: text,
        from: fromLang,
        to: toLang,
      });

      if (inputEl.style) inputEl.style.opacity = '';

      if (response && response.success && response.translation) {
        console.log('[TransNova Chat] ✓ Translated in input box:', text, '➔', response.translation);
        await TransNovaPlatforms.setInputText(inputEl, response.translation);
      } else {
        console.log('[TransNova Chat] Translation fallback: keeping original text in input');
      }
    } catch (err) {
      if (inputEl.style) inputEl.style.opacity = '';
      console.log('[TransNova Chat] Translation error:', err.message);
    } finally {
      setTimeout(() => { isTranslatingInput = false; }, 200);
    }
  }

  // ── Universal Message Observer ───────────────────────────────
  function setupUniversalMessageObserver() {
    if (messageObserver) messageObserver.disconnect();
    if (existingMessageInterval) clearInterval(existingMessageInterval);

    messageObserver = new MutationObserver((mutations) => {
      if (!settings.enabled || isContextInvalidated) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scanForMessages(node);
          }
        }
      }
    });

    const container = document.querySelector(platform.selectors.messageContainer) || document.body;
    messageObserver.observe(container, { childList: true, subtree: true });

    existingMessageInterval = setInterval(processExistingMessages, 1500);
  }

  function scanForMessages(node) {
    if (!node || isContextInvalidated) return;

    const rowSelector = platform.selectors.messageRow;
    if (!rowSelector) return;

    if (node.matches && node.matches(rowSelector)) {
      handleMessageElement(node);
      return;
    }

    if (node.querySelectorAll) {
      const messages = node.querySelectorAll(rowSelector);
      messages.forEach(handleMessageElement);
    }
  }

  function handleMessageElement(msgEl) {
    if (platform.isIncoming(msgEl)) {
      translateIncomingMessage(msgEl);
    }
  }

  function processExistingMessages() {
    if (!settings.enabled || isContextInvalidated) return;

    const rowSelector = platform.selectors.messageRow;
    if (!rowSelector) return;

    const messages = document.querySelectorAll(rowSelector);
    messages.forEach((msg) => {
      if (platform.isIncoming(msg)) {
        translateIncomingMessage(msg);
      }
    });
  }

  // ── Translate Incoming Messages ──────────────────────────────
  async function translateIncomingMessage(msgEl) {
    if (isContextInvalidated || !msgEl) return;
    if (!platform.isIncoming(msgEl)) return;
    if (processedMessages.has(msgEl) || msgEl.hasAttribute('data-transnova-processed')) return;

    const text = platform.getMessageText(msgEl);
    if (!text || !text.trim() || text.length < 2) return;

    if (isCodeSnippet(text)) {
      msgEl.setAttribute('data-transnova-processed', 'true');
      processedMessages.add(msgEl);
      return;
    }

    const readMode = settings.readMode;
    if (readMode === 'off') return;

    let fromLang = 'auto';
    let toLang = settings.myLanguage || 'en';

    if (readMode === 'hi') {
      toLang = 'hi';
    } else if (readMode === 'en') {
      toLang = 'en';
    }

    msgEl.setAttribute('data-transnova-processed', 'true');
    processedMessages.add(msgEl);

    const textSpan = platform.getTextElement(msgEl);
    if (!textSpan) return;

    const loadingBadge = createLoadingBadge();
    if (textSpan.parentElement) {
      textSpan.parentElement.appendChild(loadingBadge);
    }

    try {
      const response = await sendMessageSafe({
        type: 'TRANSLATE',
        text: text,
        from: fromLang,
        to: toLang,
      });

      loadingBadge.remove();

      if (response && response.success && response.translation && response.translation.trim().toLowerCase() !== text.trim().toLowerCase()) {
        textSpan.setAttribute('data-transnova-original', text);
        textSpan.setAttribute('data-transnova-translated', response.translation);
        textSpan.setAttribute('data-transnova-showing', 'translated');

        textSpan.textContent = response.translation;
        const badge = createTranslationBadge(textSpan, text, response.translation);
        if (textSpan.parentElement) {
          textSpan.parentElement.appendChild(badge);
        }
      }
    } catch (err) {
      loadingBadge.remove();
    }
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function triggerClick(el) {
    if (!el) return;
    try {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } catch (e) {
      el.click();
    }
  }

  // ── UI Elements ──────────────────────────────────────────────
  function createLoadingBadge() {
    const badge = document.createElement('span');
    badge.className = 'transnova-loading';
    badge.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" class="transnova-spinner">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="30 70" /></svg>`;
    return badge;
  }

  function createTranslationBadge(textSpan, original, translated) {
    const badge = document.createElement('span');
    badge.className = 'transnova-badge';
    badge.title = `Original: ${original}`;
    badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`;

    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const orig = textSpan.getAttribute('data-transnova-original') || original;
      const trans = textSpan.getAttribute('data-transnova-translated') || translated;
      const showing = textSpan.getAttribute('data-transnova-showing') || 'translated';

      if (showing === 'translated') {
        textSpan.textContent = orig;
        textSpan.setAttribute('data-transnova-showing', 'original');
        badge.classList.add('transnova-badge--original');
        badge.title = `Translated: ${trans}`;
      } else {
        textSpan.textContent = trans;
        textSpan.setAttribute('data-transnova-showing', 'translated');
        badge.classList.remove('transnova-badge--original');
        badge.title = `Original: ${orig}`;
      }
    });

    return badge;
  }

  const LANG_NAMES = {
    'hi-Latn': 'Hinglish', hi: 'Hindi', bho: 'Bhojpuri', en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    'zh-CN': 'Chinese', ja: 'Japanese', ar: 'Arabic', pt: 'Portuguese', ru: 'Russian', ko: 'Korean',
    it: 'Italian', tr: 'Turkish', nl: 'Dutch', pl: 'Polish', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian',
    bn: 'Bengali', pa: 'Punjabi', gu: 'Gujarati', ta: 'Tamil', te: 'Telugu', mr: 'Marathi', ur: 'Urdu',
    fa: 'Persian', he: 'Hebrew', sv: 'Swedish', uk: 'Ukrainian', el: 'Greek'
  };

  function showActivationToast() {
    const myLang = settings.myLanguage || 'en';
    const partnerLang = settings.partnerLanguage || 'es';
    const myName = LANG_NAMES[myLang] || myLang.toUpperCase();
    const partnerName = LANG_NAMES[partnerLang] || partnerLang.toUpperCase();

    const toast = document.createElement('div');
    toast.className = 'transnova-toast';
    toast.innerHTML = `
      <div class="transnova-toast-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>
      </div>
      <div class="transnova-toast-text">
        <strong>TransNova AI</strong>
        <span>${myName} ↔ ${partnerName} • ${platform ? platform.name : 'Web App'}</span>
      </div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('transnova-toast--exit');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  function showReloadToast() {
    if (document.querySelector('.transnova-toast-reload')) return;
    const toast = document.createElement('div');
    toast.className = 'transnova-toast transnova-toast-reload';
    toast.innerHTML = `
      <div class="transnova-toast-icon" style="background:#f59e0b">🔄</div>
      <div class="transnova-toast-text">
        <strong>TransNova Updated</strong>
        <span>Please refresh tab (F5) to reconnect</span>
      </div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('transnova-toast--exit');
      setTimeout(() => toast.remove(), 400);
    }, 6000);
  }

  function updateActivationIndicator() {
    let indicator = document.querySelector('.transnova-indicator');
    if (!settings.enabled || isContextInvalidated) {
      if (indicator) indicator.remove();
      return;
    }

    const sendMode = settings.sendMode || 'off';
    const readMode = settings.readMode || 'off';

    if (sendMode === 'off' && readMode === 'off') {
      if (indicator) indicator.remove();
      return;
    }

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'transnova-indicator';
      document.body.appendChild(indicator);
    }

    const myLang = settings.myLanguage || 'en';
    const partnerLang = settings.partnerLanguage || 'es';
    const myName = LANG_NAMES[myLang] || myLang.toUpperCase();
    const partnerName = LANG_NAMES[partnerLang] || partnerLang.toUpperCase();

    let text = 'TransNova';
    if (sendMode === 'translate' && readMode === 'translate') text = `${myName} ↔ ${partnerName}`;
    else if (sendMode === 'translate') text = `Send ${partnerName}`;
    else if (readMode === 'translate') text = `Read ${myName}`;
    else text = `${myName} ↔ ${partnerName}`;

    indicator.textContent = text;
  }

  // ── Start ────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
