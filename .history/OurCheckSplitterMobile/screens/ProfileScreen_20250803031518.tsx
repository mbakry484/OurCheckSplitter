import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ProfileScreenProps {
  navigation?: any;
}

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoSplitEnabled, setAutoSplitEnabled] = useState(true);

  const handleGoBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleHomeNavigation = () => {
    if (navigation) {
      navigation.navigate('Home');
    }
  };

  const handleFriendsNavigation = () => {
    if (navigation) {
      navigation.navigate('Friends');
    }
  };

  const handleReceiptsNavigation = () => {
    if (navigation) {
      navigation.navigate('Receipts');
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon!');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Change password functionality coming soon!');
  };

  const handlePaymentMethods = () => {
    Alert.alert('Payment Methods', 'Manage payment methods functionality coming soon!');
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Export data functionality coming soon!');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Help & support functionality coming soon!');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => {
          // Handle sign out logic here
          Alert.alert('Signed Out', 'You have been successfully signed out.');
        }},
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode,
    isLast?: boolean
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, isLast && styles.settingItemLast]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#007AFF" />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent || <Ionicons name="chevron-forward" size={20} color="#999" />}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JD</Text>
            </View>
            <TouchableOpacity style={styles.avatarEdit} onPress={handleEditProfile}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@example.com</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>15</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>43</Text>
              <Text style={styles.statLabel}>Receipts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>$1,250</Text>
              <Text style={styles.statLabel}>Total Split</Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        {renderSection('Account', (
          <>
            {renderSettingItem(
              'person-outline',
              'Edit Profile',
              'Update your name, photo, and details',
              handleEditProfile
            )}
            {renderSettingItem(
              'lock-closed-outline',
              'Change Password',
              'Update your password',
              handleChangePassword
            )}
            {renderSettingItem(
              'card-outline',
              'Payment Methods',
              'Manage your cards and payment options',
              handlePaymentMethods,
              undefined,
              true
            )}
          </>
        ))}

        {/* Preferences Section */}
        {renderSection('Preferences', (
          <>
            {renderSettingItem(
              'notifications-outline',
              'Push Notifications',
              'Get notified about new receipts and payments',
              undefined,
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E5E5', true: '#4ECDC4' }}
                thumbColor={notificationsEnabled ? 'white' : '#f4f3f4'}
              />
            )}
            {renderSettingItem(
              'moon-outline',
              'Dark Mode',
              'Switch to dark theme',
              undefined,
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#E5E5E5', true: '#4ECDC4' }}
                thumbColor={darkModeEnabled ? 'white' : '#f4f3f4'}
              />
            )}
            {renderSettingItem(
              'calculator-outline',
              'Auto Split',
              'Automatically split receipts equally',
              undefined,
              <Switch
                value={autoSplitEnabled}
                onValueChange={setAutoSplitEnabled}
                trackColor={{ false: '#E5E5E5', true: '#4ECDC4' }}
                thumbColor={autoSplitEnabled ? 'white' : '#f4f3f4'}
              />,
              true
            )}
          </>
        ))}

        {/* Data & Privacy Section */}
        {renderSection('Data & Privacy', (
          <>
            {renderSettingItem(
              'download-outline',
              'Export Data',
              'Download your receipts and transaction history',
              handleExportData
            )}
            {renderSettingItem(
              'shield-checkmark-outline',
              'Privacy Policy',
              'Read our privacy policy',
              () => Alert.alert('Privacy Policy', 'Privacy policy coming soon!')
            )}
            {renderSettingItem(
              'document-text-outline',
              'Terms of Service',
              'Read our terms of service',
              () => Alert.alert('Terms of Service', 'Terms of service coming soon!'),
              undefined,
              true
            )}
          </>
        ))}

        {/* Support Section */}
        {renderSection('Support', (
          <>
            {renderSettingItem(
              'help-circle-outline',
              'Help & Support',
              'Get help or contact support',
              handleHelp
            )}
            {renderSettingItem(
              'chatbubbles-outline',
              'Send Feedback',
              'Share your thoughts and suggestions',
              () => Alert.alert('Send Feedback', 'Feedback functionality coming soon!')
            )}
            {renderSettingItem(
              'information-circle-outline',
              'About',
              'App version 1.0.0',
              () => Alert.alert('About', 'CheckSplitter v1.0.0\nBuilt with ❤️'),
              undefined,
              true
            )}
          </>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomeNavigation}>
          <Ionicons name="home-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleFriendsNavigation}>
          <Ionicons name="people-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleReceiptsNavigation}>
          <Ionicons name="receipt-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    minHeight: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: 'white',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E5E5',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingRight: {
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 24,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
});

export default ProfileScreen;