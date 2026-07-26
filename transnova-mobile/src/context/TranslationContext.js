import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TranslationContext = createContext();

const STORAGE_KEY = 'transnova_settings_v1';

export const TranslationProvider = ({ children }) => {
  const [sendMode, setSendMode] = useState(true); // Auto-translate outgoing Hindi/Hinglish -> English
  const [readMode, setReadMode] = useState(true); // Auto-translate incoming English -> Hindi
  const [hinglishAutoDetect, setHinglishAutoDetect] = useState(true);
  const [primaryLanguage, setPrimaryLanguage] = useState('hi'); // Default target language for readMode

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.sendMode !== undefined) setSendMode(data.sendMode);
        if (data.readMode !== undefined) setReadMode(data.readMode);
        if (data.hinglishAutoDetect !== undefined) setHinglishAutoDetect(data.hinglishAutoDetect);
        if (data.primaryLanguage !== undefined) setPrimaryLanguage(data.primaryLanguage);
      }
    } catch (e) {
      console.warn('Failed to load TransNova translation settings:', e);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      let newSettings = {
        sendMode,
        readMode,
        hinglishAutoDetect,
        primaryLanguage,
        [key]: value
      };
      if (key === 'sendMode') setSendMode(value);
      if (key === 'readMode') setReadMode(value);
      if (key === 'hinglishAutoDetect') setHinglishAutoDetect(value);
      if (key === 'primaryLanguage') setPrimaryLanguage(value);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving TransNova settings:', e);
    }
  };

  return (
    <TranslationContext.Provider
      value={{
        sendMode,
        readMode,
        hinglishAutoDetect,
        primaryLanguage,
        setSendMode: (val) => updateSetting('sendMode', val),
        setReadMode: (val) => updateSetting('readMode', val),
        setHinglishAutoDetect: (val) => updateSetting('hinglishAutoDetect', val),
        setPrimaryLanguage: (val) => updateSetting('primaryLanguage', val),
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
