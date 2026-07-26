import React, { useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TranslationContext } from '../context/TranslationContext';
import { ChatContext } from '../context/ChatContext';
import { isHindiText } from '../services/translator';

export default function MessageInputBar({ onOpenSettings }) {
  const [input, setInput] = useState('');
  const { sendMode, setSendMode } = useContext(TranslationContext);
  const { sendMessage } = useContext(ChatContext);

  const isHinglish = isHindiText(input);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <View style={styles.container}>
      {/* Live Hinglish / Devanagari Detection Indicator */}
      {input.trim().length > 0 && isHinglish && (
        <View style={styles.hintStrip}>
          <Text style={styles.hintText}>
            🇮🇳 Hinglish / Hindi Detected {sendMode ? '→ Auto-translating to English 🇬🇧' : '(Raw Mode)'}
          </Text>
        </View>
      )}

      <View style={styles.inputRow}>
        {/* Quick Toggle Send Mode Pill */}
        <TouchableOpacity
          style={[styles.modePill, sendMode ? styles.modePillActive : styles.modePillInactive]}
          onPress={() => setSendMode(!sendMode)}
          activeOpacity={0.8}
        >
          <Text style={styles.pillIcon}>🌐</Text>
          <Text style={[styles.pillText, sendMode ? styles.pillTextActive : styles.pillTextInactive]}>
            {sendMode ? 'AUTO EN' : 'RAW'}
          </Text>
        </TouchableOpacity>

        {/* Text Input Box */}
        <TextInput
          style={styles.textInput}
          placeholder={sendMode ? "Type in Hindi / Hinglish..." : "Type a message..."}
          placeholderTextColor="#64748B"
          value={input}
          onChangeText={setInput}
          multiline
        />

        {/* Action Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B132B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintStrip: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3.5,
    borderLeftColor: '#38BDF8',
  },
  hintText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
  },
  modePillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  modePillInactive: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
  },
  pillIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pillTextActive: {
    color: '#38BDF8',
  },
  pillTextInactive: {
    color: '#94A3B8',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
    elevation: 0,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
