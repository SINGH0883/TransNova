import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  NativeModules,
  Platform,
  Linking,
  ScrollView
} from 'react-native';

const { KeyboardModule } = NativeModules;

export default function KeyboardSetupScreen() {
  const [testText, setTestText] = useState('');

  const handleOpenSettings = () => {
    if (Platform.OS === 'android' && KeyboardModule?.openKeyboardSettings) {
      KeyboardModule.openKeyboardSettings();
    } else if (Platform.OS === 'android') {
      try {
        Linking.sendIntent('android.settings.INPUT_METHOD_SETTINGS');
      } catch (e) {
        Linking.openSettings();
      }
    } else {
      Linking.openSettings();
    }
  };

  const handleOpenPicker = () => {
    if (Platform.OS === 'android' && KeyboardModule?.openInputMethodPicker) {
      KeyboardModule.openInputMethodPicker();
    } else {
      alert('Open your keyboard in any app and tap the ⌨️ Keyboard icon at the bottom right to switch!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Brand Header */}
      <View style={styles.headerBox}>
        <Image source={require('../../assets/icon.png')} style={styles.appLogo} />
        <Text style={styles.titleText}>TransNova Keyboard</Text>
        <Text style={styles.subtitleText}>
          Real-time Hindi ↔ English System Mobile Keyboard for WhatsApp, Telegram, Instagram & SMS
        </Text>
      </View>

      {/* Step 1 Card */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>STEP 1</Text>
          </View>
          <Text style={styles.stepTitle}>Enable TransNova Keyboard</Text>
        </View>
        <Text style={styles.stepDesc}>
          Turn ON TransNova Keyboard in your phone's Android Keyboard Settings list.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenKeyboardSettings} activeOpacity={0.85}>
          <Text style={styles.btnText}>⚙️ 1. Enable in Settings ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Step 2 Card */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepBadge, styles.stepBadgeTwo]}>
            <Text style={styles.stepBadgeText}>STEP 2</Text>
          </View>
          <Text style={styles.stepTitle}>Switch Active Keyboard</Text>
        </View>
        <Text style={styles.stepDesc}>
          Select TransNova as your active keyboard when typing inside WhatsApp or any chatting app.
        </Text>
        <TouchableOpacity style={[styles.primaryBtn, styles.secondaryBtn]} onPress={handleOpenPicker} activeOpacity={0.85}>
          <Text style={styles.btnText}>⌨️ 2. Select TransNova Keyboard ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Live Interactive Test Area */}
      <View style={styles.testCard}>
        <View style={styles.testHeader}>
          <Text style={styles.testIcon}>🧪</Text>
          <Text style={styles.testTitle}>Live Keyboard Test Box</Text>
        </View>
        <Text style={styles.testDesc}>
          Tap inside the box below to switch to TransNova Keyboard. Type in Hinglish ("kya haal hai") and press 🌐 Translate on the keyboard!
        </Text>
        <TextInput
          style={styles.testInput}
          placeholder="Tap here to test TransNova Keyboard..."
          placeholderTextColor="#64748B"
          value={testText}
          onChangeText={setTestText}
          multiline
        />
        {testText.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setTestText('')}>
            <Text style={styles.clearBtnText}>Clear Test Box</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Supported Apps Footer */}
      <View style={styles.footerBox}>
        <Text style={styles.footerTitle}>Works Everywhere Across Your Phone</Text>
        <Text style={styles.footerApps}>
          💬 WhatsApp • ✈️ Telegram • 📸 Instagram • ✉️ SMS • 📝 Notes • 🌐 Chrome
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  contentContainer: {
    padding: 18,
    paddingBottom: 40,
  },
  headerBox: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  appLogo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  titleText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  subtitleText: {
    color: '#94A3B8',
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  stepCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    elevation: 4,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  stepBadgeTwo: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  stepBadgeText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '900',
  },
  stepTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  stepDesc: {
    color: '#94A3B8',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtn: {
    backgroundColor: '#10B981',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  testCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 18,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  testTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  testDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  testInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  clearBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  footerBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerTitle: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  footerApps: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
