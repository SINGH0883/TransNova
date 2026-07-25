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

  // ── Safe Service Worker Messaging ────────────────────────────
  async function sendMessageSafe(msg) {
    if (isContextInvalidated) return null;
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
        throw new Error('Extension context invalidated.');
      }
      return await chrome.runtime.sendMessage(msg);
    } catch (err) {
      if (err.message && err.message.includes('context invalidated')) {
        isContextInvalidated = true;
        console.warn('[TransNova Universal] Extension reloaded/updated. Please refresh tab (F5) to reconnect.');
        showReloadToast();
      } else {
        console.error('[TransNova Universal] Messaging error:', err.message);
      }
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
          const prevReadMode = settings.readMode;
          const prevEnabled = settings.enabled;

          Object.assign(settings, message.settings);
          updateActivationIndicator();

          if (settings.enabled) {
            const currentReadMode = settings.readMode;
            if (currentReadMode === 'off' && prevReadMode !== 'off') {
              restoreAllOriginalMessages();
            } else if (currentReadMode !== 'off') {
              if (prevReadMode && prevReadMode !== currentReadMode && prevReadMode !== 'off') {
                restoreAllOriginalMessages();
              }
              setTimeout(processExistingMessages, 200);
            }
          } else {
            restoreAllOriginalMessages();
          }
        }
      });
    } catch (e) {
      // Ignore if context invalidated
    }
  }

  function restoreAllOriginalMessages() {
    if (!platform || !platform.selectors || !platform.selectors.messageRow) return;
    const messages = document.querySelectorAll(platform.selectors.messageRow);
    messages.forEach((msgEl) => {
      const textSpan = platform.getTextElement(msgEl);
      if (textSpan && translationMap.has(textSpan)) {
        const data = translationMap.get(textSpan);
        if (data && data.original) {
          textSpan.textContent = data.original;
        }
        translationMap.delete(textSpan);
      }
      if (msgEl.parentElement) {
        const badges = msgEl.parentElement.querySelectorAll('.transnova-badge, .transnova-loading');
        badges.forEach((b) => b.remove());
      }
      msgEl.removeAttribute('data-transnova-processed');
      processedMessages.delete(msgEl);
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

    let fromLang = null;
    let toLang = null;

    const isEng = TransNovaTranslator.isEnglish(text);
    const isHin = TransNovaTranslator.isHindi(text);

    const sendMode = settings.sendMode || (settings.mode === 'en-to-hi-send' ? 'hi' : settings.mode === 'en-to-hi' || settings.mode === 'read-en' ? 'off' : 'en');

    if (sendMode === 'en' && isHin) {
      fromLang = 'hi';
      toLang = 'en';
    } else if (sendMode === 'hi' && isEng) {
      fromLang = 'en';
      toLang = 'hi';
    }

    if (!fromLang || !toLang) return;

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
        console.log('[TransNova Chat] ✓ Translated:', text, '➔', response.translation);

        await TransNovaPlatforms.setInputText(inputEl, response.translation);

        skipInterceptionUntil = Date.now() + 2500;
        await sleep(300);

        const sendBtn = platform.getSendButton();
        if (sendBtn) {
          const actualBtn = sendBtn.closest('button') || sendBtn;
          triggerClick(actualBtn);
        } else if (inputEl.form) {
          inputEl.form.requestSubmit ? inputEl.form.requestSubmit() : inputEl.form.submit();
        } else {
          inputEl.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
            bubbles: true, cancelable: true,
          }));
          inputEl.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
            bubbles: true, cancelable: true,
          }));
        }
      } else {
        // Fallback: send original text if translation failed or context reloaded
        console.warn('[TransNova Chat] Translation fallback: sending original text');
        skipInterceptionUntil = Date.now() + 2000;
        const sendBtn = platform.getSendButton();
        if (sendBtn) {
          const actualBtn = sendBtn.closest('button') || sendBtn;
          triggerClick(actualBtn);
        } else if (inputEl.form) {
          inputEl.form.requestSubmit ? inputEl.form.requestSubmit() : inputEl.form.submit();
        } else {
          inputEl.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
            bubbles: true, cancelable: true,
          }));
        }
      }
    } catch (err) {
      if (inputEl.style) inputEl.style.opacity = '';
      console.error('[TransNova Chat] Translation error:', err.message);
    } finally {
      setTimeout(() => { isTranslatingInput = false; }, 400);
    }
  }

  // ── Universal Message Observer ───────────────────────────────
  function setupUniversalMessageObserver() {
    const observer = new MutationObserver((mutations) => {
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
    observer.observe(container, { childList: true, subtree: true });

    setInterval(processExistingMessages, 1500);
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
    messages.forEach((msg) => translateIncomingMessage(msg));
  }

  // ── Translate Incoming Messages ──────────────────────────────
  async function translateIncomingMessage(msgEl) {
    if (isContextInvalidated || !msgEl) return;
    if (processedMessages.has(msgEl) || msgEl.hasAttribute('data-transnova-processed')) return;

    const text = platform.getMessageText(msgEl);
    if (!text || !text.trim() || text.length < 2) return;

    if (isCodeSnippet(text)) {
      msgEl.setAttribute('data-transnova-processed', 'true');
      processedMessages.add(msgEl);
      return;
    }

    let fromLang = null;
    let toLang = null;

    const isEng = TransNovaTranslator.isEnglish(text);
    const isHin = TransNovaTranslator.isHindi(text);

    const readMode = settings.readMode || (settings.mode === 'hi-to-en' || settings.mode === 'en-to-hi-send' ? 'off' : settings.mode === 'read-en' ? 'en' : 'hi');

    if (readMode === 'hi' && isEng) {
      fromLang = 'en';
      toLang = 'hi';
    } else if (readMode === 'en' && isHin) {
      fromLang = 'hi';
      toLang = 'en';
    }

    if (!fromLang || !toLang) return;

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
        translationMap.set(textSpan, {
          original: text,
          translated: response.translation,
          showingTranslation: true,
        });

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
      const data = translationMap.get(textSpan);
      if (!data) return;

      if (data.showingTranslation) {
        textSpan.textContent = data.original;
        data.showingTranslation = false;
        badge.classList.add('transnova-badge--original');
        badge.title = `Translated: ${data.translated}`;
      } else {
        textSpan.textContent = data.translated;
        data.showingTranslation = true;
        badge.classList.remove('transnova-badge--original');
        badge.title = `Original: ${data.original}`;
      }
    });

    return badge;
  }

  function showActivationToast() {
    const toast = document.createElement('div');
    toast.className = 'transnova-toast';
    toast.innerHTML = `
      <div class="transnova-toast-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>
      </div>
      <div class="transnova-toast-text">
        <strong>TransNova Universal</strong>
        <span>Hindi ↔ English • ${platform.name}</span>
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
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'transnova-indicator';
      document.body.appendChild(indicator);
    }
    const sendMode = settings.sendMode || (settings.mode === 'en-to-hi-send' ? 'hi' : settings.mode === 'en-to-hi' || settings.mode === 'read-en' ? 'off' : 'en');
    const readMode = settings.readMode || (settings.mode === 'hi-to-en' || settings.mode === 'en-to-hi-send' ? 'off' : settings.mode === 'read-en' ? 'en' : 'hi');

    let text = 'हि ↔ EN';
    if (sendMode === 'en' && readMode === 'hi') text = 'हि ↔ EN (Both)';
    else if (sendMode === 'en') text = 'हि → EN (Send)';
    else if (sendMode === 'hi') text = 'EN → हि (Send)';
    else if (readMode === 'hi') text = 'EN → हि (Read)';
    else if (readMode === 'en') text = 'हि → EN (Read)';

    indicator.textContent = text;
  }

  // ── Start ────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
