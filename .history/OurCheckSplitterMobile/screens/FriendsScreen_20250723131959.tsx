import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Receipt {
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
  receipts: string[]; // Array of receipt names (for backward compatibility)
  totalPaid: number; // Total amount this friend paid across all receipts
  detailedReceipts?: Receipt[]; // Detailed receipt information
}

interface FriendsScreenProps {
  navigation?: any;
  route?: any;
}

const FriendsScreen = ({ navigation, route }: FriendsScreenProps) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  // Handle navigation from HomeScreen
  useEffect(() => {
    if (route?.params?.selectedFriend) {
      setSelectedFriend(route.params.selectedFriend);
    }
  }, [route?.params?.selectedFriend]);

  // Extended mock data for friends
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

  const handleReceiptsNavigation = () => {
    if (navigation) {
      navigation.navigate('Receipts');
    }
  };

  const handleFriendPress = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const handleBackToFriends = () => {
    setSelectedFriend(null);
  };

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
    {
      id: '6',
      name: 'Lisa',
      avatar: '👩‍💻',
      receipts: ['Shopping Trip', 'Lunch Date', 'Coffee Meeting', 'Book Store'],
      totalPaid: 67.45,
      detailedReceipts: [
        { id: '15', title: 'Shopping Trip', date: 'Oct 25, 2023', totalAmount: 89.60, friendPaidAmount: 44.80, participants: ['You', 'Kate'] },
        { id: '9', title: 'Lunch Date', date: 'Oct 10, 2023', totalAmount: 67.80, friendPaidAmount: 22.60, participants: ['You', 'Mike', 'Sarah'] },
        { id: '16', title: 'Coffee Meeting', date: 'Oct 7, 2023', totalAmount: 24.30, friendPaidAmount: 12.15, participants: ['You'] },
        { id: '12', title: 'Book Store', date: 'Oct 3, 2023', totalAmount: 45.20, friendPaidAmount: 22.60, participants: ['You', 'Mike'] },
      ]
    },
    {
      id: '7',
      name: 'David',
      avatar: '👨‍🔬',
      receipts: ['Lab Equipment', 'Research Dinner', 'Conference Lunch', 'Hotel Stay', 'Airport Taxi', 'Breakfast'],
      totalPaid: 234.60,
      detailedReceipts: [
        { id: '17', title: 'Lab Equipment', date: 'Oct 26, 2023', totalAmount: 156.80, friendPaidAmount: 78.40, participants: ['You', 'Kate'] },
        { id: '11', title: 'Research Dinner', date: 'Oct 5, 2023', totalAmount: 89.50, friendPaidAmount: 29.83, participants: ['You', 'Mike', 'Lisa'] },
        { id: '18', title: 'Conference Lunch', date: 'Oct 2, 2023', totalAmount: 45.70, friendPaidAmount: 22.85, participants: ['You'] },
        { id: '19', title: 'Hotel Stay', date: 'Sep 29, 2023', totalAmount: 189.00, friendPaidAmount: 94.50, participants: ['You'] },
        { id: '20', title: 'Airport Taxi', date: 'Sep 28, 2023', totalAmount: 34.20, friendPaidAmount: 17.10, participants: ['You'] },
        { id: '21', title: 'Breakfast', date: 'Sep 27, 2023', totalAmount: 28.40, friendPaidAmount: 14.20, participants: ['You'] },
      ]
    },
    {
      id: '8',
      name: 'Kate',
      avatar: '👩‍🎨',
      receipts: ['Art Supplies', 'Gallery Visit', 'Creative Workshop'],
      totalPaid: 78.30
    },
  ];

  // Filter friends based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) {
      return friends;
    }

    const query = searchQuery.toLowerCase();
    return friends.filter(friend =>
      friend.name.toLowerCase().includes(query) ||
      friend.receipts.some(receipt => receipt.toLowerCase().includes(query))
    );
  }, [searchQuery, friends]);

  const renderFriend = (friend: Friend) => (
    <TouchableOpacity key={friend.id} style={styles.friendCard} onPress={() => handleFriendPress(friend)}>
      <View style={styles.friendLeft}>
        <View style={styles.friendAvatar}>
          <Text style={styles.avatarText}>{friend.avatar}</Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={styles.friendReceiptsCount}>{friend.receipts.length} receipts</Text>
          <Text style={styles.friendReceiptsList}>
            {friend.receipts.slice(0, 2).join(', ')}
            {friend.receipts.length > 2 && `, +${friend.receipts.length - 2} more`}
          </Text>
        </View>
      </View>
      <View style={styles.friendRight}>
        <Text style={styles.totalPaidLabel}>Total Paid</Text>
        <Text style={styles.totalPaidAmount}>
          ${friend.totalPaid.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFriendDetail = () => {
    if (!selectedFriend) return null;

    return (
      <View style={styles.friendDetailContainer}>
        {/* Friend Detail Header */}
        <View style={styles.friendDetailHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToFriends}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.friendDetailInfo}>
            <View style={styles.friendDetailAvatar}>
              <Text style={styles.friendDetailAvatarText}>{selectedFriend.avatar}</Text>
            </View>
            <View style={styles.friendDetailText}>
              <Text style={styles.friendDetailName}>{selectedFriend.name}</Text>
              <Text style={styles.friendDetailStats}>
                {selectedFriend.receipts.length} receipts • ${selectedFriend.totalPaid.toFixed(2)} total paid
              </Text>
            </View>
          </View>
        </View>

        {/* Friend's Receipts List */}
        <ScrollView style={styles.friendReceiptsContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.receiptsListTitle}>Receipts</Text>
          {selectedFriend.detailedReceipts?.map((receipt) => (
            <TouchableOpacity key={receipt.id} style={styles.friendReceiptItem}>
              <View style={styles.friendReceiptLeft}>
                <Text style={styles.friendReceiptTitle}>{receipt.title}</Text>
                <Text style={styles.friendReceiptDate}>{receipt.date}</Text>
                <View style={styles.friendPaidContainer}>
                  <Text style={styles.friendReceiptType}>
                    {selectedFriend.name} Paid
                  </Text>
                  <Text style={styles.friendPaidAmount}>
                    ${receipt.friendPaidAmount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.friendReceiptParticipants}>
                  <Text style={styles.friendReceiptParticipantsLabel}>With: </Text>
                  <Text style={styles.friendReceiptParticipantNames}>
                    {receipt.participants.filter(p => p !== selectedFriend.name).join(', ')}
                  </Text>
                </View>
              </View>
              <View style={styles.friendReceiptRight}>
                <Text style={styles.friendReceiptTotalLabel}>Total</Text>
                <Text style={styles.friendReceiptAmount}>
                  ${receipt.totalAmount.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          )) || selectedFriend.receipts.map((receipt, index) => (
            <View key={index} style={styles.receiptItem}>
              <View style={styles.receiptLeft}>
                <Ionicons name="receipt-outline" size={20} color="#007AFF" />
                <Text style={styles.receiptName}>{receipt}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {selectedFriend ? (
        renderFriendDetail()
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Friends</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="person-add-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Friends List */}
        <View style={styles.friendsList}>
          {filteredFriends.length > 0 ? (
            filteredFriends.map(renderFriend)
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                {searchQuery.trim() ? 'No friends found' : 'No friends yet'}
              </Text>
              {searchQuery.trim() && (
                <Text style={styles.noResultsSubtext}>
                  Try searching for a different name or receipt
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
        </>
      )}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomeNavigation}>
          <Ionicons name="home-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleReceiptsNavigation}>
          <Ionicons name="receipt-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
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
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 5,
  },
  addButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  friendsList: {
    paddingTop: 10,
  },
  friendCard: {
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
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendReceiptsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  friendReceiptsList: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  friendRight: {
    alignItems: 'flex-end',
  },
  totalPaidLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  totalPaidAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsText: { 
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  friendDetailContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  friendDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  friendDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 15,
  },
  friendDetailAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  friendDetailAvatarText: {
    fontSize: 24,
  },
  friendDetailText: {
    flex: 1,
  },
  friendDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  friendDetailStats: {
    fontSize: 14,
    color: '#666',
  },
  friendReceiptsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  receiptsListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  receiptName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  // Friend receipt styles (HomeScreen format)
  friendReceiptItem: {
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
  friendReceiptLeft: {
    flex: 1,
  },
  friendReceiptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendReceiptDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  friendReceiptType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  friendPaidContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  friendPaidAmount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  friendReceiptParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  friendReceiptParticipantsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  friendReceiptParticipantNames: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  friendReceiptRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  friendReceiptTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  friendReceiptAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
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

export default FriendsScreen;
