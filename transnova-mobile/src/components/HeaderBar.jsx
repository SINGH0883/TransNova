import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { TranslationContext } from '../context/TranslationContext';
import { ChatContext } from '../context/ChatContext';

export default function HeaderBar({ onOpenSettings, onBack }) {
  const { sendMode, readMode } = useContext(TranslationContext);
  const { activeContact } = useContext(ChatContext);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.avatarWrapper}>
          <Image source={{ uri: activeContact.avatar }} style={styles.avatar} />
          {activeContact.status === 'Online' && <View style={styles.activeDot} />}
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.nameText} numberOfLines={1}>{activeContact.name}</Text>
          <Text style={styles.statusSubtext}>
            {activeContact.status === 'Online' ? '● Active Now' : activeContact.status}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Floating Glassmorphic TransNova Mode Pill */}
        <TouchableOpacity style={styles.statusBadge} onPress={onOpenSettings} activeOpacity={0.8}>
          <Image source={require('../../assets/icon.png')} style={styles.logoBadgeIcon} />
          <Text style={styles.badgeText}>
            {sendMode ? 'EN' : 'HI'} ↔ {readMode ? 'HI' : 'EN'}
          </Text>
        </TouchableOpacity>

        {/* Settings Control Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onOpenSettings} activeOpacity={0.7}>
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 68,
    backgroundColor: '#0B132B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
    elevation: 8,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  backText: {
    color: '#38BDF8',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    backgroundColor: '#1E293B',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#0B132B',
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
    letterSpacing: 0.2,
  },
  statusSubtext: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginRight: 8,
  },
  logoBadgeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    fontSize: 16,
  },
});
