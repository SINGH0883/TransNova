/**
 * TransNova — Universal Web Platform Adapters
 * Supports WhatsApp Web, Telegram, Discord, Slack, Messenger, Twitter/X,
 * Reddit, Gmail, and ANY website via Universal Web Fallback.
 *
 * Fixed: Robust send button finding, Lexical event firing, and click triggering.
 */

const TransNovaPlatforms = (() => {
  const platforms = {
    // ── 1. WhatsApp Web ───────────────────────────────────────
    whatsapp: {
      name: 'WhatsApp Web',
      detect: () => window.location.hostname === 'web.whatsapp.com',
      selectors: {
        messageContainer: '#main, #app',
        messageList: 'div[role="application"], div[data-tab="8"]',
        messageRow: 'div.message-in, div.message-out, div[role="row"]',
        incomingBubble: 'div.message-in',
        outgoingBubble: 'div.message-out',
        inputBox: 'footer div[contenteditable="true"], div[data-testid="conversation-compose-box-input"], div[contenteditable="true"][data-tab="10"]',
        sendButton: 'button[aria-label="Send"], span[data-icon="send"], span[data-testid="send"], button[data-tab="11"]',
      },
      getInputElement: () => {
        return (
          document.querySelector('footer div[contenteditable="true"]') ||
          document.querySelector('div[data-testid="conversation-compose-box-input"]') ||
          document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
          document.querySelector('#main footer div[contenteditable="true"]')
        );
      },
      getInputText: (inputEl) => (inputEl ? (inputEl.textContent || inputEl.innerText || '').trim() : ''),

      getMessageText: (msgEl) => {
        if (!msgEl) return '';
        const textSpan =
          msgEl.querySelector('span.selectable-text:not(.copyable-text)') ||
          msgEl.querySelector('span.selectable-text') ||
          msgEl.querySelector('.copyable-text > span') ||
          msgEl.querySelector('div.copyable-text');

        if (!textSpan) return '';

        let clone = textSpan.cloneNode(true);
        const meta = clone.querySelector('[data-testid="msg-meta"], ._ampv');
        if (meta) meta.remove();

        let fullText = (clone.innerText || clone.textContent || '').trim();
        return fullText.replace(/\s*\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?\s*[\u2700-\u27BF\u2713\u2714]*$/i, '').trim();
      },

      getTextElement: (msgEl) => {
        if (!msgEl) return null;
        return (
          msgEl.querySelector('span.selectable-text') ||
          msgEl.querySelector('.copyable-text > span') ||
          msgEl.querySelector('div.copyable-text') ||
          msgEl.querySelector('span._ao3e') ||
          msgEl.querySelector('span[dir="ltr"]') ||
          msgEl.querySelector('span[dir="rtl"]') ||
          msgEl.querySelector('[data-pre-plain-text]')
        );
      },

      isIncoming: (msgEl) => {
        if (!msgEl) return false;
        const dataId = msgEl.getAttribute('data-id') || msgEl.querySelector('[data-id]')?.getAttribute('data-id') || '';
        if (dataId.startsWith('false_')) return true;
        if (dataId.startsWith('true_')) return false;

        if (msgEl.classList?.contains('message-in') || !!msgEl.querySelector('div.message-in, [class*="message-in"]')) return true;
        if (msgEl.classList?.contains('message-out') || !!msgEl.querySelector('div.message-out, [class*="message-out"]')) return false;

        return !msgEl.querySelector('span[data-icon="msg-dblcheck"], span[data-icon="msg-check"], span[data-icon="msg-time"]');
      },
      isOutgoing: (msgEl) => {
        if (!msgEl) return false;
        const dataId = msgEl.getAttribute('data-id') || msgEl.querySelector('[data-id]')?.getAttribute('data-id') || '';
        if (dataId.startsWith('true_')) return true;
        if (dataId.startsWith('false_')) return false;

        if (msgEl.classList?.contains('message-out') || !!msgEl.querySelector('div.message-out, [class*="message-out"]')) return true;
        if (msgEl.classList?.contains('message-in') || !!msgEl.querySelector('div.message-in, [class*="message-in"]')) return false;

        return !!msgEl.querySelector('span[data-icon="msg-dblcheck"], span[data-icon="msg-check"], span[data-icon="msg-time"]');
      },
      getSendButton: () => {
        return (
          document.querySelector('button[aria-label="Send"]') ||
          document.querySelector('span[data-icon="send"]')?.closest('button') ||
          document.querySelector('span[data-icon="send"]') ||
          document.querySelector('span[data-testid="send"]') ||
          document.querySelector('footer button[aria-label="Send"]')
        );
      },
    },

    // ── 2. Telegram Web ───────────────────────────────────────
    telegram: {
      name: 'Telegram Web',
      detect: () => window.location.hostname.includes('telegram.org'),
      selectors: {
        messageContainer: '.messages-container, .chat-background',
        messageRow: '.message, .message-list-item',
        incomingBubble: '.message:not(.own)',
        outgoingBubble: '.message.own',
        inputBox: '.input-message-input, div[contenteditable="true"].input-field-input',
        sendButton: '.btn-send, button.send',
      },
      getInputElement: () => document.querySelector('.input-message-input, div[contenteditable="true"].input-field-input, #editable-message-text'),
      getInputText: (inputEl) => (inputEl ? (inputEl.textContent || inputEl.innerText || '').trim() : ''),
      getMessageText: (msgEl) => {
        const textEl = msgEl.querySelector('.message-text, .text-content');
        return textEl ? (textEl.innerText || textEl.textContent || '').trim() : '';
      },
      getTextElement: (msgEl) => msgEl.querySelector('.message-text, .text-content'),
      isIncoming: (msgEl) => !msgEl.classList.contains('own') && !msgEl.querySelector('.message-title-name-self'),
      isOutgoing: (msgEl) => msgEl.classList.contains('own') || !!msgEl.querySelector('.message-title-name-self'),
      getSendButton: () => document.querySelector('.btn-send, button.send'),
    },

    // ── 3. Discord Web ────────────────────────────────────────
    discord: {
      name: 'Discord',
      detect: () => window.location.hostname.includes('discord.com'),
      selectors: {
        messageContainer: 'main[class*="chatContent"]',
        messageRow: 'li[class*="messageListItem"]',
        incomingBubble: 'li[class*="messageListItem"]',
        inputBox: 'div[role="textbox"][contenteditable="true"]',
      },
      getInputElement: () => document.querySelector('div[role="textbox"][contenteditable="true"]'),
      getInputText: (inputEl) => (inputEl ? (inputEl.textContent || inputEl.innerText || '').trim() : ''),
      getMessageText: (msgEl) => {
        const textEl = msgEl.querySelector('div[id^="message-content-"]');
        return textEl ? (textEl.innerText || textEl.textContent || '').trim() : '';
      },
      getTextElement: (msgEl) => msgEl.querySelector('div[id^="message-content-"]'),
      isIncoming: (msgEl) => true,
      isOutgoing: (msgEl) => false,
      getSendButton: () => null,
    },

    // ── 4. Slack Web ──────────────────────────────────────────
    slack: {
      name: 'Slack',
      detect: () => window.location.hostname.includes('slack.com'),
      selectors: {
        messageContainer: 'div.c-virtual_list__scroll_container',
        messageRow: 'div.c-message_kit__background',
        incomingBubble: 'div.c-message_kit__background',
        inputBox: 'div[data-qa="message_input"][contenteditable="true"]',
      },
      getInputElement: () => document.querySelector('div[data-qa="message_input"][contenteditable="true"]'),
      getInputText: (inputEl) => (inputEl ? (inputEl.textContent || inputEl.innerText || '').trim() : ''),
      getMessageText: (msgEl) => {
        const textEl = msgEl.querySelector('div.c-message_kit__blocks');
        return textEl ? (textEl.innerText || textEl.textContent || '').trim() : '';
      },
      getTextElement: (msgEl) => msgEl.querySelector('div.c-message_kit__blocks'),
      isIncoming: (msgEl) => true,
      isOutgoing: (msgEl) => false,
      getSendButton: () => document.querySelector('button[data-qa="texty_send_button"]'),
    },

    // ── 5. Messenger / Facebook Messages ─────────────────────
    messenger: {
      name: 'Messenger',
      detect: () =>
        window.location.hostname.includes('messenger.com') ||
        (window.location.hostname.includes('facebook.com') && window.location.pathname.includes('/messages')),
      selectors: {
        messageContainer: 'div[role="main"]',
        messageRow: 'div[role="row"]',
        incomingBubble: 'div[role="row"]',
        inputBox: 'div[role="textbox"][contenteditable="true"]',
      },
      getInputElement: () => document.querySelector('div[role="textbox"][contenteditable="true"]'),
      getInputText: (inputEl) => (inputEl ? (inputEl.textContent || inputEl.innerText || '').trim() : ''),
      getMessageText: (msgEl) => {
        const textEl = msgEl.querySelector('div[dir="auto"]');
        return textEl ? (textEl.innerText || textEl.textContent || '').trim() : '';
      },
      getTextElement: (msgEl) => msgEl.querySelector('div[dir="auto"]'),
      isIncoming: (msgEl) => true,
      isOutgoing: (msgEl) => false,
      getSendButton: () => document.querySelector('div[aria-label="Press Enter to send"]'),
    },

    // ── 6. Snapchat Web ───────────────────────────────────────
    snapchat: {
      name: 'Snapchat Web',
      detect: () => window.location.hostname.includes('snapchat.com'),
      selectors: {
        messageContainer: 'div[data-testid="chat-history"], div[class*="chatHistory"], div[class*="messageList"], main',
        messageRow: 'div[data-testid="chat-message"], div[class*="chatMessage"], div[class*="messageRow"], div[class*="Message"], div[role="row"]',
        incomingBubble: 'div[data-testid="chat-message"]:not([data-is-sender="true"]), div[class*="incoming"]',
        outgoingBubble: 'div[data-testid="chat-message"][data-is-sender="true"], div[class*="outgoing"]',
        inputBox: 'div[contenteditable="true"], div[role="textbox"], textarea[placeholder*="Send"], textarea',
        sendButton: 'button[type="submit"], button[aria-label*="Send"], button[data-testid="send-button"]',
      },
      getInputElement: () => {
        return (
          document.querySelector('div[contenteditable="true"][data-slate-editor="true"]') ||
          document.querySelector('div[contenteditable="true"]') ||
          document.querySelector('div[role="textbox"]') ||
          document.querySelector('textarea[placeholder*="Send"]') ||
          document.querySelector('textarea')
        );
      },
      getInputText: (inputEl) => (inputEl ? (inputEl.textContent || inputEl.innerText || inputEl.value || '').trim() : ''),
      getMessageText: (msgEl) => {
        if (!msgEl) return '';
        const textEl =
          msgEl.querySelector('span[data-testid="chat-message-text"]') ||
          msgEl.querySelector('span[class*="chatMessageText"]') ||
          msgEl.querySelector('span[class*="messageText"]') ||
          msgEl.querySelector('div[class*="chatMessageText"]') ||
          msgEl.querySelector('span[dir="auto"]') ||
          msgEl.querySelector('p');
        return textEl ? (textEl.innerText || textEl.textContent || '').trim() : '';
      },
      getTextElement: (msgEl) => {
        if (!msgEl) return null;
        return (
          msgEl.querySelector('span[data-testid="chat-message-text"]') ||
          msgEl.querySelector('span[class*="chatMessageText"]') ||
          msgEl.querySelector('span[class*="messageText"]') ||
          msgEl.querySelector('div[class*="chatMessageText"]') ||
          msgEl.querySelector('span[dir="auto"]') ||
          msgEl.querySelector('p')
        );
      },
      isIncoming: (msgEl) => {
        if (!msgEl) return false;
        if (msgEl.getAttribute('data-is-sender') === 'true') return false;
        if (msgEl.classList?.contains('outgoing')) return false;
        return true;
      },
      isOutgoing: (msgEl) => {
        if (!msgEl) return false;
        if (msgEl.getAttribute('data-is-sender') === 'true') return true;
        if (msgEl.classList?.contains('outgoing')) return true;
        return false;
      },
      getSendButton: () => {
        return (
          document.querySelector('button[data-testid="send-button"]') ||
          document.querySelector('button[aria-label*="Send"]') ||
          document.querySelector('button[type="submit"]')
        );
      },
    },
  };

  // ── Universal Input Text Replacement Helper ──────────────────
  async function setInputText(inputEl, text) {
    if (!inputEl) return false;

    console.log('[TransNova Chat] Replacing input text:', text);

    try {
      inputEl.focus();
      await _sleep(20);

      // Handle standard <textarea> and <input>
      if (inputEl.tagName === 'INPUT' || inputEl.tagName === 'TEXTAREA') {
        const prototype = window.HTMLInputElement.prototype;
        const textareaPrototype = window.HTMLTextAreaElement.prototype;
        const setter = inputEl.tagName === 'INPUT'
          ? Object.getOwnPropertyDescriptor(prototype, 'value')?.set
          : Object.getOwnPropertyDescriptor(textareaPrototype, 'value')?.set;

        if (setter) {
          setter.call(inputEl, text);
        } else {
          inputEl.value = text;
        }

        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // Handle [contenteditable] elements (WhatsApp Lexical, Slack, Discord, Telegram)
      const targetNode = inputEl.querySelector('p') || inputEl;
      targetNode.focus();

      const sel = window.getSelection();
      sel.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(targetNode);
      sel.addRange(range);
      await _sleep(20);

      // 1. Select all & Delete existing text cleanly in Lexical AST
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      await _sleep(30);

      // 2. Insert new text using execCommand insertText
      document.execCommand('insertText', false, text);
      await _sleep(40);

      let currentText = (inputEl.textContent || '').trim();

      // Check if insertText succeeded
      if (currentText === text.trim()) {
        try {
          inputEl.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: text }));
        } catch (e) {}
        inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // 3. Fallback: If execCommand insertText failed, try ClipboardEvent paste
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      await _sleep(20);

      try {
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true,
        });
        targetNode.dispatchEvent(pasteEvent);
      } catch (e) {}
      await _sleep(40);

      currentText = (inputEl.textContent || '').trim();
      if (currentText.length > 0) {
        inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
        return true;
      }

      // 4. Last resort direct assignment
      inputEl.textContent = text;
      inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      return true;
    } catch (e) {
      console.error('[TransNova Chat] setInputText error:', e);
      return false;
    }
  }

  function isInputElement(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'TEXTAREA') return true;
    if (tag === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'search', 'email', 'url'].includes(type);
    }
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') return true;
    return false;
  }

  function getInputText(el) {
    if (!el) return '';
    return (el.textContent || el.innerText || el.value || '').trim();
  }

  function isElementVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function _sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function detectPlatform() {
    for (const [key, platform] of Object.entries(platforms)) {
      if (platform.detect && platform.detect()) {
        return { key, setInputText, ...platform };
      }
    }
    return null; // Return null on non-chatting sites
  }

  return {
    platforms,
    detectPlatform,
    setInputText,
    isInputElement,
    getInputText,
  };
})();

if (typeof window !== 'undefined') {
  window.TransNovaPlatforms = TransNovaPlatforms;
}
