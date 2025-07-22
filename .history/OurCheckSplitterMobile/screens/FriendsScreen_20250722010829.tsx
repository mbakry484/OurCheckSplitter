import React from 'react';
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

interface Friend {
  id: string;
  name: string;
  avatar: string;
  receipts: number;
  totalOwed: number;
  totalOwes: number;
}

interface FriendsScreenProps {
  navigation?: any;
}

const FriendsScreen = ({ navigation }: FriendsScreenProps) => {
  const insets = useSafeAreaInsets();

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

  const friends: Friend[] = [
    { id: '1', name: 'John', avatar: '👨', receipts: 5, totalOwed: 15.25, totalOwes: 8.50 },
    { id: '2', name: 'Sarah', avatar: '👩', receipts: 3, totalOwed: 22.75, totalOwes: 12.00 },
    { id: '3', name: 'Mike', avatar: '👨‍💼', receipts: 8, totalOwed: 5.50, totalOwes: 18.25 },
    { id: '4', name: 'Emma', avatar: '👩‍🦰', receipts: 1, totalOwed: 0.00, totalOwes: 14.45 },
    { id: '5', name: 'Alex', avatar: '👨‍🎓', receipts: 2, totalOwed: 9.25, totalOwes: 5.75 },
    { id: '6', name: 'Lisa', avatar: '👩‍💻', receipts: 4, totalOwed: 12.80, totalOwes: 0.00 },
    { id: '7', name: 'David', avatar: '👨‍🔬', receipts: 6, totalOwed: 7.90, totalOwes: 11.30 },
    { id: '8', name: 'Kate', avatar: '👩‍🎨', receipts: 3, totalOwed: 16.40, totalOwes: 3.20 },
  ];

  const renderFriend = (friend: Friend) => (
    <TouchableOpacity key={friend.id} style={styles.friendCard}>
      <View style={styles.friendLeft}>
        <View style={styles.friendAvatar}>
          <Text style={styles.avatarText}>{friend.avatar}</Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={styles.friendReceipts}>{friend.receipts} receipts</Text>
        </View>
      </View>
      <View style={styles.friendRight}>
        {friend.totalOwed > 0 && (
          <Text style={styles.owedAmount}>
            owes you ${friend.totalOwed.toFixed(2)}
          </Text>
        )}
        {friend.totalOwes > 0 && (
          <Text style={styles.owesAmount}>
            you owe ${friend.totalOwes.toFixed(2)}
          </Text>
        )}
        {friend.totalOwed === 0 && friend.totalOwes === 0 && (
          <Text style={styles.settledAmount}>settled up</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Friends List */}
        <View style={styles.friendsList}>
          {friends.map(renderFriend)}
        </View>
      </ScrollView>

      {/* Bottom Navigation Placeholder */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomeNavigation}>
          <Ionicons name="home-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
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
    paddingTop: 40,
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
  friendReceipts: {
    fontSize: 14,
    color: '#666',
  },
  friendRight: {
    alignItems: 'flex-end',
  },
  owedAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  owesAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  settledAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
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
