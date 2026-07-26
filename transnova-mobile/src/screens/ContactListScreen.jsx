import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
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

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.logoText}>TransNova Mobile</Text>
          <TouchableOpacity style={styles.badge} onPress={onOpenSettings}>
            <Text style={styles.badgeText}>🌐 {sendMode ? 'EN' : 'HI'} | {readMode ? 'HI' : 'EN'}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages or contacts..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

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
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
  },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  contactCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
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
    borderColor: '#0F172A',
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
    fontWeight: '700',
  },
});
