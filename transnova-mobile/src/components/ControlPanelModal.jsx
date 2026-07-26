import React, { useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch } from 'react-native';
import { TranslationContext } from '../context/TranslationContext';

export default function ControlPanelModal({ visible, onClose }) {
  const {
    sendMode,
    setSendMode,
    readMode,
    setReadMode,
    hinglishAutoDetect,
    setHinglishAutoDetect,
  } = useContext(TranslationContext);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.panelContainer}>
          
          {/* Header */}
          <View style={styles.panelHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.logoIcon}>🌐</Text>
              <Text style={styles.titleText}>TransNova Control Panel</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.subTitle}>
            Configure real-time Hindi ↔ English mobile translation engine settings.
          </Text>

          {/* Setting 1: Outgoing Send Mode */}
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Outgoing Translation (Send Mode)</Text>
              <Text style={styles.settingDesc}>
                Type in Devanagari Hindi or Hinglish ("kya haal hai") and auto-translate to English before sending.
              </Text>
            </View>
            <Switch
              value={sendMode}
              onValueChange={setSendMode}
              trackColor={{ false: '#334155', true: '#2563EB' }}
              thumbColor={sendMode ? '#38BDF8' : '#94A3B8'}
            />
          </View>

          {/* Setting 2: Incoming Read Mode */}
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Incoming Translation (Read Mode)</Text>
              <Text style={styles.settingDesc}>
                Automatically render incoming English chat messages in Hindi. Tap 🌐 badge anytime to view original.
              </Text>
            </View>
            <Switch
              value={readMode}
              onValueChange={setReadMode}
              trackColor={{ false: '#334155', true: '#2563EB' }}
              thumbColor={readMode ? '#38BDF8' : '#94A3B8'}
            />
          </View>

          {/* Setting 3: Hinglish Auto-Detect */}
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Hinglish Romanized AI Detection</Text>
              <Text style={styles.settingDesc}>
                Detects Romanized phonetic Hindi phrases ("kaise ho bhai") using built-in dictionary patterns.
              </Text>
            </View>
            <Switch
              value={hinglishAutoDetect}
              onValueChange={setHinglishAutoDetect}
              trackColor={{ false: '#334155', true: '#2563EB' }}
              thumbColor={hinglishAutoDetect ? '#38BDF8' : '#94A3B8'}
            />
          </View>

          {/* Engine Info */}
          <View style={styles.engineBox}>
            <Text style={styles.engineTitle}>⚡ Active Translation Engine</Text>
            <Text style={styles.engineDetails}>
              Primary: Google Translate API (v3) • Fallback: MyMemory API • Dual LRU Cache Enabled
            </Text>
          </View>

          {/* Done Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Save & Return to Chat</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  panelContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  titleText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subTitle: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 18,
  },
  settingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  engineBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 6,
  },
  engineTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  engineDetails: {
    color: '#64748B',
    fontSize: 11,
  },
  doneBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
