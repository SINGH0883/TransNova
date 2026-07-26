import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChatContext } from '../context/ChatContext';

export default function MessageBubble({ message }) {
  const { toggleMessageBadge } = useContext(ChatContext);
  const isMe = message.sender === 'me';

  const displayText = message.showOriginal
    ? message.originalText
    : message.translatedText || message.originalText;

  return (
    <View style={[styles.container, isMe ? styles.myContainer : styles.theirContainer]}>
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
        
        {/* Loading Spinner */}
        {message.loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={isMe ? '#FFFFFF' : '#38BDF8'} />
            <Text style={[styles.loadingText, isMe ? styles.myText : styles.theirText]}>
              Translating...
            </Text>
          </View>
        ) : (
          <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
            {displayText}
          </Text>
        )}

        {/* Message Footer: Timestamp + TransNova Interactive Badge */}
        <View style={styles.footerRow}>
          <Text style={[styles.timeText, isMe ? styles.myTime : styles.theirTime]}>
            {message.timestamp}
          </Text>

          {message.isTranslated && !message.loading && (
            <TouchableOpacity
              style={[
                styles.badgeButton,
                message.showOriginal && styles.activeBadgeButton
              ]}
              onPress={() => toggleMessageBadge(message.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.badgeIcon}>🌐</Text>
              <Text style={[
                styles.badgeLabel,
                message.showOriginal ? styles.badgeLabelOriginal : styles.badgeLabelTranslated
              ]}>
                {message.showOriginal ? 'Original' : 'Translated'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    flexDirection: 'row',
  },
  myContainer: {
    justifyContent: 'flex-end',
  },
  theirContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  myBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  myText: {
    color: '#FFFFFF',
  },
  theirText: {
    color: '#F1F5F9',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    minWidth: 90,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  myTime: {
    color: '#93C5FD',
  },
  theirTime: {
    color: '#64748B',
  },
  badgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  activeBadgeButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  badgeIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  badgeLabelTranslated: {
    color: '#38BDF8',
  },
  badgeLabelOriginal: {
    color: '#F59E0B',
  },
});
