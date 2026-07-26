import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View } from 'react-native';
import { TranslationProvider } from './src/context/TranslationContext';
import { ChatProvider } from './src/context/ChatContext';
import ContactListScreen from './src/screens/ContactListScreen';
import ChatScreen from './src/screens/ChatScreen';
import ControlPanelModal from './src/components/ControlPanelModal';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('contacts'); // 'contacts' | 'chat'
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.container}>
        {currentScreen === 'contacts' ? (
          <ContactListScreen
            onSelectContact={() => setCurrentScreen('chat')}
            onOpenSettings={() => setSettingsVisible(true)}
          />
        ) : (
          <ChatScreen
            onBack={() => setCurrentScreen('contacts')}
            onOpenSettings={() => setSettingsVisible(true)}
          />
        )}

        <ControlPanelModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <TranslationProvider>
      <ChatProvider>
        <MainApp />
      </ChatProvider>
    </TranslationProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
