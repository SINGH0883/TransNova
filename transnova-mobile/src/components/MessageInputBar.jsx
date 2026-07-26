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
      {/* Dynamic Mode Helper Strip */}
      {input.trim().length > 0 && isHinglish && (
        <View style={styles.hintStrip}>
          <Text style={styles.hintText}>
            🇮🇳 Hinglish/Hindi detected {sendMode ? '→ Will send translated in English 🇬🇧' : '(Send Translation Off)'}
          </Text>
        </View>
      )}

      <View style={styles.inputRow}>
        {/* Toggle Send Mode Pill */}
        <TouchableOpacity
          style={[styles.modePill, sendMode ? styles.modePillActive : styles.modePillInactive]}
          onPress={() => setSendMode(!sendMode)}
          activeOpacity={0.7}
        >
          <Text style={styles.pillIcon}>🌐</Text>
          <Text style={[styles.pillText, sendMode ? styles.pillTextActive : styles.pillTextInactive]}>
            {sendMode ? 'AUTO EN' : 'RAW'}
          </Text>
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder={sendMode ? "Type in Hindi / Hinglish..." : "Type a message..."}
          placeholderTextColor="#64748B"
          value={input}
          onChangeText={setInput}
          multiline
        />

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Text style={styles.sendIcon}>➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintStrip: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  hintText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  modePillActive: {
    backgroundColor: '#1E293B',
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
    fontSize: 11,
    fontWeight: '800',
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
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
