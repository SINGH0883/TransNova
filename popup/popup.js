/**
 * TransNova — Popup Controller
 * Controls settings, 10,000 daily character quota meter,
 * mode switching, and real-time connection status.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ── DOM Elements ───────────────────────────────────────────
  const enabledToggle = document.getElementById('enabledToggle');
  const toggleHint = document.getElementById('toggleHint');
  const statusBadge = document.getElementById('statusBadge');
  const sendModeSelect = document.getElementById('sendModeSelect');
  const readModeSelect = document.getElementById('readModeSelect');
  const sendModeBadge = document.getElementById('sendModeBadge');
  const readModeBadge = document.getElementById('readModeBadge');
  const platformName = document.getElementById('platformName');
  const popupContainer = document.querySelector('.popup-container');

  const sendLabels = {
    en: 'Send English',
    hi: 'Send Hindi',
    off: 'Outgoing Off',
  };

  const readLabels = {
    hi: 'Read Hindi',
    en: 'Read English',
    off: 'Incoming Off',
  };

  const CHAT_HOSTNAMES = [
    'web.whatsapp.com',
    'web.telegram.org',
    'telegram.org',
    'discord.com',
    'app.slack.com',
    'slack.com',
    'messenger.com',
    'facebook.com',
    'web.snapchat.com',
    'snapchat.com',
  ];

  // ── Load Current Settings ──────────────────────────────────
  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response) {
        enabledToggle.checked = response.enabled !== false;
        updateEnabledUI(enabledToggle.checked);

        const sendMode = response.sendMode !== undefined ? response.sendMode : 'off';
        const readMode = response.readMode !== undefined ? response.readMode : 'off';

        sendModeSelect.value = sendMode;
        readModeSelect.value = readMode;

        updateBadges(sendMode, readMode);
      }
    } catch (e) {
      console.warn('[TransNova Popup] Could not load settings:', e);
    }
  }

  function updateBadges(sendMode, readMode) {
    if (sendModeBadge) sendModeBadge.textContent = sendLabels[sendMode] || 'Send English';
    if (readModeBadge) readModeBadge.textContent = readLabels[readMode] || 'Read Hindi';
  }

  async function saveSettings() {
    const sendMode = sendModeSelect.value;
    const readMode = readModeSelect.value;

    updateBadges(sendMode, readMode);

    let mode = 'both';
    if (sendMode === 'en' && readMode === 'off') mode = 'hi-to-en';
    else if (sendMode === 'hi' && readMode === 'off') mode = 'en-to-hi-send';
    else if (sendMode === 'off' && readMode === 'hi') mode = 'en-to-hi';
    else if (sendMode === 'off' && readMode === 'en') mode = 'read-en';
    else if (sendMode === 'off' && readMode === 'off') mode = 'off';

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: {
        sendMode,
        readMode,
        mode,
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

  sendModeSelect.addEventListener('change', saveSettings);
  readModeSelect.addEventListener('change', saveSettings);

  // ── Initialize ─────────────────────────────────────────────
  await loadSettings();
  await detectPlatform();
});
