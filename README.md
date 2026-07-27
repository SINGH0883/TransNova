# TransNova — Chat Translator

<div align="center">

<img src="./icons/icon128.png" width="128" alt="TransNova Logo" />

**Universal All-Language Real-Time Web Chat Translator**

Type in your native language, send in any target language. Auto-detect incoming messages from any language and read in your preferred primary language. Works seamlessly across web chat apps (WhatsApp Web, Telegram Web, Discord Web, Slack Web, Messenger Web, Snapchat Web).

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#installation)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-8B5CF6?style=for-the-badge)](#)
[![Version 2.0.0](https://img.shields.io/badge/Version-2.0.0-06B6D4?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](#license)

</div>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🌍 **Universal Multi-Language Support** | Supports 30+ major languages sorted alphabetically (A to Z), including dedicated **Hinglish** (`hi-Latn`) & **Bhojpuri** (`bho`) |
| ⌨️ **2-Step Enter Translation** | Press **`Enter` once** to translate in-place in the input box; press **`Enter` a second time** to send |
| 🌐 **Dual Engine Translation** | Powered by **Google Translate API** with **MyMemory API** fallback for high-accuracy auto-detection and natural translation |
| 🚩 **Mini Country Flags** | Crisp mini country flag icons rendered alongside every language selector |
| 🎛️ **Side-by-Side Controls** | Compact side-by-side primary & partner language selection with 1-click horizontal swap (`⇆`) |
| 📤 **Outgoing Translation** | Type in your primary language — automatically translated into your partner's target language |
| 📥 **Incoming Auto-Detection** | Incoming messages in any language are automatically detected and rendered in your primary language |
| ⚡ **Multi-Layer LRU Caching** | High-performance dual-tier caching (Content Script + Service Worker) avoids redundant API calls |
| 💬 **Interactive Original Text Badge** | Click the `🌐` badge on any translated message bubble to toggle between original and translated text |
| ⌨️ **Keyboard Shortcut** | Press `Alt + T` at any time to instantly toggle extension translation on/off |
| 🛡️ **Context Invalidation Guard** | Detects extension reloads/updates gracefully, showing clear toast guidance (`F5` refresh) without breaking chat input |

---

## 📸 How It Works

```
You type text (e.g. "kaise ho") ──► Press Enter (1st) ──► Input translated ("How are you") ──► Press Enter (2nd) ──► Recipient receives translation
                                           ↕
Sender writes in any language  ──► Intercepted & Auto-Detected ──► You view in your Primary Language
```

---

## 🔄 Application Workflow Chart

```mermaid
flowchart TD
    subgraph Client ["💻 Web Chat Platform (DOM)"]
        A["⌨️ User Types Input"] --> B["📤 1st Enter: Translate In-Place"]
        B --> B2["📤 2nd Enter: Natural Send"]
        C["📥 Incoming Message Received"]
    end

    subgraph ContentScript ["⚡ Content Script (content.js & platforms.js)"]
        B --> D{"🛡️ Intercept Keydown"}
        D -- "1st Enter (Untranslated)" --> E["🔍 Translate Input Text"]
        D -- "2nd Enter (Translated)" --> B2
        C --> F["👁️ MutationObserver Detects Message Bubble"]
        F --> G["🔍 Verify Read Mode"]
    end

    subgraph BackgroundService ["⚙️ Background Service Worker & Engine"]
        E --> H{"⚡ Check LRU Cache"}
        G --> H
        H -- "Cache Hit" --> K["✨ Formatted Translation"]
        H -- "Cache Miss" --> I["🌐 Google Translate API (Primary)"]
        I -- "Failure" --> J["🌐 MyMemory API (Fallback)"]
        I -- "Success" --> K
        J --> K
    end

    subgraph DOMUpdate ["🎨 UI Rendering & Input Injection"]
        K --> L["🔄 setInputText (Update Input Box & Save State)"]
        K --> M["💬 Render Translated Node + Inject Interactive 🌐 Badge"]
    end

    subgraph PopupControl ["🎛️ Control Panel (popup.js)"]
        O["🎛️ Side-by-Side Language & Mode Selectors"] --> P["💾 chrome.storage.local Sync"]
        Q["⌨️ Alt+T Shortcut Toggle"] --> P
        P --> ContentScript
    end
```

---

## 🎛️ Translation Modes

TransNova features **independent controls** for outgoing and incoming messages:

### Outgoing Messages (Send)

| Setting | Your Input | Result on 1st Enter | Result on 2nd Enter |
|---|---|---|---|
| **Original (Off)** | Text sent as typed | Sent immediately as typed | Sent immediately as typed |
| **Translate Outgoing** | *"kya kar rahe ho"* | Text becomes *"What are you doing"* in input box | Sent to chat recipient |

### Incoming Messages (Read)

| Setting | Sender's Input | Your View |
|---|---|---|
| **Original (Off)** | Messages displayed as received | Original text |
| **Translate Incoming** | Incoming message in any language | Rendered in your primary language + `🌐` Toggle Badge |

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

3. Enable **Developer mode** (toggle switch in the top-right corner).

4. Click **Load unpacked**.

5. Select the `TransNova` project directory.

6. The TransNova icon will appear in your Chrome toolbar 🎉

---

## 🎯 Usage

### Getting Started

1. Open any supported web chat app (e.g., [WhatsApp Web](https://web.whatsapp.com), [Telegram Web](https://web.telegram.org), [Discord](https://discord.com), [Slack](https://app.slack.com), [Messenger](https://www.messenger.com), [Snapchat Web](https://web.snapchat.com)).
2. Look for the **TransNova AI** toast notification in the bottom-right corner.
3. Click the **TransNova icon** in your toolbar to open the compact dark control panel.
4. Select **My Language** and **Partner Language**, and set **Outgoing (Send)** and **Incoming (Read)** modes.

### 2-Step Enter Key Workflow

- **Press `Enter` once**: Translates your input in-place inside the chat text box so you can review or edit it.
- **Press `Enter` a second time**: Sends the translated message.

### Quick Shortcut Toggle

Press **`Alt + T`** to instantly pause or resume translation across all tabs without opening the popup.

### Viewing Original Text

Every incoming translated message features a `🌐` badge. **Click it** to toggle between the original message and the translation.

---

## 🏗️ Project Structure

```
TransNova/
├── manifest.json               # Chrome Extension Manifest (V3)
├── LICENSE                     # MIT License documentation
├── README.md                   # Complete documentation
├── icons/                      # Extension branding & toolbar icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon256.png
├── lib/
│   └── platforms.js            # Platform selectors & Lexical/DOM input adapter engine
├── background/
│   └── service-worker.js       # Background relay, Google/MyMemory APIs, Hinglish transliteration, settings sync
├── content/
│   ├── content.js              # Interceptor, MutationObserver, 2-step Enter handler & context protection
│   └── content.css             # Glassmorphism toasts, indicators, loading spinners & badges
└── popup/
    ├── popup.html              # Compact dark popup interface with side-by-side selectors & mini flags
    ├── popup.css               # Modern high-contrast typography & flat dark layout
    └── popup.js                # Popup controller, flag updates & tab detection
```

---

## 🛠️ Supported Platforms

| Platform | Status | Features Supported |
|---|---|---|
| **WhatsApp Web** | ✅ Fully Supported | Lexical AST input replacement, message bubble translation, badges |
| **Telegram Web** | ✅ Fully Supported | WebK & WebZ interfaces, input interception & incoming translation |
| **Discord Web** | ✅ Fully Supported | Text channels, DMs, contenteditable input replacement |
| **Slack Web** | ✅ Fully Supported | Workspace channels & direct messages |
| **Messenger / Facebook** | ✅ Fully Supported | Chat threads & popup conversation bubbles |
| **Snapchat Web** | ✅ Fully Supported | Real-time chat history & slate/contenteditable input interception |

---

## 🔑 Keyboard Shortcuts

| Shortcut | Action | Scope |
|---|---|---|
| `Alt + T` | Toggle translation ON / PAUSED | Global across all web chat tabs |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Developed with ❤️ by Yuvraj**

*TransNova — Breaking language barriers across the web, one chat at a time.*

</div>
