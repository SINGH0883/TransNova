import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, Linking, Platform } from 'react-native';
import { ChatContext } from '../context/ChatContext';
import { TranslationContext } from '../context/TranslationContext';

export default function ContactListScreen({ onSelectContact, onOpenSettings }) {
  const { contacts, setActiveContactId } = useContext(ChatContext);
  const { sendMode, readMode } = useContext(TranslationContext);
  const [search, setSearch] = useState('');

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id) => {
    setActiveContactId(id);
    onSelectContact(id);
  };

  const handleOpenKeyboardSettings = () => {
    if (Platform.OS === 'android') {
      try {
        Linking.sendIntent('android.settings.INPUT_METHOD_SETTINGS');
      } catch (err) {
        Linking.openSettings();
      }
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.brandGroup}>
            <Image source={require('../../assets/icon.png')} style={styles.appLogo} />
            <Text style={styles.logoText}>TransNova</Text>
          </View>
          <TouchableOpacity style={styles.badge} onPress={onOpenSettings} activeOpacity={0.8}>
            <Text style={styles.badgeText}>🌐 {sendMode ? 'EN' : 'HI'} ↔ {readMode ? 'HI' : 'EN'}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts or translated chats..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Glassmorphic Keyboard Launcher Card */}
      <View style={styles.keyboardCard}>
        <View style={styles.kbdCardHeader}>
          <Text style={styles.kbdIcon}>⌨️</Text>
          <Text style={styles.kbdTitle}>TransNova System Mobile Keyboard</Text>
        </View>
        <Text style={styles.kbdDesc}>
          Type Hinglish in WhatsApp, Telegram, or SMS and translate live inside any app!
        </Text>
        <TouchableOpacity style={styles.kbdBtn} onPress={handleOpenKeyboardSettings} activeOpacity={0.85}>
          <Text style={styles.kbdBtnText}>1. Enable TransNova Keyboard in Android Settings ➔</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>CONVERSATIONS</Text>

      {/* Contact List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleSelect(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              {item.status === 'Online' && <View style={styles.onlineDot} />}
            </View>

            <View style={styles.cardContent}>
              <View style={styles.nameRow}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>

              <View style={styles.msgRow}>
                <Text style={styles.lastMsgText} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#0B132B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  clearSearch: {
    color: '#94A3B8',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  keyboardCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
    elevation: 4,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  kbdCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  kbdIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  kbdTitle: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '800',
  },
  kbdDesc: {
    color: '#94A3B8',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 12,
  },
  kbdBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  kbdBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 16,
    marginTop: 14,
    marginBottom: 6,
  },
  contactCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#090D16',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  timeText: {
    color: '#64748B',
    fontSize: 12,
  },
  msgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMsgText: {
    color: '#94A3B8',
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
