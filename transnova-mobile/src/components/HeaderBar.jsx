import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react'
import { TranslationContext } from '../context/TranslationContext';
import { ChatContext } from '../context/ChatContext';

export default function HeaderBar({ onOpenSettings, onBack }) {
  const { sendMode, readMode } = useContext(TranslationContext);
  const { activeContact } = useContext(ChatContext);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Image source={{ uri: activeContact.avatar }} style={styles.avatar} />
        <View style={styles.contactInfo}>
          <Text style={styles.nameText} numberOfLines={1}>{activeContact.name}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{activeContact.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Floating TransNova Status Pill */}
        <TouchableOpacity style={styles.statusBadge} onPress={onOpenSettings}>
          <Text style={styles.badgeGlobe}>🌐</Text>
          <Text style={styles.badgeText}>
            {sendMode ? 'EN' : 'HI'} | {readMode ? 'HI' : 'EN'}
          </Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onOpenSettings}>
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  backText: {
    color: '#94A3B8',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  contactInfo: {
    marginLeft: 10,
    justifyContent: 'center',
    flex: 1,
  },
  nameText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginRight: 8,
  },
  badgeGlobe: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    fontSize: 16,
  },
});
