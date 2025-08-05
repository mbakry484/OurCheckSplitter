import React, { useState, useMemo } from 'react';
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
  userPaidAmount: number;
  type: 'paid';
  participants: string[]; // friend names
}

interface ReceiptsScreenProps {
  navigation?: any;
}

const ReceiptsScreen = ({ navigation }: ReceiptsScreenProps) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

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

  // All receipts data (same as HomeScreen but complete list)
  const allReceipts: Receipt[] = [
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
    // Additional receipts to show more content
    {
      id: '9',
      title: 'Team Lunch',
      date: 'Oct 10, 2023',
      totalAmount: 67.80,
      userPaidAmount: 22.60,
      type: 'paid',
      participants: ['Mike', 'Sarah', 'Lisa'],
    },
    {
      id: '10',
      title: 'Concert Tickets',
      date: 'Oct 8, 2023',
      totalAmount: 120.00,
      userPaidAmount: 60.00,
      type: 'paid',
      participants: ['Kate', 'David'],
    },
  ];

  // Filter receipts based on search query
  const filteredReceipts = useMemo(() => {
    if (!searchQuery.trim()) {
      return allReceipts;
    }
    
    const query = searchQuery.toLowerCase();
    return allReceipts.filter(receipt => 
      receipt.title.toLowerCase().includes(query) ||
      receipt.participants.some(participant => participant.toLowerCase().includes(query))
    );
  }, [searchQuery, allReceipts]);

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
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Receipts</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddReceipt}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search receipts..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipts List */}
        <View style={styles.receiptsList}>
          {filteredReceipts.length > 0 ? (
            filteredReceipts.map(renderReceipt)
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                {searchQuery.trim() ? 'No receipts found' : 'No receipts yet'}
              </Text>
              {searchQuery.trim() && (
                <Text style={styles.noResultsSubtext}>
                  Try searching for a different receipt or participant
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomeNavigation}>
          <Ionicons name="home-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleFriendsNavigation}>
          <Ionicons name="people-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="receipt" size={24} color="#007AFF" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    minHeight: 70,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    paddingTop: 10,
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
  receiptsList: {
    paddingTop: 10,
  },
  // Receipt styles (same as HomeScreen)
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
  receiptRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '600',
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

export default ReceiptsScreen;
