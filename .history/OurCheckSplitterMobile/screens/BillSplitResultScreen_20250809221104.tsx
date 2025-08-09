import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
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
  const receiptRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  
  const calculateFriendBills = () => {
    if (!receiptData) return [];
    
    const friendBills: FriendBill[] = [];
    const { items, friends, selectedFriends } = receiptData;
    
    // Initialize friend bills
    selectedFriends.forEach((friend: Friend) => {
      friendBills.push({
        friend,
        items: [],
        totalAmount: 0
      });
    });
    
    // Calculate bills for each item
    items.forEach((item: ReceiptItem) => {
      const itemPrice = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      
      if (item.splitEqually) {
        // Split equally among assigned friends
        if (item.assignedFriends.length > 0) {
          const pricePerFriend = itemPrice / item.assignedFriends.length;
          
          item.assignedFriends.forEach((friendId: string) => {
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
        item.subitems.forEach((subitem: SubItem) => {
          if (subitem.assignedFriends.length > 0) {
            const pricePerFriend = parseFloat(subitem.price) / subitem.assignedFriends.length;
            
            subitem.assignedFriends.forEach((friendId: string) => {
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
  // Keep typography consistent (no auto down-scaling). We'll wrap long lines instead.
  const contentScale = 1;
  
  const handleGoBack = () => {
    if (navigation) {
      navigation.navigate('Receipts');
    }
  };

  const handleShareReceipt = async () => {
    try {
      if (receiptRef.current) {
        setIsSharing(true);
        
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('Error', 'Sharing is not available on this device');
          setIsSharing(false);
          return;
        }

        // Add a longer delay to ensure the view is fully rendered and all content is visible
        setTimeout(async () => {
          try {
            // First, scroll to top to ensure all content is visible
            if (receiptRef.current) {
              // Force a re-render by updating state
              const currentTime = Date.now();
              console.log('Capturing receipt at:', currentTime);
            }
            
            const uri = await captureRef(receiptRef, {
              format: 'png',
              quality: 1.0,
              result: 'tmpfile',
              snapshotContentContainer: true, // Changed to true to capture the entire content
              height: undefined, // Let it determine height automatically
              width: undefined, // Let it determine width automatically
            });
            
            console.log('Captured image URI:', uri);
            
            // Share the image
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: 'Share Receipt',
            });
            
            console.log('Receipt shared successfully');
          } catch (captureError) {
            console.error('Capture error:', captureError);
            
            // Try alternative capture method
            try {
              const alternativeUri = await captureRef(receiptRef, {
                format: 'png',
                quality: 0.8,
                result: 'tmpfile',
                snapshotContentContainer: false,
              });
              
              console.log('Alternative capture successful:', alternativeUri);
              await Sharing.shareAsync(alternativeUri, {
                mimeType: 'image/png',
                dialogTitle: 'Share Receipt',
              });
              
              console.log('Receipt shared successfully (alternative method)');
            } catch (alternativeError) {
              console.error('Alternative capture also failed:', alternativeError);
              Alert.alert('Error', 'Failed to capture receipt. Please try again.');
            }
          } finally {
            setIsSharing(false);
          }
        }, 1000); // Increased delay to 1000ms for better reliability
      } else {
        Alert.alert('Error', 'Receipt content not available');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };
  
  const renderFriendBill = (friendBill: FriendBill, index: number) => {
    // Dynamic sizing based on overall contentScale
    const dynamicCardStyle = {
      ...styles.friendBillCard,
      paddingVertical: 10 * contentScale,
      marginBottom: 8 * contentScale,
    } as const;
    
    const dynamicFontSize = {
      fontSize: Math.round(16 * contentScale),
    } as const;
    
    const dynamicItemFontSize = {
      fontSize: Math.round(13 * contentScale),
    } as const;
    
    return (
      <View key={friendBill.friend.id} style={dynamicCardStyle}>
        <View style={styles.friendBillHeader}>
          <View style={styles.friendInfo}>
            <Text style={[styles.friendAvatar, dynamicFontSize]}>{friendBill.friend.avatar}</Text>
            <Text style={[styles.friendName, dynamicFontSize]}>{friendBill.friend.name}</Text>
          </View>
          <Text style={[styles.friendTotal, dynamicFontSize]}>${friendBill.totalAmount.toFixed(2)}</Text>
        </View>
        
        {friendBill.items.length > 0 ? (
          <View style={styles.itemsList}>
            {friendBill.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, dynamicItemFontSize]}>
                    {item.itemName} (${item.totalPrice.toFixed(2)})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.noItemsText, dynamicItemFontSize]}>No items assigned</Text>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RECEIPT</Text>
        {/* Edit button (go back to edit receipt) */}
        <TouchableOpacity
          style={styles.editHeaderButton}
          onPress={() => {
            if (navigation) {
              navigation.navigate('AddReceipt', {
                basicData: {
                  receiptName: receiptData?.receiptTitle || '',
                  date: receiptData?.receiptDate || '',
                  tips: receiptData?.tip?.toString() || '0',
                  tax: receiptData?.tax?.toString() || '0',
                  total: receiptData?.totalAmount || 0,
                },
                receiptData,
                isEditing: true,
              });
            }
          }}
        >
          <Ionicons name="create-outline" size={22} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.shareButton, isSharing && styles.shareButtonDisabled]} 
          onPress={handleShareReceipt}
          disabled={isSharing}
        >
          <Ionicons 
            name={isSharing ? "hourglass-outline" : "share-outline"} 
            size={24} 
            color={isSharing ? "#999" : "black"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Receipt Summary - Fixed Size Container (reset for new build) */}
      <View ref={receiptRef} style={styles.receiptContainer} collapsable={false}>
        {/* Receipt Title and Date */}
        <View style={styles.receiptHeaderArea}>
          {!!receiptData?.receiptTitle && (
            <Text style={[styles.receiptTitle, { fontSize: Math.round(20 * contentScale) }]}>
              {receiptData.receiptTitle}
            </Text>
          )}
          <Text style={[styles.receiptDate, { fontSize: Math.round(12 * contentScale) }]}>
            {receiptData?.receiptDate || ''}
          </Text>
          <View style={styles.separator} />
        </View>

        {/* Friend Blocks */}
        <View style={styles.friendBlocks}>
          {friendBills.map((bill) => {
            const parts = bill.items.map((it) => `${it.itemName} ($${it.totalPrice.toFixed(2)})`);
            const maxChars = 48; // wrap point per line
            const lines: string[] = [];
            let current = '';
            for (const p of parts) {
              if (current.length === 0) current = p;
              else if ((current + ', ' + p).length <= maxChars) current += ', ' + p;
              else {
                lines.push(current);
                current = p;
              }
            }
            if (current.length) lines.push(current);

            return (
              <View key={bill.friend.id} style={styles.friendBlock}>
                <View style={styles.friendRow}>
                  <Text style={[styles.friendNameBW, { fontSize: Math.round(16 * contentScale) }]}>
                    {bill.friend.name}
                  </Text>
                  <Text style={[styles.friendAmountBW, { fontSize: Math.round(16 * contentScale) }]}>
                    ${bill.totalAmount.toFixed(2)}
                  </Text>
                </View>
                {lines.map((ln, idx) => (
                  <Text
                    key={idx}
                    style={[styles.itemsInlineBW, { fontSize: Math.round(12 * contentScale), lineHeight: Math.round(16 * contentScale) }]}
                  >
                    {ln}
                  </Text>
                ))}
                <View style={styles.dotRule} />
              </View>
            );
          })}
        </View>

        {/* Grand Total */}
        <View style={styles.totalRowBW}>
          <Text style={[styles.totalLabelBW, { fontSize: Math.round(18 * contentScale) }]}>TOTAL</Text>
          <Text style={[styles.totalValueBW, { fontSize: Math.round(18 * contentScale) }]}>
            ${totalReceiptAmount.toFixed(2)}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: padding.xl,
    paddingVertical: padding.xl,
    paddingTop: padding.xxl,
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: 'black',
    minHeight: height.header,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  shareButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHeaderButton: {
    position: 'absolute',
    right: 64,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  debugBanner: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFEB3B',
    borderWidth: 2,
    borderColor: 'black',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  receiptContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    // Auto-height up to a maximum; eliminates inner white space while
    // preventing the receipt from growing beyond the viewport
    maxHeight: screenDimensions.height - 120,
    // Add margins so it looks like a floating ticket
    width: screenDimensions.width - 32,
    marginHorizontal: 16,
    marginTop: 12,
    alignSelf: 'center',
    // Ensure proper rendering for capture
    overflow: 'hidden',
    // Add shadow and border for better visual capture
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptHeaderArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptTitle: {
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  receiptDate: {
    color: '#333',
    marginTop: 2,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'black',
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  friendBlocks: {
    // Let content define height so TOTAL sits directly under last friend
  },
  friendBlock: {
    marginBottom: 8,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendNameBW: {
    fontWeight: 'bold',
    color: 'black',
  },
  friendAmountBW: {
    fontWeight: 'bold',
    color: 'black',
  },
  itemLineBW: {
    color: '#666',
    marginTop: 2,
  },
  itemsInlineBW: {
    color: '#666',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  dotRule: {
    height: 1,
    borderBottomColor: '#999',
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    marginTop: 6,
  },
  totalRowBW: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: 'black',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabelBW: {
    fontWeight: 'bold',
    color: 'black',
  },
  totalValueBW: {
    fontWeight: 'bold',
    color: 'black',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'black',
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    borderStyle: 'dashed',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  receiptNameRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  receiptName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  friendBillsSection: {
    marginTop: 16,
    flex: 1,
  },
  friendBillsContainer: {
    flex: 1,
    justifyContent: 'space-around',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 16,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    paddingBottom: 8,
  },
  friendBillCard: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    borderStyle: 'dotted',
  },
  friendBillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendAvatar: {
    fontSize: 16,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  friendTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    paddingLeft: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: 'normal',
    color: '#666',
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  noItemsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default BillSplitResultScreen; 