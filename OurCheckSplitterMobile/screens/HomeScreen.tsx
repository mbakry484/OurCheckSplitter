import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, padding, height, width, screenDimensions } from '../utils/responsive';
import { api } from '../services/api';
import { 
  FriendDto, 
  ReceiptResponseDto, 
  convertFriendToHomeFormat, 
  convertReceiptToHomeFormat,
  HomeScreenFriend,
  HomeScreenReceipt,
} from '../types/api';

interface FriendReceipt {
  id: string;
  title: string;
  date: string;
  totalAmount: number;
  friendPaidAmount: number;
  participants: string[];
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  receipts: string[]; // Array of receipt names
  totalPaid: number; // Total amount this friend paid across all receipts
  detailedReceipts?: FriendReceipt[]; // Detailed receipt information
}

interface Receipt {
  id: string;
  title: string;
  date: string;
  totalAmount: number;
  userPaidAmount: number;
  type: 'paid';
  participants: string[]; // friend names
}

interface HomeScreenProps {
  navigation?: any;
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const insets = useSafeAreaInsets();
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabAnimation = useState(new Animated.Value(0))[0];
  
  // API state management
  const [friends, setFriends] = useState<HomeScreenFriend[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<HomeScreenReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First test basic connectivity
      console.log('Testing API connectivity...');
      try {
        const testResponse = await api.test.ping();
        console.log('API connectivity test successful:', testResponse);
        
        // Debug: Check what data exists in the database
        const debugData = await api.test.debugData();
        console.log('Debug data from database:', debugData);
      } catch (testError) {
        console.error('API connectivity test failed:', testError);
        // Continue anyway, maybe it's just the test endpoint
      }

      // Load friends and receipts in parallel
      const [friendsResponse, receiptsResponse] = await Promise.all([
        api.friends.getFriends(),
        api.receipts.getReceipts(),
      ]);

      // Convert API responses to HomeScreen format
      const convertedFriends = friendsResponse.map((friend: FriendDto) => 
        convertFriendToHomeFormat(friend)
      );
      
      const convertedReceipts = receiptsResponse.map((receipt: ReceiptResponseDto) => 
        convertReceiptToHomeFormat(receipt)
      );

      setFriends(convertedFriends);
      setRecentReceipts(convertedReceipts);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please check your connection and try again.');
      
      // Show error alert
      Alert.alert(
        'Connection Error',
        'Failed to load data from server. Make sure your API is running.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate total paid by user
  const totalYouPaid = recentReceipts.reduce((sum, receipt) => sum + receipt.userPaidAmount, 0);

  const handleSeeAllFriends = () => {
    if (navigation) {
      navigation.navigate('Friends');
    }
  };

  const handleFriendsNavigation = () => {
    if (navigation) {
      navigation.navigate('Friends');
    }
  };

  const handleViewAllReceipts = () => {
    if (navigation) {
      navigation.navigate('Receipts');
    }
  };

  const handleProfileNavigation = () => {
    if (navigation) {
      navigation.navigate('Profile');
    }
  };

  const handleAddReceipt = () => {
    if (navigation) {
      navigation.navigate('AddReceipt');
    }
  };

  const toggleFabMenu = () => {
    const toValue = fabMenuOpen ? 0 : 1;

    Animated.spring(fabAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setFabMenuOpen(!fabMenuOpen);
  };

  const handleMicrophonePress = () => {
    console.log('Microphone pressed');
    toggleFabMenu();
  };

  const handleChatPress = () => {
    console.log('Chat pressed');
    toggleFabMenu();
  };

  const handleManualEntryPress = () => {
    console.log('Manual entry pressed');
    toggleFabMenu();
    handleAddReceipt();
  };

  const handleFriendPress = (friend: HomeScreenFriend) => {
    if (navigation) {
      navigation.navigate('Friends', { selectedFriend: friend });
    }
  };

  const renderFriend = (friend: HomeScreenFriend) => (
    <TouchableOpacity key={friend.id} style={styles.friendItem} onPress={() => handleFriendPress(friend)}>
      <View style={styles.friendAvatar}>
        <Text style={styles.avatarText}>{friend.avatar}</Text>
      </View>
      <Text style={styles.friendName}>{friend.name}</Text>
      <Text style={styles.friendReceipts}>{friend.receipts.length} Receipts</Text>
    </TouchableOpacity>
  );

  const renderReceipt = (receipt: HomeScreenReceipt) => (
    <TouchableOpacity key={receipt.id} style={styles.receiptItem}>
      <View style={styles.receiptLeft}>
        <Text style={styles.receiptTitle}>{receipt.title}</Text>
        <Text style={styles.receiptDate}>{receipt.date}</Text>
        <View style={styles.youPaidContainer}>
          <Text style={styles.receiptType}>
            {'You Paid'}
          </Text>
          <Text style={styles.userPaidAmount}>
            ${receipt.userPaidAmount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.participants}>
          <Text style={styles.participantsLabel}>With: </Text>
          <Text style={styles.participantNames}>
            {receipt.participants.join(', ')}
          </Text>
        </View>
      </View>
      <View style={styles.receiptRight}>
        <Text style={styles.receiptTotalLabel}>Total</Text>
        <Text style={[
          styles.receiptAmount,
          { color: '#4ECDC4' }
        ]}>
          ${receipt.totalAmount.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
          <Text style={styles.headerTitle}>SplitWise</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <Text style={styles.headerTitle}>SplitWise</Text>
        {error && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={loadData}
          >
            <Ionicons name="refresh-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Friends Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <TouchableOpacity onPress={handleSeeAllFriends}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsList}>
            {friends.length > 0 ? (
              friends.slice(0, 5).map(renderFriend)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No friends yet. Add some receipts to get started!</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Recent Receipts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Receipts</Text>
            <TouchableOpacity onPress={handleViewAllReceipts}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentReceipts.length > 0 ? (
            <>
              {recentReceipts.slice(0, 5).map(renderReceipt)}
              {recentReceipts.length > 5 && (
                <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewAllReceipts}>
                  <Text style={styles.viewMoreText}>View More ({recentReceipts.length - 5} more)</Text>
                  <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No receipts yet. Start by adding your first receipt!</Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddReceipt}>
                <Text style={styles.emptyStateButtonText}>Add Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Totals Section */}
        <View style={[styles.totalsSection, { marginBottom: 20 + Math.max(insets.bottom, 0) }]}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total You Paid</Text>
            <Text style={styles.totalAmountOwe}>${totalYouPaid.toFixed(2)}</Text>
          </View>

        </View>
      </ScrollView>

      {/* Floating Action Button Menu */}
      <View style={[styles.fabContainer, { bottom: 80 + Math.max(insets.bottom, 0) }]}>
        {/* Menu Items */}
        <Animated.View
          style={[
            styles.fabMenuItem,
            {
              transform: [
                {
                  translateY: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -150],
                  }),
                },
                {
                  scale: fabAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.8, 1],
                  }),
                },
              ],
              opacity: fabAnimation,
            },
          ]}
        >
          <TouchableOpacity style={styles.fabMenuButton} onPress={handleMicrophonePress}>
            <Ionicons name="mic-outline" size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.fabMenuItem,
            {
              transform: [
                {
                  translateY: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -100],
                  }),
                },
                {
                  scale: fabAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.8, 1],
                  }),
                },
              ],
              opacity: fabAnimation,
            },
          ]}
        >
          <TouchableOpacity style={styles.fabMenuButton} onPress={handleChatPress}>
            <Ionicons name="chatbubble-outline" size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.fabMenuItem,
            {
              transform: [
                {
                  translateY: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                },
                {
                  scale: fabAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.8, 1],
                  }),
                },
              ],
              opacity: fabAnimation,
            },
          ]}
        >
          <TouchableOpacity style={styles.fabMenuButton} onPress={handleManualEntryPress}>
            <Ionicons name="create-outline" size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB */}
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [
                {
                  rotate: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity style={styles.fabButton} onPress={toggleFabMenu}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom Navigation Placeholder */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleFriendsNavigation}>
          <Ionicons name="people-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleViewAllReceipts}>
          <Ionicons name="receipt-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfileNavigation}>
          <Ionicons name="person-outline" size={24} color="#999" />
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: padding.xl,
    paddingVertical: padding.xl,
    paddingTop: padding.xxl,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    minHeight: height.header,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    paddingTop: padding.sm,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingTop: 10,

    paddingHorizontal: 20,
  },
  section: {
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 12,
    color: '#007AFF',
  },
  friendsList: {
    marginBottom: 5,
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 65,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatarText: {
    fontSize: 16,
  },
  friendName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    marginBottom: 1,
  },
  friendReceipts: {
    fontSize: 9,
    color: '#666',
  },
  receiptItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  receiptLeft: {
    flex: 1,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  receiptType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  youPaidContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  userPaidAmount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight:'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  participantsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  participantNames: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  participantAvatar: {
    fontSize: 16,
    marginRight: 5,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 5,
  },
  receiptRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalsSection: {
    marginTop: 20,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalAmountOwe: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
  },

  totalAmountOwed: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  fabMenuItem: {
    position: 'absolute',
    alignItems: 'center',
  },
  fabMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingBottom: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
