# TransNova — Hindi ↔ English Web Chat Translator

<div align="center">

<img src="./icons/icon128.png" width="128" alt="TransNova Logo" />

**Real-time Hindi ↔ English translation for Web Chat Platforms**

Type in Hindi, send in English. Receive in English, read in Hindi. Works exclusively on web chat apps like WhatsApp Web, Telegram Web, Discord Web, Slack Web, and Messenger Web.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#installation)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-8B5CF6?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](#license)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🇮🇳 → 🇬🇧 **Hindi to English** | Type messages in Hindi/Hinglish — automatically translated to English before sending |
| 🇬🇧 → 🇮🇳 **English to Hindi** | Incoming English messages are displayed to you in Hindi |
| 🔄 **Bidirectional Mode** | Enable both directions simultaneously for seamless bilingual chat |
| 🔀 **One-Click Toggle** | Switch between Hindi→English, English→Hindi, or Both from the popup |
| ⌨️ **Keyboard Shortcut** | Press `Alt+T` to instantly toggle translation on/off |
| 💬 **Original Text Toggle** | Click the translation badge on any message to view the original text |
| ⚡ **Smart Caching** | LRU cache avoids redundant API calls for repeated phrases |
| 🔍 **Auto Language Detection** | Detects Hindi (Devanagari script & Romanized Hinglish) vs English automatically |
| 💬 **Chat Platform Exclusive** | Operates strictly on supported web chat platforms, keeping general browsing fast and clean |

---

## 📸 How It Works

```
You type in Hindi ──► TransNova translates ──► Recipient sees English
                         ↕
Sender writes English ──► TransNova translates ──► You read in Hindi
```

### Translation Modes

| Mode | Your Input | Their View | Their Input | Your View |
|---|---|---|---|---|
| **Send in English** | Hindi/Hinglish | English | — | — |
| **Send in Hindi** | English | Devanagari Hindi | — | — |
| **Read in Hindi** | — | — | English | Devanagari Hindi |
| **Read in English** | — | — | Hindi/Hinglish | English |
| **Bidirectional (Both)** ⭐ | Hindi/Hinglish | English | English / Hindi | Hindi / English |

---

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone or download** this repository:
   ```bash
   git clone https://github.com/SINGH0883/TransNova.git
   ```

2. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions
   ```

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked**

5. Select the `TransNova` folder

6. The TransNova icon will appear in your Chrome toolbar 🎉

---

## 🎯 Usage

### Getting Started

1. Open any supported web chat platform (e.g. [WhatsApp Web](https://web.whatsapp.com), [Telegram Web](https://web.telegram.org))
2. You'll see a **"TransNova Chat"** toast notification in the bottom-right
3. **Click the TransNova icon** in your toolbar to open the control panel
4. **Select your mode** and start chatting!

### Translation Modes

- **हि → EN (Send in English)** — Your Hindi/Hinglish messages are translated to English before sending
- **EN → हि (Read in Hindi)** — Incoming English messages appear in Hindi
- **हि ↔ EN (Both Directions)** — Full bidirectional translation (default)

### Quick Toggle

Press **`Alt + T`** at any time to toggle translation on/off without opening the popup.

### Viewing Original Text

Every translated message has a small 🌐 badge. **Click it** to switch between the original and translated text.

---

## 🏗️ Project Structure

```
TransNova/
├── manifest.json               # Chrome Extension manifest (V3)
├── icons/
│   ├── icon16.png              # Toolbar icon
│   ├── icon32.png              # Small icon
│   ├── icon48.png              # Medium icon
│   └── icon128.png             # Store / management page icon
├── lib/
│   ├── translator.js           # Translation engine (API + cache + detection)
│   └── platforms.js            # Chat platform DOM selectors & adapters
├── background/
│   └── service-worker.js       # API relay, settings, keyboard shortcuts
├── content/
│   ├── content.js              # DOM observer + input interception
│   └── content.css             # Badges, spinners, toasts (non-intrusive)
└── popup/
    ├── popup.html              # Extension popup panel
    ├── popup.css               # Dark glassmorphism UI
    └── popup.js                # Settings controller
```

---

## 🌐 Translation API

TransNova uses the **[MyMemory Translation API](https://mymemory.translated.net/)** — a free, no-signup-required translation service.

| Tier | Daily Limit | Requirement |
|---|---|---|
| **Anonymous** | 5,000 characters/day | None — works out of the box |
| **Extended** | 50,000 characters/day | Provide an email in the API request |

> **Note:** The usage tracker in the popup helps you monitor your daily consumption.

---

## 🛠️ Supported Platforms

| Platform | Status | Scope |
|---|---|---|
| **WhatsApp Web** | ✅ Fully Supported | Real-time chat & inputs |
| **Telegram Web** | ✅ Fully Supported | WebK & WebZ interfaces |
| **Discord** | ✅ Fully Supported | Text channels & DMs |
| **Slack** | ✅ Fully Supported | Workspaces & channels |
| **Messenger / Facebook** | ✅ Fully Supported | Chat messages |

---

## 🔑 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + T` | Toggle translation on/off |

You can customize this shortcut in `chrome://extensions/shortcuts`.

---

## 🐛 Troubleshooting

### Translation not working?

1. Make sure the extension is **enabled** (check the popup — status should say "Active")
2. Verify you're on a supported web chat platform (e.g. WhatsApp, Telegram, Discord, Slack, Messenger)
3. Check the **usage counter** — you may have hit the daily limit
4. Open DevTools (`F12`) → Console tab → look for `[TransNova]` logs

### Messages not being detected?

Web chat platforms occasionally update their DOM structure. If messages aren't being detected:
1. Try **refreshing** the chat tab
2. Check for extension **updates**
3. Open an issue on GitHub with the browser console output

### Input text not being replaced?

Some chat platform updates change the input field structure. The extension uses multiple fallback selectors, but if it still fails:
1. Reload the extension from `chrome://extensions`
2. Refresh the web chat page

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/new-platform`
3. **Commit** your changes: `git commit -m "Add new platform adapter"`
4. **Push** to the branch: `git push origin feature/new-platform`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Developed with ❤️ by Yuvraj Singh**

*TransNova — Breaking language barriers, one chat at a time*

</div>
