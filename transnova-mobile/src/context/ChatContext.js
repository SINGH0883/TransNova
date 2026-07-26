import React, { createContext, useState, useContext } from 'react';
import { translateText, isHindiText, detectLanguage } from '../services/translator';
import { TranslationContext } from './TranslationContext';

export const ChatContext = createContext();

const INITIAL_CONTACTS = [
  {
    id: 'c1',
    name: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    status: 'Online',
    lastMessage: 'Let\'s meet tomorrow at 5 PM',
    unread: 1,
    time: '10:04 AM'
  },
  {
    id: 'c2',
    name: 'Priya Verma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    status: 'Busy',
    lastMessage: 'kya haal hai? kab aoge?',
    unread: 0,
    time: 'Yesterday'
  },
  {
    id: 'c3',
    name: 'Amit Patel',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    status: 'Offline',
    lastMessage: 'Dhanyawad bhai! Kaam ho gaya.',
    unread: 0,
    time: 'Jul 24'
  }
];

const INITIAL_MESSAGES = {
  c1: [
    {
      id: 'm1',
      sender: 'them',
      originalText: 'Hey there! How is the project going?',
      translatedText: 'हे वहां! प्रोजेक्ट कैसा चल रहा है?',
      isTranslated: true,
      showOriginal: false,
      timestamp: '10:00 AM',
      loading: false
    },
    {
      id: 'm2',
      sender: 'me',
      originalText: 'Sab badhiya chal raha hai bhai, bilkul ready hai!',
      translatedText: 'Everything is going great brother, it is completely ready!',
      isTranslated: true,
      showOriginal: false,
      timestamp: '10:02 AM',
      loading: false
    },
    {
      id: 'm3',
      sender: 'them',
      originalText: 'Awesome! Let\'s meet tomorrow at 5 PM',
      translatedText: 'शानदार! आइए कल शाम 5 बजे मिलते हैं',
      isTranslated: true,
      showOriginal: false,
      timestamp: '10:04 AM',
      loading: false
    }
  ],
  c2: [
    {
      id: 'm2_1',
      sender: 'them',
      originalText: 'kya haal hai? kab aoge?',
      translatedText: 'How are you? When will you come?',
      isTranslated: true,
      showOriginal: false,
      timestamp: 'Yesterday',
      loading: false
    }
  ],
  c3: [
    {
      id: 'm3_1',
      sender: 'them',
      originalText: 'Dhanyawad bhai! Kaam ho gaya.',
      translatedText: 'Thank you brother! Work is done.',
      isTranslated: true,
      showOriginal: false,
      timestamp: 'Jul 24',
      loading: false
    }
  ]
};

export const ChatProvider = ({ children }) => {
  const { sendMode, readMode } = useContext(TranslationContext);
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState('c1');
  const [messagesMap, setMessagesMap] = useState(INITIAL_MESSAGES);

  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0];
  const activeMessages = messagesMap[activeContactId] || [];

  // Toggle badge for a specific message (Original <-> Translated)
  const toggleMessageBadge = (messageId) => {
    setMessagesMap(prev => {
      const currentList = prev[activeContactId] || [];
      const updatedList = currentList.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, showOriginal: !msg.showOriginal };
        }
        return msg;
      });
      return { ...prev, [activeContactId]: updatedList };
    });
  };

  // Send a message
  const sendMessage = async (text) => {
    if (!text || !text.trim()) return;

    const newMsgId = `m_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isHindi = isHindiText(text);

    let translatedText = text;
    let isTranslated = false;

    // Show initial message entry in UI immediately
    const tempMessage = {
      id: newMsgId,
      sender: 'me',
      originalText: text,
      translatedText: text,
      isTranslated: false,
      showOriginal: false,
      timestamp,
      loading: sendMode && isHindi
    };

    setMessagesMap(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), tempMessage]
    }));

    if (sendMode && isHindi) {
      try {
        const result = await translateText(text, 'hi', 'en');
        translatedText = result;
        isTranslated = result.trim().toLowerCase() !== text.trim().toLowerCase();
      } catch (err) {
        console.error('Translation error on send:', err);
      }
    }

    // Update message with finished translation
    setMessagesMap(prev => {
      const current = prev[activeContactId] || [];
      return {
        ...prev,
        [activeContactId]: current.map(m => m.id === newMsgId ? {
          ...m,
          translatedText,
          isTranslated,
          loading: false
        } : m)
      };
    });

    // Update contact list preview
    setContacts(prev => prev.map(c => c.id === activeContactId ? {
      ...c,
      lastMessage: isTranslated ? translatedText : text,
      time: timestamp
    } : c));

    // Simulate smart auto-reply response after 2 seconds for testing
    simulateAutoReply(activeContactId, text);
  };

  // Simulate incoming message from contact
  const simulateAutoReply = (contactId, userText) => {
    setTimeout(async () => {
      const replies = [
        "Sure, sounds great! Let me know when you arrive.",
        "Aap bilkul sahi keh rahe ho, main tayyar hoon!",
        "Thanks for updating me. I will check the details right away.",
        "Kya hum shaam ko baat kar sakte hain?"
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const replyId = `m_reply_${Date.now()}`;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let translated = replyText;
      let isTrans = false;

      // Check if readMode is enabled
      if (readMode) {
        const lang = detectLanguage(replyText);
        if (lang === 'en') {
          translated = await translateText(replyText, 'en', 'hi');
          isTrans = translated !== replyText;
        } else if (lang.startsWith('hi')) {
          translated = await translateText(replyText, 'hi', 'en');
          isTrans = translated !== replyText;
        }
      }

      const incomingMsg = {
        id: replyId,
        sender: 'them',
        originalText: replyText,
        translatedText: translated,
        isTranslated: isTrans,
        showOriginal: false,
        timestamp,
        loading: false
      };

      setMessagesMap(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), incomingMsg]
      }));

      setContacts(prev => prev.map(c => c.id === contactId ? {
        ...c,
        lastMessage: isTrans ? translated : replyText,
        time: timestamp
      } : c));
    }, 2200);
  };

  return (
    <ChatContext.Provider
      value={{
        contacts,
        activeContact,
        activeMessages,
        setActiveContactId,
        sendMessage,
        toggleMessageBadge
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
