import React, { useContext, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import HeaderBar from '../components/HeaderBar';
import MessageBubble from '../components/MessageBubble';
import MessageInputBar from '../components/MessageInputBar';
import { ChatContext } from '../context/ChatContext';

export default function ChatScreen({ onOpenSettings, onBack }) {
  const { activeMessages } = useContext(ChatContext);
  const flatListRef = useRef(null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <HeaderBar onOpenSettings={onOpenSettings} onBack={onBack} />

      <FlatList
        ref={flatListRef}
        data={activeMessages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <MessageInputBar onOpenSettings={onOpenSettings} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  messageList: {
    paddingVertical: 12,
  },
});
