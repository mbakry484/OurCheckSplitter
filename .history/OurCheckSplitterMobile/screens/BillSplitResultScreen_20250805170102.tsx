import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, padding, height, width, screenDimensions } from '../utils/responsive';

interface BillSplitResultScreenProps {
  navigation?: any;
  route?: any;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
}

interface ReceiptItem {
  id: string;
  name: string;
  price: string;
  quantity: string;
  assignedFriends: string[];
  splitEqually: boolean;
  subitems: SubItem[];
}

interface SubItem {
  id: string;
  name: string;
  price: string;
  assignedFriends: string[];
}

interface FriendBill {
  friend: Friend;
  items: FriendBillItem[];
  totalAmount: number;
}

interface FriendBillItem {
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

const BillSplitResultScreen = ({ navigation, route }: BillSplitResultScreenProps) => {
  const insets = useSafeAreaInsets();
  const { receiptData } = route?.params || {};
  
  const calculateFriendBills = () => {
    if (!receiptData) return [];
    
    const friendBills: FriendBill[] = [];
    const { items, friends, selectedFriends } = receiptData;
    
    // Initialize friend bills
    selectedFriends.forEach(friend => {
      friendBills.push({
        friend,
        items: [],
        totalAmount: 0
      });
    });
    
    // Calculate bills for each item
    items.forEach(item => {
      const itemPrice = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      
      if (item.splitEqually) {
        // Split equally among assigned friends
        if (item.assignedFriends.length > 0) {
          const pricePerFriend = itemPrice / item.assignedFriends.length;
          
          item.assignedFriends.forEach(friendId => {
            const friendBill = friendBills.find(bill => bill.friend.id === friendId);
            if (friendBill) {
              friendBill.items.push({
                itemName: item.name,
                quantity: quantity,
                pricePerUnit: itemPrice / quantity,
                totalPrice: pricePerFriend
              });
              friendBill.totalAmount += pricePerFriend;
            }
          });
        }
      } else {
        // Individual subitem assignments
        item.subitems.forEach(subitem => {
          if (subitem.assignedFriends.length > 0) {
            const pricePerFriend = parseFloat(subitem.price) / subitem.assignedFriends.length;
            
            subitem.assignedFriends.forEach(friendId => {
              const friendBill = friendBills.find(bill => bill.friend.id === friendId);
              if (friendBill) {
                friendBill.items.push({
                  itemName: `${item.name} (Subitem)`,
                  quantity: 1,
                  pricePerUnit: parseFloat(subitem.price),
                  totalPrice: pricePerFriend
                });
                friendBill.totalAmount += pricePerFriend;
              }
            });
          }
        });
      }
    });
    
    return friendBills;
  };
  
  const friendBills = calculateFriendBills();
  const totalReceiptAmount = friendBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  
  const handleGoBack = () => {
    if (navigation) {
      navigation.navigate('Receipts');
    }
  };
  
  const renderFriendBill = (friendBill: FriendBill, index: number) => (
    <View key={friendBill.friend.id} style={styles.friendBillCard}>
      <View style={styles.friendBillHeader}>
        <View style={styles.friendInfo}>
          <Text style={styles.friendAvatar}>{friendBill.friend.avatar}</Text>
          <Text style={styles.friendName}>{friendBill.friend.name}</Text>
        </View>
        <Text style={styles.friendTotal}>${friendBill.totalAmount.toFixed(2)}</Text>
      </View>
      
      {friendBill.items.length > 0 ? (
        <View style={styles.itemsList}>
          {friendBill.items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity > 1 ? `${item.quantity} × $${item.pricePerUnit.toFixed(2)}` : ''}
                </Text>
              </View>
              <Text style={styles.itemPrice}>${item.totalPrice.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noItemsText}>No items assigned</Text>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Split Results</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Receipt Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>${totalReceiptAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Number of Friends:</Text>
            <Text style={styles.summaryValue}>{friendBills.length}</Text>
          </View>
        </View>
        
        {/* Friend Bills */}
        <View style={styles.friendBillsSection}>
          <Text style={styles.sectionTitle}>Individual Bills</Text>
          {friendBills.map(renderFriendBill)}
        </View>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    paddingHorizontal: padding.xl,
    paddingVertical: padding.xl,
    paddingTop: padding.xxl,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    minHeight: height.header,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendBillsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  friendBillCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendBillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendAvatar: {
    fontSize: 20,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noItemsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default BillSplitResultScreen; 