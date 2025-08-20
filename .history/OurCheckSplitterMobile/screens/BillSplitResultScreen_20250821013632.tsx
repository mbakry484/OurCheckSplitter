import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { spacing, fontSize, padding, height, width, screenDimensions } from '../utils/responsive';
import { api } from '../services/api';

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

interface BackendFriendAmount {
  id: number;
  name: string;
  amountToPay: number;
}

interface FriendPayment {
  friend: BackendFriendAmount;
  amountPaid: string;
  change: number | null;
  isCalculating: boolean;
}

const BillSplitResultScreen = ({ navigation, route }: BillSplitResultScreenProps) => {
  const insets = useSafeAreaInsets();
  const { receiptData } = route?.params || {};
  const receiptRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fullReceiptRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoadingAmounts, setIsLoadingAmounts] = useState(true);
  const [backendAmounts, setBackendAmounts] = useState<BackendFriendAmount[]>([]);
  const [showCalculateChangeModal, setShowCalculateChangeModal] = useState(false);
  const [friendPayments, setFriendPayments] = useState<FriendPayment[]>([]);
  
  // Fetch correct amounts from backend
  useEffect(() => {
    const fetchFinalAmounts = async () => {
      if (!receiptData?.receiptId) {
        console.error('No receipt ID found');
        setIsLoadingAmounts(false);
        return;
      }

      try {
        console.log('Fetching final amounts for receipt ID:', receiptData.receiptId);
        const amounts = await api.receipts.getFinalAmounts(receiptData.receiptId);
        console.log('Backend amounts received:', amounts);
        setBackendAmounts(amounts);
        
        // Initialize friend payments for Calculate Change functionality
        const payments: FriendPayment[] = amounts.map((friend: BackendFriendAmount) => ({
          friend: friend,
          amountPaid: '',
          change: null,
          isCalculating: false,
        }));
        setFriendPayments(payments);
      } catch (error) {
        console.error('Failed to fetch final amounts:', error);
        Alert.alert(
          'Error', 
          'Failed to calculate final amounts. Using local calculations as fallback.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoadingAmounts(false);
      }
    };

    fetchFinalAmounts();
  }, [receiptData?.receiptId]);

  // Calculate Change Functions
  const openCalculateChangeModal = () => {
    console.log('Opening Calculate Change Modal');
    console.log('backendAmounts:', backendAmounts);
    console.log('friendPayments:', friendPayments);
    
    // Make sure friendPayments is populated
    if (backendAmounts.length > 0 && friendPayments.length === 0) {
      const payments: FriendPayment[] = backendAmounts.map((friend: BackendFriendAmount) => ({
        friend: friend,
        amountPaid: '',
        change: null,
        isCalculating: false,
      }));
      setFriendPayments(payments);
      console.log('Initialized friendPayments:', payments);
    }
    
    setShowCalculateChangeModal(true);
  };

  const closeCalculateChangeModal = () => {
    setShowCalculateChangeModal(false);
    // Reset all payment inputs and calculations
    setFriendPayments(prev =>
      prev.map(payment => ({
        ...payment,
        amountPaid: '',
        change: null,
        isCalculating: false,
      }))
    );
  };

  const updateAmountPaid = (friendId: number, amount: string) => {
    setFriendPayments(prev =>
      prev.map(payment =>
        payment.friend.id === friendId
          ? { ...payment, amountPaid: amount, change: null }
          : payment
      )
    );
  };

  const calculateChange = async (friendId: number) => {
    const payment = friendPayments.find(p => p.friend.id === friendId);
    if (!payment || !payment.amountPaid.trim()) {
      Alert.alert('Error', 'Please enter the amount paid');
      return;
    }

    const amountPaid = parseFloat(payment.amountPaid);
    if (isNaN(amountPaid) || amountPaid < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Set calculating state
    setFriendPayments(prev =>
      prev.map(p =>
        p.friend.id === friendId
          ? { ...p, isCalculating: true }
          : p
      )
    );

    try {
      console.log(`Calculating change for friend ${friendId}, amount paid: ${amountPaid}`);
      const result = await api.receipts.calculateChange(receiptData.receiptId, friendId, amountPaid);
      console.log('Change calculation result:', result);
      
      // Update the change amount
      setFriendPayments(prev =>
        prev.map(p =>
          p.friend.id === friendId
            ? { ...p, change: result.change, isCalculating: false }
            : p
        )
      );
    } catch (error: any) {
      console.error('Failed to calculate change:', error);
      
      // Network or other errors
      Alert.alert('Error', 'Failed to calculate change. Please check your connection and try again.');
      
      // Reset calculating state
      setFriendPayments(prev =>
        prev.map(p =>
          p.friend.id === friendId
            ? { ...p, isCalculating: false }
            : p
        )
      );
    }
  };

  const clearCalculation = (friendId: number) => {
    setFriendPayments(prev =>
      prev.map(p =>
        p.friend.id === friendId
          ? { ...p, amountPaid: '', change: null, isCalculating: false }
          : p
      )
    );
  };
  
  const calculateFriendBills = () => {
    if (!receiptData) return [];
    
    // If we have backend amounts, use those (they include proper tax/tip distribution)
    if (backendAmounts.length > 0) {
      console.log('Using backend amounts:', backendAmounts);
      
      return backendAmounts.map((backendFriend) => {
        // Find the corresponding friend data for avatar/display
        const friendData = receiptData.selectedFriends?.find(
          (f: Friend) => f.name === backendFriend.name || f.id === backendFriend.id.toString()
        );
        
        // Create a detailed items list by matching with local receipt data
        const items: FriendBillItem[] = [];
        if (receiptData.items) {
          receiptData.items.forEach((item: ReceiptItem) => {
            if (item.assignedFriends.includes(friendData?.id || backendFriend.id.toString())) {
              const itemPrice = parseFloat(item.price) || 0;
              const quantity = parseInt(item.quantity) || 1;
              
              items.push({
                itemName: item.name,
                quantity: quantity,
                pricePerUnit: itemPrice / quantity,
                totalPrice: itemPrice / (item.assignedFriends.length || 1) // Basic split for display
              });
            }
          });
        }
        
        return {
          friend: friendData || { 
            id: backendFriend.id.toString(), 
            name: backendFriend.name, 
            avatar: '👤' 
          },
          items: items,
          totalAmount: backendFriend.amountToPay // Use the correct backend amount
        };
      });
    }
    
    // Fallback to local calculation if backend amounts not available
    console.log('Using fallback local calculation');
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
    
    // Calculate bills for each item (local fallback logic)
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
  const friendCount = friendBills.length;

  // Estimate total lines (after wrapping) to adapt scaling
  const estimatedLines = useMemo(() => {
    const maxChars = 48;
    let lines = 4; // title + date + separator + total row
    friendBills.forEach((bill) => {
      lines += 1; // friend header
      const parts = bill.items.map((it) => `${it.itemName} ($${it.totalPrice.toFixed(2)})`);
      let current = '';
      let wrapped = 0;
      for (const p of parts) {
        if (current.length === 0) current = p;
        else if ((current + ', ' + p).length <= maxChars) current += ', ' + p;
        else { wrapped += 1; current = p; }
      }
      if (current.length) wrapped += 1;
      lines += wrapped;
    });
    return lines;
  }, [friendBills]);

  const contentScale = useMemo(() => {
    if (friendCount <= 3) return 1.12;
    if (friendCount <= 5) return 1.04;
    const target = 26;
    const s = target / Math.max(1, estimatedLines);
    return Math.max(0.7, Math.min(1, s));
  }, [friendCount, estimatedLines]);
  
  const handleGoBack = () => {
    if (navigation) {
      navigation.navigate('Receipts');
    }
  };

  const handleShareReceipt = async () => {
    try {
      setIsSharing(true);
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        setIsSharing(false);
        return;
      }

      if (fullReceiptRef.current) {
        // Wait for the view to be fully rendered and stable
        setTimeout(async () => {
          try {
            // Capture the full receipt component (rendered off-screen)
            const uri = await captureRef(fullReceiptRef.current, {
              format: 'png',
              quality: 0.9,the 
              result: 'tmpfile',
            });
            
            console.log('Captured full receipt image URI:', uri);
            
            // Share the image
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: 'Share Receipt',
            });
            
            console.log('Full receipt shared successfully as image');
          } catch (captureError) {
            console.error('Full receipt capture failed:', captureError);
            
            // Fallback: Try with JPEG format
            try {
              const fallbackUri = await captureRef(fullReceiptRef.current, {
                format: 'jpg',
                quality: 0.8,
                result: 'tmpfile',
              });
              
              await Sharing.shareAsync(fallbackUri, {
                mimeType: 'image/jpeg',
                dialogTitle: 'Share Receipt',
              });
              
              console.log('Full receipt shared successfully (JPEG fallback)');
            } catch (fallbackError) {
              console.error('All capture methods failed:', fallbackError);
              Alert.alert('Error', 'Unable to capture receipt image. Please try again later.');
            }
          } finally {
            setIsSharing(false);
          }
        }, 1000);
      } else {
        Alert.alert('Error', 'Receipt content not available');
        setIsSharing(false);
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share receipt');
      setIsSharing(false);
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
      
      {/* Content Area with Receipt and Buttons */}
      <View style={styles.contentArea}>
        {/* Loading Indicator */}
        {isLoadingAmounts && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Calculating final amounts...</Text>
          </View>
        )}

        {/* Receipt Summary - Fixed Size Container (scrollable when content is tall) */}
        {!isLoadingAmounts && (
          <View ref={receiptRef} style={styles.receiptContainer} collapsable={false}>
          <ScrollView ref={scrollRef} style={styles.receiptScroll} contentContainerStyle={styles.receiptScrollContent} showsVerticalScrollIndicator={true}>
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
          </ScrollView>
        </View>
        )}
        
        {/* Action Buttons - Fixed at bottom */}
        {!isLoadingAmounts && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.calculateChangeButton} 
            onPress={openCalculateChangeModal}
          >
            <Text style={styles.calculateChangeButtonText}>Calculate Change</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
        )}
      </View>

      {/* Hidden full receipt for sharing - rendered off-screen */}
      <View 
        ref={fullReceiptRef} 
        style={styles.hiddenFullReceipt}
        collapsable={false}
      >
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
            const maxChars = 48;
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

      {/* Calculate Change Modal */}
      <Modal
        visible={showCalculateChangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCalculateChangeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calculateChangeModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calculate Change</Text>
              <TouchableOpacity onPress={closeCalculateChangeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              {/* Instructions */}
              <View style={styles.modalInstructions}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.modalInstructionsText}>
                  Enter the amount each friend paid to calculate their change
                </Text>
              </View>


              {/* Friends Payment List */}
              <ScrollView 
                style={styles.friendPaymentsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {friendPayments.length === 0 ? (
                  <View style={styles.noFriendsContainer}>
                    <Text style={styles.noFriendsText}>No friends data available</Text>
                    <Text style={styles.debugText}>
                      This means friendPayments array is empty. Check console logs.
                    </Text>
                  </View>
                ) : (
                  friendPayments.map((payment) => (
                  <View key={payment.friend.id} style={styles.friendPaymentCard}>
                    {/* Friend Header */}
                    <View style={styles.friendPaymentHeader}>
                      <Text style={styles.friendPaymentName}>{payment.friend.name}</Text>
                      <Text style={styles.friendPaymentAmount}>
                        Owes: ${payment.friend.amountToPay.toFixed(2)}
                      </Text>
                    </View>

                    {/* Payment Input */}
                    <View style={styles.paymentInputSection}>
                      <Text style={styles.paymentInputLabel}>Amount Paid:</Text>
                      <View style={styles.paymentInputRow}>
                        <Text style={styles.dollarSign}>$</Text>
                        <TextInput
                          style={styles.paymentInputField}
                          placeholder="0.00"
                          placeholderTextColor="#999"
                          value={payment.amountPaid}
                          onChangeText={(value) => updateAmountPaid(payment.friend.id, value)}
                          keyboardType="decimal-pad"
                          editable={!payment.isCalculating}
                        />
                        <TouchableOpacity
                          style={[
                            styles.calculatePaymentButton,
                            (!payment.amountPaid.trim() || payment.isCalculating) && styles.calculatePaymentButtonDisabled
                          ]}
                          onPress={() => calculateChange(payment.friend.id)}
                          disabled={!payment.amountPaid.trim() || payment.isCalculating}
                        >
                          {payment.isCalculating ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text style={styles.calculatePaymentButtonText}>Calculate</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Change Result */}
                    {payment.change !== null && (
                      <View style={styles.changeResultSection}>
                        <View style={styles.changeResultRow}>
                          <Text style={styles.changeResultLabel}>
                            {payment.change >= 0 ? 'Change:' : 'Still Owes:'}
                          </Text>
                          <Text style={[
                            styles.changeResultAmount,
                            payment.change >= 0 ? styles.changeResultPositive : styles.changeResultNegative
                          ]}>
                            ${Math.abs(payment.change).toFixed(2)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.clearPaymentButton}
                          onPress={() => clearCalculation(payment.friend.id)}
                        >
                          <Ionicons name="refresh-outline" size={16} color="#666" />
                          <Text style={styles.clearPaymentButtonText}>Clear</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  ))
                )}
              </ScrollView>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={closeCalculateChangeModal}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  contentArea: {
    flex: 1,
    flexDirection: 'column',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  receiptContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    // Allow flexible height but ensure buttons stay visible
    flex: 1,
    // Add margins so it looks like a floating ticket
    width: screenDimensions.width - 32,
    marginHorizontal: 16,
    marginTop: 12,
    alignSelf: 'center',
    // Ensure proper rendering for capture with solid background
    overflow: 'hidden',
    // Add border for better visual definition
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    // Remove shadow as it can cause transparency issues during capture
  },
  receiptScroll: {
    // let the scroll view size itself to the container; no flex so it doesn't collapse
    backgroundColor: 'white', // Ensure solid white background
  },
  receiptScrollContent: {
    paddingBottom: 8,
    backgroundColor: 'white', // Ensure solid white background for content
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
  hiddenFullReceipt: {
    position: 'absolute',
    left: -10000, // Move off-screen so it's not visible to user
    top: 0,
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: screenDimensions.width - 32,
    // No height constraint - let it expand to full content
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  calculateChangeButton: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculateChangeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  
  // Calculate Change Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculateChangeModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: screenDimensions.width - 32,
    height: screenDimensions.height - 100,
    overflow: 'hidden',
    flex: 1,
    maxHeight: screenDimensions.height - 100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalScrollContent: {
    paddingBottom: 20,
    gap: 16,
  },
  debugContainer: {
    backgroundColor: '#FFF9E6',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  modalInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  modalInstructionsText: {
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
    fontWeight: '500',
  },
  friendPaymentsList: {
    flex: 1,
  },
  friendPaymentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  friendPaymentHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  friendPaymentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendPaymentAmount: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  paymentInputSection: {
    marginBottom: 12,
  },
  paymentInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  paymentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    minWidth: 20,
  },
  paymentInputField: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    textAlign: 'center',
  },
  calculatePaymentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatePaymentButtonDisabled: {
    backgroundColor: '#E5E5E5',
    opacity: 0.6,
  },
  calculatePaymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  changeResultSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  changeResultRow: {
    flex: 1,
  },
  changeResultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  changeResultAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeResultPositive: {
    color: '#00C851', // Bright green for positive change
  },
  changeResultNegative: {
    color: '#FF3B30', // Red for insufficient payment/still owes
  },
  clearPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    gap: 4,
  },
  clearPaymentButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  modalCloseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  noFriendsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noFriendsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default BillSplitResultScreen; 