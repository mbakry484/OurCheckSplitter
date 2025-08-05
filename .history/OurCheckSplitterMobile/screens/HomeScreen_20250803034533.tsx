import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

  // Mock data - replace with actual data later (matching FriendsScreen data)
  const friends: Friend[] = [
    {
      id: '1',
      name: 'John',
      avatar: '👨',
      receipts: ['Dinner at Italian Place', 'Pizza Lunch', 'Gas Station', 'Breakfast at Cafe', 'Movie Night'],
      totalPaid: 89.75,
      detailedReceipts: [
        { id: '1', title: 'Dinner at Italian Place', date: 'Oct 30, 2023', totalAmount: 51.00, friendPaidAmount: 25.50, participants: ['You', 'Sarah'] },
        { id: '5', title: 'Pizza Lunch', date: 'Oct 20, 2023', totalAmount: 32.75, friendPaidAmount: 10.92, participants: ['You', 'Emma', 'Alex'] },
        { id: '6', title: 'Gas Station', date: 'Oct 18, 2023', totalAmount: 45.20, friendPaidAmount: 22.60, participants: ['You', 'Sarah'] },
        { id: '7', title: 'Breakfast at Cafe', date: 'Oct 15, 2023', totalAmount: 28.90, friendPaidAmount: 14.45, participants: ['You', 'Emma'] },
        { id: '4', title: 'Movie Night', date: 'Oct 22, 2023', totalAmount: 48.00, friendPaidAmount: 16.28, participants: ['You', 'Sarah', 'Mike'] },
      ]
    },
    {
      id: '2',
      name: 'Sarah',
      avatar: '👩',
      receipts: ['Dinner at Italian Place', 'Gas Station', 'Movie Night'],
      totalPaid: 45.20,
      detailedReceipts: [
        { id: '1', title: 'Dinner at Italian Place', date: 'Oct 30, 2023', totalAmount: 51.00, friendPaidAmount: 25.50, participants: ['You', 'John'] },
        { id: '6', title: 'Gas Station', date: 'Oct 18, 2023', totalAmount: 45.20, friendPaidAmount: 22.60, participants: ['You', 'John'] },
        { id: '4', title: 'Movie Night', date: 'Oct 22, 2023', totalAmount: 48.00, friendPaidAmount: 16.00, participants: ['You', 'John', 'Mike'] },
      ]
    },
    {
      id: '3',
      name: 'Mike',
      avatar: '👨‍💼',
      receipts: ['Movie Night', 'Uber Ride', 'Lunch Meeting', 'Coffee Break', 'Team Dinner', 'Office Supplies', 'Taxi Ride', 'Snacks'],
      totalPaid: 156.80,
      detailedReceipts: [
        { id: '4', title: 'Movie Night', date: 'Oct 22, 2023', totalAmount: 48.00, friendPaidAmount: 15.72, participants: ['You', 'John', 'Sarah'] },
        { id: '8', title: 'Uber Ride', date: 'Oct 12, 2023', totalAmount: 18.50, friendPaidAmount: 9.25, participants: ['You', 'Alex'] },
        { id: '9', title: 'Lunch Meeting', date: 'Oct 10, 2023', totalAmount: 67.80, friendPaidAmount: 22.60, participants: ['You', 'Sarah', 'Lisa'] },
        { id: '10', title: 'Coffee Break', date: 'Oct 8, 2023', totalAmount: 15.40, friendPaidAmount: 7.70, participants: ['You', 'Emma'] },
        { id: '11', title: 'Team Dinner', date: 'Oct 5, 2023', totalAmount: 89.50, friendPaidAmount: 29.83, participants: ['You', 'Lisa', 'David'] },
        { id: '12', title: 'Office Supplies', date: 'Oct 3, 2023', totalAmount: 45.20, friendPaidAmount: 22.60, participants: ['You', 'Lisa'] },
        { id: '13', title: 'Taxi Ride', date: 'Sep 30, 2023', totalAmount: 25.80, friendPaidAmount: 12.90, participants: ['You', 'Alex'] },
        { id: '14', title: 'Snacks', date: 'Sep 28, 2023', totalAmount: 32.40, friendPaidAmount: 16.20, participants: ['You', 'Emma'] },
      ]
    },
    {
      id: '4',
      name: 'Emma',
      avatar: '👩‍🦰',
      receipts: ['Groceries', 'Pizza Lunch', 'Breakfast at Cafe'],
      totalPaid: 32.15,
      detailedReceipts: [
        { id: '2', title: 'Groceries', date: 'Oct 29, 2023', totalAmount: 25.98, friendPaidAmount: 12.99, participants: ['You'] },
        { id: '5', title: 'Pizza Lunch', date: 'Oct 20, 2023', totalAmount: 32.75, friendPaidAmount: 10.91, participants: ['You', 'John', 'Alex'] },
        { id: '7', title: 'Breakfast at Cafe', date: 'Oct 15, 2023', totalAmount: 28.90, friendPaidAmount: 14.45, participants: ['You', 'John'] },
      ]
    },
    {
      id: '5',
      name: 'Alex',
      avatar: '👨‍🎓',
      receipts: ['Coffee with Alex', 'Pizza Lunch', 'Uber Ride'],
      totalPaid: 28.90,
      detailedReceipts: [
        { id: '3', title: 'Coffee with Alex', date: 'Oct 24, 2023', totalAmount: 11.50, friendPaidAmount: 5.75, participants: ['You'] },
        { id: '5', title: 'Pizza Lunch', date: 'Oct 20, 2023', totalAmount: 32.75, friendPaidAmount: 10.92, participants: ['You', 'John', 'Emma'] },
        { id: '8', title: 'Uber Ride', date: 'Oct 12, 2023', totalAmount: 18.50, friendPaidAmount: 9.25, participants: ['You', 'Mike'] },
      ]
    },
  ];

  const recentReceipts: Receipt[] = [
    {
      id: '1',
      title: 'Dinner at Italian Place',
      date: 'Oct 30, 2023',
      totalAmount: 51.00,
      userPaidAmount: 25.50,
      type: 'paid',
      participants: ['John', 'Sarah'],
    },
    {
      id: '2',
      title: 'Groceries',
      date: 'Oct 29, 2023',
      totalAmount: 25.98,
      userPaidAmount: 12.99,
      type: 'paid',
      participants: ['Emma'],
    },
    {
      id: '3',
      title: 'Coffee with Alex',
      date: 'Oct 24, 2023',
      totalAmount: 11.50,
      userPaidAmount: 5.75,
      type: 'paid',
      participants: ['Alex'],
    },
    {
      id: '4',
      title: 'Movie Night',
      date: 'Oct 22, 2023',
      totalAmount: 48.00,
      userPaidAmount: 16.00,
      type: 'paid',
      participants: ['John', 'Sarah', 'Mike'],
    },
    {
      id: '5',
      title: 'Pizza Lunch',
      date: 'Oct 20, 2023',
      totalAmount: 32.75,
      userPaidAmount: 32.75,
      type: 'paid',
      participants: ['John', 'Emma', 'Alex'],
    },
    {
      id: '6',
      title: 'Gas Station',
      date: 'Oct 18, 2023',
      totalAmount: 45.20,
      userPaidAmount: 22.60,
      type: 'paid',
      participants: ['John', 'Sarah'],
    },
    {
      id: '7',
      title: 'Breakfast at Cafe',
      date: 'Oct 15, 2023',
      totalAmount: 28.90,
      userPaidAmount: 14.45,
      type: 'paid',
      participants: ['John', 'Emma'],
    },
    {
      id: '8',
      title: 'Uber Ride',
      date: 'Oct 12, 2023',
      totalAmount: 18.50,
      userPaidAmount: 9.25,
      type: 'paid',
      participants: ['Mike', 'Alex'],
    },
  ];

  const totalYouPaid = 31.25;

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

  const handleFriendPress = (friend: Friend) => {
    if (navigation) {
      navigation.navigate('Friends', { selectedFriend: friend });
    }
  };

  const renderFriend = (friend: Friend) => (
    <TouchableOpacity key={friend.id} style={styles.friendItem} onPress={() => handleFriendPress(friend)}>
      <View style={styles.friendAvatar}>
        <Text style={styles.avatarText}>{friend.avatar}</Text>
      </View>
      <Text style={styles.friendName}>{friend.name}</Text>
      <Text style={styles.friendReceipts}>{friend.receipts.length} Receipts</Text>
    </TouchableOpacity>
  );

  const renderReceipt = (receipt: Receipt) => (
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <Text style={styles.headerTitle}>SplitWise</Text>
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
            {friends.map(renderFriend)}
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
          {recentReceipts.slice(0, 5).map(renderReceipt)}
          {recentReceipts.length > 5 && (
            <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewAllReceipts}>
              <Text style={styles.viewMoreText}>View More ({recentReceipts.length - 5} more)</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    minHeight: 70,
  },
  headerTitle: {
    fontSize: 24,
    paddingTop: 10,
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
});

export default HomeScreen;
