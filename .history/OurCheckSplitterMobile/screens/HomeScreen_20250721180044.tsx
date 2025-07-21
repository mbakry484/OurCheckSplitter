import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  receipts: number;
}

interface Receipt {
  id: string;
  title: string;
  date: string;
  totalAmount: number;
  userPaidAmount: number;
  type: 'paid';
  participants: string[];
}

const HomeScreen = () => {
  // Mock data - replace with actual data later
  const friends: Friend[] = [
    { id: '1', name: 'John', avatar: '👨', receipts: 5 },
    { id: '2', name: 'Sarah', avatar: '👩', receipts: 3 },
    { id: '3', name: 'Mike', avatar: '👨‍💼', receipts: 8 },
    { id: '4', name: 'Emma', avatar: '👩‍🦰', receipts: 1 },
    { id: '5', name: 'Alex', avatar: '👨‍🎓', receipts: 2 },
  ];

  const recentReceipts: Receipt[] = [
    {
      id: '1',
      title: 'Dinner at Italian Place',
      date: 'Oct 30, 2023',
      totalAmount: 51.00,
      userPaidAmount: 25.50,
      type: 'paid',
      participants: ['👨', '👩'],
    },
    {
      id: '2',
      title: 'Groceries',
      date: 'Oct 29, 2023',
      totalAmount: 25.98,
      userPaidAmount: 12.99,
      type: 'paid',
      participants: ['👩‍🦰'],
    },
    {
      id: '3',
      title: 'Coffee with Alex',
      date: 'Oct 24, 2023',
      totalAmount: 11.50,
      userPaidAmount: 5.75,
      type: 'paid',
      participants: ['👨‍🎓'],
    },
  ];

  const totalYouPaid = 31.25;

  const renderFriend = (friend: Friend) => (
    <TouchableOpacity key={friend.id} style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.avatarText}>{friend.avatar}</Text>
      </View>
      <Text style={styles.friendName}>{friend.name}</Text>
      <Text style={styles.friendReceipts}>{friend.receipts} Receipts</Text>
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
          {receipt.participants.map((participant, index) => (
            <Text key={index} style={styles.participantAvatar}>
              {participant}
            </Text>
          ))}
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SplitWise</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Friends Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsList}>
            {friends.map(renderFriend)}
          </ScrollView>
        </View>

        {/* Recent Receipts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Receipts</Text>
          {recentReceipts.map(renderReceipt)}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total You Paid</Text>
            <Text style={styles.totalAmountOwe}>${totalYouPaid.toFixed(2)}</Text>
          </View>
         
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Bottom Navigation Placeholder */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people-outline" size={24} color="#999" />
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
    height: 15,
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop:40,
    flexDirection: 'row',
    justifyContent: 'center',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    marginBottom:15,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  friendsList: {
    marginBottom: 10,
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 80,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 20,
  },
  friendName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  friendReceipts: {
    fontSize: 10,
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
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 4,
  },
  participants: {
    flexDirection: 'row',
  },
  participantAvatar: {
    fontSize: 16,
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
    marginBottom: 100,
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
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
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
  bottomNav: {
    marginBottom:0,
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

export default HomeScreen;
