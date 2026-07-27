/**
 * TransNova — Universal Multi-Language Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ── DOM Elements ───────────────────────────────────────────
  const enabledToggle = document.getElementById('enabledToggle');
  const toggleHint = document.getElementById('toggleHint');
  const statusBadge = document.getElementById('statusBadge');
  const myLanguageSelect = document.getElementById('myLanguageSelect');
  const partnerLanguageSelect = document.getElementById('partnerLanguageSelect');
  const sendModeSelect = document.getElementById('sendModeSelect');
  const readModeSelect = document.getElementById('readModeSelect');
  const sendModeBadge = document.getElementById('sendModeBadge');
  const readModeBadge = document.getElementById('readModeBadge');
  const sendTranslateOption = document.getElementById('sendTranslateOption');
  const readTranslateOption = document.getElementById('readTranslateOption');
  const platformName = document.getElementById('platformName');
  const popupContainer = document.querySelector('.popup-container');
  const swapModesBtn = document.getElementById('swapModesBtn');

  const myLangFlag = document.getElementById('myLangFlag');
  const partnerLangFlag = document.getElementById('partnerLangFlag');

  const FLAG_CODES = {
    en: 'gb', 'hi-Latn': 'in', hi: 'in', bho: 'in', es: 'es', fr: 'fr', de: 'de',
    'zh-CN': 'cn', ja: 'jp', ar: 'sa', pt: 'pt', ru: 'ru', ko: 'kr',
    it: 'it', tr: 'tr', nl: 'nl', pl: 'pl', vi: 'vn', th: 'th',
    id: 'id', bn: 'bd', pa: 'in', gu: 'in', ta: 'in', te: 'in',
    mr: 'in', ur: 'pk', fa: 'ir', he: 'il', sv: 'se', uk: 'ua', el: 'gr'
  };

  const LANG_NAMES = {
    'hi-Latn': 'Hinglish', hi: 'Hindi', bho: 'Bhojpuri', en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    'zh-CN': 'Chinese', ja: 'Japanese', ar: 'Arabic', pt: 'Portuguese',
    ru: 'Russian', ko: 'Korean', it: 'Italian', tr: 'Turkish', nl: 'Dutch',
    pl: 'Polish', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', bn: 'Bengali',
    pa: 'Punjabi', gu: 'Gujarati', ta: 'Tamil', te: 'Telugu', mr: 'Marathi',
    ur: 'Urdu', fa: 'Persian', he: 'Hebrew', sv: 'Swedish', uk: 'Ukrainian', el: 'Greek'
  };

  const CHAT_HOSTNAMES = [
    'web.whatsapp.com', 'web.telegram.org', 'telegram.org', 'discord.com',
    'app.slack.com', 'slack.com', 'messenger.com', 'facebook.com',
    'web.snapchat.com', 'snapchat.com',
  ];

  function updateFlags() {
    const myLang = myLanguageSelect ? myLanguageSelect.value : 'en';
    const partnerLang = partnerLanguageSelect ? partnerLanguageSelect.value : 'es';

    const myCountry = FLAG_CODES[myLang] || 'gb';
    const partnerCountry = FLAG_CODES[partnerLang] || 'in';

    if (myLangFlag) myLangFlag.src = `https://flagcdn.com/20x15/${myCountry}.png`;
    if (partnerLangFlag) partnerLangFlag.src = `https://flagcdn.com/20x15/${partnerCountry}.png`;
  }

  // ── Load Current Settings ──────────────────────────────────
  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response) {
        enabledToggle.checked = response.enabled !== false;
        updateEnabledUI(enabledToggle.checked);

        let myLang = response.myLanguage || 'en';
        let partnerLang = response.partnerLanguage || 'es';
        let sendMode = response.sendMode !== undefined ? response.sendMode : 'off';
        let readMode = response.readMode !== undefined ? response.readMode : 'off';

        // Legacy compatibility
        if (sendMode === 'en') { myLang = 'hi'; partnerLang = 'en'; sendMode = 'translate'; }
        else if (sendMode === 'hi') { myLang = 'en'; partnerLang = 'hi'; sendMode = 'translate'; }

        if (readMode === 'en') { myLang = 'hi'; partnerLang = 'en'; readMode = 'translate'; }
        else if (readMode === 'hi') { myLang = 'en'; partnerLang = 'hi'; readMode = 'translate'; }

        if (myLanguageSelect) myLanguageSelect.value = myLang;
        if (partnerLanguageSelect) partnerLanguageSelect.value = partnerLang;

        sendModeSelect.value = sendMode === 'off' ? 'off' : 'translate';
        readModeSelect.value = readMode === 'off' ? 'off' : 'translate';

        updateDynamicLabels();
      }
    } catch (e) {
      console.warn('[TransNova Popup] Could not load settings:', e);
    }
  }

  function updateDynamicLabels() {
    updateFlags();

    const myLang = myLanguageSelect ? myLanguageSelect.value : 'en';
    const partnerLang = partnerLanguageSelect ? partnerLanguageSelect.value : 'es';
    const myName = LANG_NAMES[myLang] || myLang.toUpperCase();
    const partnerName = LANG_NAMES[partnerLang] || partnerLang.toUpperCase();

    if (sendTranslateOption) {
      sendTranslateOption.textContent = `🌐 Translate to ${partnerName}`;
    }
    if (readTranslateOption) {
      readTranslateOption.textContent = `🌐 Translate to ${myName}`;
    }

    const sendMode = sendModeSelect.value;
    const readMode = readModeSelect.value;

    if (sendModeBadge) {
      sendModeBadge.textContent = sendMode === 'translate' ? `Send ${partnerName}` : 'Off';
    }
    if (readModeBadge) {
      readModeBadge.textContent = readMode === 'translate' ? `Read ${myName}` : 'Off';
    }
  }

  async function saveSettings() {
    const myLanguage = myLanguageSelect ? myLanguageSelect.value : 'en';
    const partnerLanguage = partnerLanguageSelect ? partnerLanguageSelect.value : 'es';
    const sendMode = sendModeSelect.value;
    const readMode = readModeSelect.value;

    updateDynamicLabels();

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: {
        myLanguage,
        partnerLanguage,
        sendMode,
        readMode,
        mode: sendMode === 'translate' || readMode === 'translate' ? 'both' : 'off',
      },
    });
  }

  async function detectPlatform() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        const isChat = CHAT_HOSTNAMES.some((h) => url.hostname.includes(h));
        if (isChat) {
          platformName.textContent = `${url.hostname} — Active`;
          platformName.style.color = '#34d399';
        } else {
          platformName.textContent = 'Inactive (Supported on Web Chat Apps Only)';
          platformName.style.color = '#94a3b8';
        }
      }
    } catch (e) {
      platformName.textContent = 'Web Chat AI Translation Active';
    }
  }

  // ── UI Update Functions ────────────────────────────────────
  function updateEnabledUI(enabled) {
    if (enabled) {
      statusBadge.classList.remove('inactive');
      statusBadge.querySelector('.status-text').textContent = 'Active';
      toggleHint.textContent = 'Live translation active for web chat apps';
      popupContainer.classList.remove('disabled');
    } else {
      statusBadge.classList.add('inactive');
      statusBadge.querySelector('.status-text').textContent = 'Paused';
      toggleHint.textContent = 'Translation is currently paused';
      popupContainer.classList.add('disabled');
    }
  }

  // ── Event Handlers ─────────────────────────────────────────
  enabledToggle.addEventListener('change', async () => {
    const enabled = enabledToggle.checked;
    updateEnabledUI(enabled);

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { enabled },
    });
  });

  if (myLanguageSelect) myLanguageSelect.addEventListener('change', saveSettings);
  if (partnerLanguageSelect) partnerLanguageSelect.addEventListener('change', saveSettings);
  sendModeSelect.addEventListener('change', saveSettings);
  readModeSelect.addEventListener('change', saveSettings);

  if (swapModesBtn) {
    swapModesBtn.addEventListener('click', async () => {
      const temp = myLanguageSelect.value;
      myLanguageSelect.value = partnerLanguageSelect.value;
      partnerLanguageSelect.value = temp;

      const icon = swapModesBtn.querySelector('.swap-icon');
      if (icon) {
        icon.classList.add('spinning');
        setTimeout(() => icon.classList.remove('spinning'), 400);
      }

      await saveSettings();
    });
  }

  // ── Initialize ─────────────────────────────────────────────
  await loadSettings();
  await detectPlatform();
});
