# TransNova — Hindi ↔ English Chat Translator

<div align="center">

![TransNova](icons/icon128.png)

**Real-time Hindi-English translation for WhatsApp Web**

Type in Hindi, send in English. Receive in English, read in Hindi.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#installation)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-8B5CF6?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](#license)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🇮🇳 → 🇬🇧 **Hindi to English** | Type messages in Hindi — they're automatically translated to English before sending |
| 🇬🇧 → 🇮🇳 **English to Hindi** | Incoming English messages are displayed to you in Hindi |
| 🔄 **Bidirectional Mode** | Enable both directions simultaneously for seamless bilingual chat |
| 🔀 **One-Click Toggle** | Switch between Hindi→English, English→Hindi, or Both from the popup |
| ⌨️ **Keyboard Shortcut** | Press `Alt+T` to instantly toggle translation on/off |
| 💬 **Original Text Toggle** | Click the translation badge on any message to see the original text |
| 📊 **Usage Tracker** | Monitor your daily character usage against the free API limit |
| ⚡ **Smart Caching** | LRU cache avoids redundant API calls for repeated phrases |
| 🔍 **Auto Language Detection** | Detects Hindi (Devanagari script) vs English automatically — no manual switching needed |

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
| **Hindi → English** | Hindi | English | — | — |
| **English → Hindi** | — | — | English | Hindi |
| **Both** ⭐ | Hindi | English | English | Hindi |

---

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone or download** this repository:
   ```bash
   git clone https://github.com/your-username/TransNova.git
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

1. **Open** [WhatsApp Web](https://web.whatsapp.com) in Chrome
2. You'll see a **"TransNova Active"** toast notification in the bottom-right
3. **Click the TransNova icon** in your toolbar to open the control panel
4. **Select your mode** and start chatting!

### Translation Modes

- **हि → EN (Send in English)** — Your Hindi messages are translated to English before sending
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
│   └── platforms.js            # WhatsApp Web DOM selectors & adapters
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

## ⚙️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                  WhatsApp Web Tab                     │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐    │
│  │ translator.js │    │      content.js           │    │
│  │ (detection +  │◄──►│ (MutationObserver +      │    │
│  │  cache)       │    │  input interception)      │    │
│  └──────────────┘    └───────────┬──────────────┘    │
│                                  │                    │
└──────────────────────────────────┼────────────────────┘
                                   │ chrome.runtime
                                   │ .sendMessage()
                    ┌──────────────▼──────────────┐
                    │    service-worker.js         │
                    │  (API calls, settings,       │
                    │   caching, shortcuts)        │
                    └──────────────▲──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │       popup.js               │
                    │  (UI controls, mode          │
                    │   selection, usage stats)    │
                    └─────────────────────────────┘
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

| Platform | Status | Notes |
|---|---|---|
| **WhatsApp Web** | ✅ Fully Supported | Primary target — optimized selectors |
| Other chat platforms | 🔜 Planned | Adapter system ready for expansion |

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
2. Verify you're on **web.whatsapp.com**
3. Check the **usage counter** — you may have hit the daily limit
4. Open DevTools (`F12`) → Console tab → look for `[TransNova]` logs

### Messages not being detected?

WhatsApp Web occasionally updates its DOM structure. If messages aren't being detected:
1. Try **refreshing** the WhatsApp Web page
2. Check for extension **updates**
3. Open an issue on GitHub with the browser console output

### Input text not being replaced?

Some WhatsApp Web updates change the input field structure. The extension uses multiple fallback selectors, but if it still fails:
1. Reload the extension from `chrome://extensions`
2. Refresh WhatsApp Web

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/telegram-support`
3. **Commit** your changes: `git commit -m "Add Telegram Web adapter"`
4. **Push** to the branch: `git push origin feature/telegram-support`
5. **Open** a Pull Request

### Adding a New Platform

The adapter system in `lib/platforms.js` makes it easy to add new chat platforms:

```javascript
// Add your platform to the platforms object
newPlatform: {
  name: 'Platform Name',
  hostname: 'platform.example.com',
  selectors: {
    messageContainer: '...',
    incomingMessage: '...',
    inputBox: '...',
    // ... other selectors
  },
  detect: () => window.location.hostname === 'platform.example.com',
  // ... adapter methods
}
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for bilingual conversations**

*TransNova — Breaking language barriers, one chat at a time*

</div>
