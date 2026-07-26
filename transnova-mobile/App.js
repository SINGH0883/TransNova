import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View } from 'react-native';
import KeyboardSetupScreen from './src/screens/KeyboardSetupScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />
      <View style={styles.container}>
        <KeyboardSetupScreen />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
});
