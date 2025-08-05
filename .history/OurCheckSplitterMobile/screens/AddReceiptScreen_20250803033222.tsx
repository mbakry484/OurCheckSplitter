import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface AddReceiptScreenProps {
  navigation?: any;
  route?: any;
  onEditBasicData?: (currentData: BasicReceiptData) => void;
}

interface BasicReceiptData {
  receiptName: string;
  date: string;
  finalTotal: string;
  tax: string;
  tips: string;
  tipsIncluded: boolean;
}

interface ReceiptItem {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  selected: boolean;
}

const AddReceiptScreen = ({ navigation, route, onEditBasicData }: AddReceiptScreenProps) => {
  const insets = useSafeAreaInsets();
  
  // Get basic data from route params (from overlay)
  const basicData = route?.params?.basicData;
  
  // Form state - pre-populate with basic data if available
  const [receiptTitle, setReceiptTitle] = useState(basicData?.receiptName || '');
  const [receiptDate, setReceiptDate] = useState(basicData?.date || new Date().toLocaleDateString());
  const [items, setItems] = useState<ReceiptItem[]>([
    { id: '1', name: '', price: '', quantity: '1' }
  ]);
  const [tip, setTip] = useState(basicData?.tips || '');
  const [tax, setTax] = useState(basicData?.tax || '');
  const [splitEqually, setSplitEqually] = useState(true);
  
  // Store final total from basic data for validation
  const [expectedTotal] = useState(basicData?.finalTotal ? parseFloat(basicData.finalTotal) : 0);
  
  // Friends selection
  const [friends] = useState<Friend[]>([
    { id: '1', name: 'John', avatar: '👨‍💻', selected: true },
    { id: '2', name: 'Sarah', avatar: '👩‍🎨', selected: true },
    { id: '3', name: 'Mike', avatar: '👨‍💼', selected: false },
    { id: '4', name: 'Emma', avatar: '👩‍🦰', selected: false },
    { id: '5', name: 'Alex', avatar: '👨‍🎓', selected: false },
  ]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>(
    friends.filter(f => f.selected)
  );

  const handleGoBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleEditBasicData = () => {
    if (onEditBasicData && basicData) {
      const currentData: BasicReceiptData = {
        receiptName: receiptTitle,
        date: receiptDate,
        finalTotal: expectedTotal.toString(),
        tax: tax,
        tips: tip,
        tipsIncluded: false, // You can track this if needed
      };
      onEditBasicData(currentData);
    }
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: (items.length + 1).toString(),
      name: '',
      price: '',
      quantity: '1'
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const toggleFriendSelection = (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;

    const isSelected = selectedFriends.some(f => f.id === friendId);
    if (isSelected) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tipAmount = parseFloat(tip) || 0;
    const taxAmount = parseFloat(tax) || 0;
    return subtotal + tipAmount + taxAmount;
  };

  const handleSaveReceipt = () => {
    if (!receiptTitle.trim()) {
      Alert.alert('Missing Information', 'Please enter a receipt title.');
      return;
    }
    
    if (items.every(item => !item.name.trim() || !item.price.trim())) {
      Alert.alert('Missing Information', 'Please add at least one item with name and price.');
      return;
    }

    if (selectedFriends.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one friend to split with.');
      return;
    }

    // Validate total matches expected total if provided
    if (expectedTotal > 0) {
      const calculatedTotal = calculateTotal();
      const tolerance = 0.01; // Allow small rounding differences
      
      if (Math.abs(calculatedTotal - expectedTotal) > tolerance) {
        Alert.alert(
          'Total Mismatch', 
          `The calculated total ($${calculatedTotal.toFixed(2)}) doesn't match the expected total ($${expectedTotal.toFixed(2)}). Please review your items, tax, and tip.`
        );
        return;
      }
    }

    // Here you would typically save the receipt to your backend/storage
    Alert.alert(
      'Receipt Saved!', 
      `Receipt "${receiptTitle}" has been saved successfully.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (navigation) {
              // Navigate back to the screen that opened the overlay (usually Home or Receipts)
              navigation.navigate('Receipts');
            }
          }
        }
      ]
    );
  };

  const renderItem = (item: ReceiptItem, index: number) => (
    <View key={item.id} style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemLabel}>Item {index + 1}</Text>
        {items.length > 1 && (
          <TouchableOpacity 
            onPress={() => handleRemoveItem(item.id)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.itemRow}>
        <TextInput
          style={[styles.input, styles.itemNameInput]}
          placeholder="Item name"
          placeholderTextColor="#999"
          value={item.name}
          onChangeText={(value) => updateItem(item.id, 'name', value)}
        />
        <TextInput
          style={[styles.input, styles.quantityInput]}
          placeholder="Qty"
          placeholderTextColor="#999"
          value={item.quantity}
          onChangeText={(value) => updateItem(item.id, 'quantity', value)}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.priceInput]}
          placeholder="$0.00"
          placeholderTextColor="#999"
          value={item.price}
          onChangeText={(value) => updateItem(item.id, 'price', value)}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );

  const renderFriend = (friend: Friend) => {
    const isSelected = selectedFriends.some(f => f.id === friend.id);
    return (
      <TouchableOpacity
        key={friend.id}
        style={[styles.friendChip, isSelected && styles.selectedFriendChip]}
        onPress={() => toggleFriendSelection(friend.id)}
      >
        <Text style={styles.friendAvatar}>{friend.avatar}</Text>
        <Text style={[styles.friendName, isSelected && styles.selectedFriendName]}>
          {friend.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
             {/* Header */}
       <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
         <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
           <Ionicons name="arrow-back" size={24} color="#007AFF" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>
           {basicData ? 'Add Items & Split' : 'Add Receipt'}
         </Text>
         <View style={styles.headerSpacer} />
       </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Receipt Info (Non-editable with Edit Button) */}
          {(basicData || receiptTitle) && (
            <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Receipt Information</Text>
              {onEditBasicData && (
                <TouchableOpacity style={styles.editBasicButton} onPress={handleEditBasicData}>
                  <Ionicons name="create-outline" size={20} color="#007AFF" />
                  <Text style={styles.editBasicText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.basicInfoGrid}>
                <View style={styles.basicInfoItem}>
                  <Text style={styles.basicInfoLabel}>Receipt Name</Text>
                  <Text style={styles.basicInfoValue}>{receiptTitle || 'Not set'}</Text>
                </View>
                <View style={styles.basicInfoItem}>
                  <Text style={styles.basicInfoLabel}>Date</Text>
                  <Text style={styles.basicInfoValue}>{receiptDate || 'Not set'}</Text>
                </View>
                <View style={styles.basicInfoItem}>
                  <Text style={styles.basicInfoLabel}>Final Total</Text>
                  <Text style={[styles.basicInfoValue, styles.finalTotalValue]}>
                    ${expectedTotal > 0 ? expectedTotal.toFixed(2) : '0.00'}
                  </Text>
                </View>
                {parseFloat(tax) > 0 && (
                  <View style={styles.basicInfoItem}>
                    <Text style={styles.basicInfoLabel}>Tax</Text>
                    <Text style={styles.basicInfoValue}>${parseFloat(tax).toFixed(2)}</Text>
                  </View>
                )}
                {parseFloat(tip) > 0 && (
                  <View style={styles.basicInfoItem}>
                    <Text style={styles.basicInfoLabel}>Tip</Text>
                    <Text style={styles.basicInfoValue}>${parseFloat(tip).toFixed(2)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          )}

          {/* Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addItemText}>Add Item</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.sectionContent}>
              {items.map((item, index) => renderItem(item, index))}
            </View>
          </View>



          {/* Split With */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Split With</Text>
            <View style={styles.sectionContent}>
              <View style={styles.splitOption}>
                <Text style={styles.splitOptionText}>Split Equally</Text>
                <Switch
                  value={splitEqually}
                  onValueChange={setSplitEqually}
                  trackColor={{ false: '#E5E5E5', true: '#4ECDC4' }}
                  thumbColor={splitEqually ? 'white' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.friendsContainer}>
                {friends.map(renderFriend)}
              </View>
              
              {selectedFriends.length > 0 && (
                <Text style={styles.selectionSummary}>
                  Selected: {selectedFriends.map(f => f.name).join(', ')}
                </Text>
              )}
            </View>
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.sectionContent}>
              {expectedTotal > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Expected Total:</Text>
                  <Text style={[styles.summaryValue, styles.expectedTotal]}>${expectedTotal.toFixed(2)}</Text>
                </View>
              )}
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>${calculateSubtotal().toFixed(2)}</Text>
              </View>
              
              {parseFloat(tax) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax:</Text>
                  <Text style={styles.summaryValue}>${parseFloat(tax).toFixed(2)}</Text>
                </View>
              )}
              
              {parseFloat(tip) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tip:</Text>
                  <Text style={styles.summaryValue}>${parseFloat(tip).toFixed(2)}</Text>
                </View>
              )}
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Calculated Total:</Text>
                <Text style={[
                  styles.totalValue,
                  expectedTotal > 0 && Math.abs(calculateTotal() - expectedTotal) > 0.01 && styles.mismatchTotal
                ]}>${calculateTotal().toFixed(2)}</Text>
              </View>
              
              {expectedTotal > 0 && Math.abs(calculateTotal() - expectedTotal) > 0.01 && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={16} color="#FF9500" />
                  <Text style={styles.warningText}>
                    Total doesn't match expected amount
                  </Text>
                </View>
              )}
              
              {selectedFriends.length > 0 && splitEqually && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Per person:</Text>
                  <Text style={styles.summaryValue}>
                    ${(calculateTotal() / (selectedFriends.length + 1)).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </View>

                     {/* Bottom spacing */}
           <View style={styles.bottomSpacing} />
           
           {/* Save Button at Bottom */}
           <View style={styles.saveButtonContainer}>
             <TouchableOpacity 
               style={[
                 styles.saveButton,
                 expectedTotal > 0 && Math.abs(calculateTotal() - expectedTotal) > 0.01 && styles.saveButtonWarning
               ]} 
               onPress={handleSaveReceipt}
             >
               <Text style={styles.saveButtonText}>
                 {expectedTotal > 0 && Math.abs(calculateTotal() - expectedTotal) > 0.01 
                   ? 'Review & Save' 
                   : 'Save Receipt'
                 }
               </Text>
               {expectedTotal > 0 && Math.abs(calculateTotal() - expectedTotal) > 0.01 && (
                 <Ionicons name="warning" size={20} color="white" style={styles.saveButtonIcon} />
               )}
             </TouchableOpacity>
           </View>
         </ScrollView>
       </KeyboardAvoidingView>
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
   headerSpacer: {
     width: 40,
   },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  itemContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  itemNameInput: {
    flex: 2,
  },
  quantityInput: {
    flex: 0.5,
  },
  priceInput: {
    flex: 1,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  splitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  splitOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  friendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 6,
  },
  selectedFriendChip: {
    backgroundColor: '#E8F7F5',
    borderColor: '#4ECDC4',
  },
  friendAvatar: {
    fontSize: 16,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedFriendName: {
    color: '#4ECDC4',
  },
  selectionSummary: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  expectedTotal: {
    color: '#007AFF',
    fontWeight: '600',
  },
  mismatchTotal: {
    color: '#FF3B30',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
    flex: 1,
  },
  bottomSpacing: {
    height: 32,
  },
  editBasicButton: {
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
  editBasicText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  basicInfoGrid: {
    gap: 16,
  },
  basicInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  basicInfoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  basicInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
     finalTotalValue: {
     color: '#007AFF',
     fontSize: 18,
   },
   saveButtonContainer: {
     paddingHorizontal: 20,
     paddingVertical: 16,
     backgroundColor: 'white',
     borderTopWidth: 1,
     borderTopColor: '#E5E5E5',
   },
   saveButton: {
     backgroundColor: '#007AFF',
     borderRadius: 12,
     paddingVertical: 16,
     paddingHorizontal: 24,
     alignItems: 'center',
     justifyContent: 'center',
     flexDirection: 'row',
     shadowColor: '#007AFF',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.2,
     shadowRadius: 4,
     elevation: 3,
   },
   saveButtonWarning: {
     backgroundColor: '#FF9500',
     shadowColor: '#FF9500',
   },
   saveButtonText: {
     fontSize: 18,
     fontWeight: '600',
     color: 'white',
   },
   saveButtonIcon: {
     marginLeft: 8,
   },
 });

export default AddReceiptScreen;