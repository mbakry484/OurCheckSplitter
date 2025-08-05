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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, padding, height, width, screenDimensions } from '../utils/responsive';

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
  assignedFriends: string[]; // Array of friend IDs assigned to this item
  splitEqually: boolean; // Whether to split equally among assigned friends
  subitems: SubItem[]; // Array of subitems when quantity > 1
}

interface SubItem {
  id: string;
  name: string;
  price: string;
  assignedFriends: string[]; // Array of friend IDs assigned to this subitem
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
    { id: '1', name: '', price: '', quantity: '1', assignedFriends: [], splitEqually: true, subitems: [] }
  ]);
  const [tip, setTip] = useState(basicData?.tips || '');
  const [tax, setTax] = useState(basicData?.tax || '');
  
  // Store final total from basic data for validation
  const [expectedTotal] = useState(basicData?.finalTotal ? parseFloat(basicData.finalTotal) : 0);
  
  // Friends selection with search
  const [friends] = useState<Friend[]>([
    { id: '1', name: 'John', avatar: '👨‍💻', selected: false },
    { id: '2', name: 'Sarah', avatar: '👩‍🎨', selected: false },
    { id: '3', name: 'Mike', avatar: '👨‍💼', selected: false },
    { id: '4', name: 'Emma', avatar: '👩‍🦰', selected: false },
    { id: '5', name: 'Alex', avatar: '👨‍🎓', selected: false },
  ]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

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
      quantity: '1',
      assignedFriends: [],
      splitEqually: true,
      subitems: []
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: string | string[]) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const assignFriendToItem = (itemId: string, friendId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const isAssigned = item.assignedFriends.includes(friendId);
        const updatedFriends = isAssigned
          ? item.assignedFriends.filter(id => id !== friendId)
          : [...item.assignedFriends, friendId];
        return { ...item, assignedFriends: updatedFriends };
      }
      return item;
    }));
  };

  const selectAllFriendsForItem = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const selectedFriendIds = selectedFriends.map(friend => friend.id);
        return { ...item, assignedFriends: selectedFriendIds };
      }
      return item;
    }));
  };

  const deselectAllFriendsForItem = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, assignedFriends: [] };
      }
      return item;
    }));
  };

  const toggleAllFriendsForItem = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const selectedFriendIds = selectedFriends.map(friend => friend.id);
        const isAllSelected = selectedFriendIds.length > 0 && 
          selectedFriendIds.every(id => item.assignedFriends.includes(id));
        
        if (isAllSelected) {
          // If all are selected, deselect all
          return { ...item, assignedFriends: [] };
        } else {
          // If not all are selected, select all
          return { ...item, assignedFriends: selectedFriendIds };
        }
      }
      return item;
    }));
  };

  const generateSubitems = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const quantity = parseInt(item.quantity) || 1;
        const itemPrice = parseFloat(item.price) || 0;
        const subitemPrice = itemPrice / quantity;
        
        const subitems: SubItem[] = Array.from({ length: quantity }, (_, index) => ({
          id: `${itemId}-sub-${index + 1}`,
          name: item.name,
          price: subitemPrice.toFixed(2),
          assignedFriends: []
        }));
        
        return { ...item, subitems };
      }
      return item;
    }));
  };

  const assignFriendToSubitem = (itemId: string, subitemId: string, friendId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedSubitems = item.subitems.map(subitem => {
          if (subitem.id === subitemId) {
            const isAssigned = subitem.assignedFriends.includes(friendId);
            const updatedFriends = isAssigned
              ? subitem.assignedFriends.filter(id => id !== friendId)
              : [...subitem.assignedFriends, friendId];
            return { ...subitem, assignedFriends: updatedFriends };
          }
          return subitem;
        });
        return { ...item, subitems: updatedSubitems };
      }
      return item;
    }));
  };

  const toggleAllFriendsForSubitem = (itemId: string, subitemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedSubitems = item.subitems.map(subitem => {
          if (subitem.id === subitemId) {
            const selectedFriendIds = selectedFriends.map(friend => friend.id);
            const isAllSelected = selectedFriendIds.length > 0 && 
              selectedFriendIds.every(id => subitem.assignedFriends.includes(id));
            
            if (isAllSelected) {
              return { ...subitem, assignedFriends: [] };
            } else {
              return { ...subitem, assignedFriends: selectedFriendIds };
            }
          }
          return subitem;
        });
        return { ...item, subitems: updatedSubitems };
      }
      return item;
    }));
  };

  const toggleSplitEqually = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, splitEqually: !item.splitEqually };
      }
      return item;
    }));
  };

  const getFriendsForSubitem = (item: ReceiptItem) => {
    // If item has assigned friends, use those. Otherwise, use all selected friends from receipt
    return item.assignedFriends.length > 0 
      ? friends.filter(friend => item.assignedFriends.includes(friend.id))
      : selectedFriends;
  };

  const getAssignedFriendsForItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return [];
    return friends.filter(friend => item.assignedFriends.includes(friend.id));
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

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNewFriend = () => {
    if (newFriendName.trim()) {
      const newFriend: Friend = {
        id: Date.now().toString(),
        name: newFriendName.trim(),
        avatar: '👤',
        selected: true,
      };
      // Add to friends list and select by default
      friends.push(newFriend);
      setSelectedFriends([...selectedFriends, newFriend]);
      setNewFriendName('');
      setShowAddFriendModal(false);
    }
  };

  const handleSearchFriend = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectAll = () => {
    if (selectedFriends.length === filteredFriends.length) {
      // If all are selected, deselect all
      setSelectedFriends([]);
    } else {
      // If not all are selected, select all
      setSelectedFriends([...filteredFriends]);
    }
  };

  const isAllSelected = filteredFriends.length > 0 && selectedFriends.length === filteredFriends.length;

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + price; // Price is already the total for all quantity
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

  const renderItem = (item: ReceiptItem, index: number) => {
    const assignedFriends = getAssignedFriendsForItem(item.id);
    const isExpanded = expandedItemId === item.id;
    const quantity = parseInt(item.quantity) || 1;
    const hasSubitems = item.subitems.length > 0;
    
    return (
      <View key={item.id} style={styles.itemCard}>
        <View style={styles.itemContainer}>
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
          placeholder="Total $"
          placeholderTextColor="#999"
          value={item.price}
          onChangeText={(value) => updateItem(item.id, 'price', value)}
          keyboardType="decimal-pad"
        />
        {items.length > 1 && (
          <TouchableOpacity 
            onPress={() => handleRemoveItem(item.id)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
        
        {/* Split Equally Toggle for items with quantity > 1 */}
        {quantity > 1 && (
          <View style={styles.splitEquallyContainer}>
            <View style={styles.splitEquallyHeader}>
              <Text style={styles.splitEquallyLabel}>Split Equally:</Text>
              <TouchableOpacity 
                style={styles.splitEquallyToggle}
                onPress={() => toggleSplitEqually(item.id)}
              >
                <View style={[
                  styles.toggleSwitch,
                  item.splitEqually && styles.toggleSwitchActive
                ]}>
                  <View style={[
                    styles.toggleKnob,
                    item.splitEqually && styles.toggleKnobActive
                  ]} />
    </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.splitEquallyDescription}>
              {item.splitEqually 
                ? "Item will be split equally among assigned friends"
                : "Assign different friends to each subitem"
              }
            </Text>
          </View>
        )}
        
        {/* Assign Friends Section - Show for all items */}
        {selectedFriends.length > 0 && (
          <View style={styles.friendSelectionContainer}>
            <View style={styles.friendSelectionHeader}>
              <Text style={styles.friendSelectionLabel}>Assign Friends:</Text>
              <TouchableOpacity 
                style={styles.friendSelectionCheckboxContainer}
                onPress={() => toggleAllFriendsForItem(item.id)}
              >
                <View style={[
                  styles.friendSelectionCheckbox,
                  (() => {
                    const selectedFriendIds = selectedFriends.map(friend => friend.id);
                    const isAllSelected = selectedFriendIds.length > 0 && 
                      selectedFriendIds.every(id => item.assignedFriends.includes(id));
                    return isAllSelected && styles.friendSelectionCheckboxSelected;
                  })()
                ]}>
                  {(() => {
                    const selectedFriendIds = selectedFriends.map(friend => friend.id);
                    const isAllSelected = selectedFriendIds.length > 0 && 
                      selectedFriendIds.every(id => item.assignedFriends.includes(id));
                    return isAllSelected && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    );
                  })()}
                </View>
                <Text style={styles.friendSelectionCheckboxText}>
                  {(() => {
                    const selectedFriendIds = selectedFriends.map(friend => friend.id);
                    const isAllSelected = selectedFriendIds.length > 0 && 
                      selectedFriendIds.every(id => item.assignedFriends.includes(id));
                    return isAllSelected ? 'Deselect All' : 'Select All';
                  })()}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.friendSelectionGrid}>
              {selectedFriends.map(friend => {
                const isAssigned = item.assignedFriends.includes(friend.id);
                return (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendSelectionChip,
                      isAssigned && styles.friendSelectionChipSelected
                    ]}
                    onPress={() => assignFriendToItem(item.id, friend.id)}
                  >
                    <Text style={styles.friendSelectionAvatar}>{friend.avatar}</Text>
                    <Text style={[
                      styles.friendSelectionName,
                      isAssigned && styles.friendSelectionNameSelected
                    ]}>
                      {friend.name}
                    </Text>
                    {isAssigned && (
                      <Ionicons name="checkmark-circle" size={14} color="#4ECDC4" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        
        {/* Dropdown Arrow - Only when quantity > 1, toggle OFF, and friends assigned */}
        {quantity > 1 && !item.splitEqually && item.assignedFriends.length > 0 && (
          <View style={styles.dropdownArrowContainer}>
            <TouchableOpacity 
              onPress={() => {
                if (!hasSubitems) {
                  generateSubitems(item.id);
                }
                toggleItemExpansion(item.id);
              }}
              style={styles.dropdownArrowButton}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#007AFF" 
              />
              <Text style={styles.dropdownArrowText}>
                {isExpanded ? "Hide Subitems" : "Show Subitems"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Subitems Section - Only when expanded, toggle OFF, and friends assigned */}
        {isExpanded && hasSubitems && !item.splitEqually && item.assignedFriends.length > 0 && (
          <View style={styles.subitemsContainer}>
            <Text style={styles.subitemsTitle}>Subitems:</Text>
            {item.subitems.map((subitem, subIndex) => (
              <View key={subitem.id} style={styles.subitemContainer}>
                <View style={styles.subitemHeader}>
                  <Text style={styles.subitemLabel}>
                    {subitem.name} #{subIndex + 1} - ${subitem.price}
                  </Text>
                  <TouchableOpacity 
                    style={styles.friendSelectionCheckboxContainer}
                    onPress={() => toggleAllFriendsForSubitem(item.id, subitem.id)}
                  >
                    <View style={[
                      styles.friendSelectionCheckbox,
                      (() => {
                        const selectedFriendIds = selectedFriends.map(friend => friend.id);
                        const isAllSelected = selectedFriendIds.length > 0 && 
                          selectedFriendIds.every(id => subitem.assignedFriends.includes(id));
                        return isAllSelected && styles.friendSelectionCheckboxSelected;
                      })()
                    ]}>
                      {(() => {
                        const selectedFriendIds = selectedFriends.map(friend => friend.id);
                        const isAllSelected = selectedFriendIds.length > 0 && 
                          selectedFriendIds.every(id => subitem.assignedFriends.includes(id));
                        return isAllSelected && (
                          <Ionicons name="checkmark" size={12} color="white" />
                        );
                      })()}
                    </View>
                    <Text style={styles.friendSelectionCheckboxText}>
                      {(() => {
                        const selectedFriendIds = selectedFriends.map(friend => friend.id);
                        const isAllSelected = selectedFriendIds.length > 0 && 
                          selectedFriendIds.every(id => subitem.assignedFriends.includes(id));
                        return isAllSelected ? 'Deselect All' : 'Select All';
                      })()}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.friendSelectionGrid}>
                  {getFriendsForSubitem(item).map(friend => {
                    const isAssigned = subitem.assignedFriends.includes(friend.id);
                    return (
                      <TouchableOpacity
                        key={friend.id}
                        style={[
                          styles.friendSelectionChip,
                          isAssigned && styles.friendSelectionChipSelected
                        ]}
                        onPress={() => assignFriendToSubitem(item.id, subitem.id, friend.id)}
                      >
                        <Text style={styles.friendSelectionAvatar}>{friend.avatar}</Text>
                        <Text style={[
                          styles.friendSelectionName,
                          isAssigned && styles.friendSelectionNameSelected
                        ]}>
                          {friend.name}
                        </Text>
                        {isAssigned && (
                          <Ionicons name="checkmark-circle" size={14} color="#4ECDC4" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
        </View>
      </View>
    );
  };

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

           {/* Friends Section */}
           <View style={styles.section}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Friends</Text>
               <TouchableOpacity 
                 style={styles.addFriendButton} 
                 onPress={() => setShowAddFriendModal(true)}
               >
                 <Ionicons name="person-add" size={20} color="#007AFF" />
                 <Text style={styles.addFriendText}>New Friend</Text>
               </TouchableOpacity>
             </View>
             
             <View style={styles.sectionContent}>
               {/* Search Bar */}
               <View style={styles.searchContainer}>
                 <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                 <TextInput
                   style={styles.searchInput}
                   placeholder="Search friends..."
                   placeholderTextColor="#999"
                   value={searchQuery}
                   onChangeText={handleSearchFriend}
                 />
                 {searchQuery.length > 0 && (
                   <TouchableOpacity onPress={() => setSearchQuery('')}>
                     <Ionicons name="close-circle" size={20} color="#999" />
                   </TouchableOpacity>
                 )}
               </View>

               {/* Select All Checkbox */}
               {filteredFriends.length > 0 && (
                 <View style={styles.selectAllContainer}>
                   <TouchableOpacity 
                     style={styles.selectAllButton} 
                     onPress={handleSelectAll}
                   >
                     <View style={[styles.checkbox, isAllSelected && styles.checkboxSelected]}>
                       {isAllSelected && (
                         <Ionicons name="checkmark" size={16} color="white" />
                       )}
                     </View>
                     <Text style={styles.selectAllText}>
                       {isAllSelected ? 'Deselect All' : 'Select All'}
                     </Text>
                   </TouchableOpacity>
                 </View>
               )}

               {/* Friends List */}
               <View style={styles.friendsContainer}>
                 {filteredFriends.map(renderFriend)}
               </View>
               
               {selectedFriends.length > 0 && (
                 <Text style={styles.selectionSummary}>
                   Selected: {selectedFriends.map(f => f.name).join(', ')}
                 </Text>
               )}
             </View>
           </View>

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

        {/* Add Friend Modal */}
        <Modal
          visible={showAddFriendModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddFriendModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Friend</Text>
                <TouchableOpacity onPress={() => setShowAddFriendModal(false)}>
                  <Ionicons name="close" size={24} color="#999" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Friend's Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter friend's name"
                  placeholderTextColor="#999"
                  value={newFriendName}
                  onChangeText={setNewFriendName}
                  autoFocus={true}
                />
              </View>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowAddFriendModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalAddButton, !newFriendName.trim() && styles.modalAddButtonDisabled]}
                  onPress={handleAddNewFriend}
                  disabled={!newFriendName.trim()}
                >
                  <Text style={styles.modalAddText}>Add Friend</Text>
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
        paddingTop: padding.sm,
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
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: -8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContainer: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },


  removeButton: {
    padding: 4,
  },
  expandButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    gap: 16,
  },
  itemNameInput: {
    flex: 4,
  },
  quantityInput: {
    flex: 0.8,
  },
  priceInput: {
    flex: 1.5,
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
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addFriendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  selectAllContainer: {
    marginBottom: 12,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectAllText: {
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 24,
      width: '85%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
    },
    modalBody: {
      marginBottom: 20,
    },
    modalLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
      marginBottom: 8,
    },
    modalInput: {
      backgroundColor: '#F8F9FA',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: '#333',
      borderWidth: 1,
      borderColor: '#E5E5E5',
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E5E5',
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#666',
    },
    modalAddButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: '#007AFF',
      alignItems: 'center',
    },
    modalAddButtonDisabled: {
      backgroundColor: '#E5E5E5',
    },
    modalAddText: {
      fontSize: 16,
      fontWeight: '500',
      color: 'white',
    },
  // Friend Assignment Styles
  friendAssignmentContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  friendAssignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendAssignmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  assignedCount: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  friendAssignmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  friendAssignmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 4,
  },
  friendAssignmentChipSelected: {
    backgroundColor: '#E8F7F5',
    borderColor: '#4ECDC4',
  },
  friendAssignmentAvatar: {
    fontSize: 14,
  },
  friendAssignmentName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  friendAssignmentNameSelected: {
    color: '#4ECDC4',
  },
  assignedFriendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  assignedFriendsPreview: {
    marginTop: 8,
  },
  assignedFriendsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  assignedFriendsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  assignedFriendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F7F5',
    borderRadius: 12,
    gap: 4,
  },
  assignedFriendAvatar: {
    fontSize: 12,
  },
  assignedFriendName: {
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  // Friend Selection Styles
  friendSelectionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  friendSelectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  friendSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  friendSelectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 4,
  },
  friendSelectionChipSelected: {
    backgroundColor: '#E8F7F5',
    borderColor: '#4ECDC4',
  },
  friendSelectionAvatar: {
    fontSize: 12,
  },
  friendSelectionName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
  },
  friendSelectionNameSelected: {
    color: '#4ECDC4',
  },
  friendSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  friendSelectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  friendSelectionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  friendSelectionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  friendSelectionCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendSelectionCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendSelectionCheckboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  friendSelectionCheckboxText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  // Subitems Styles
  subitemDropdownButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  subitemsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  subitemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subitemContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subitemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subitemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  // Split Equally Toggle Styles
  splitEquallyContainer: {
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  splitEquallyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  splitEquallyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  splitEquallyToggle: {
    padding: 4,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#007AFF',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  splitEquallyDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // Item Friends List Styles
  itemFriendsListContainer: {
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  itemFriendsListLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  itemFriendsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemFriendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F7F5',
    borderRadius: 12,
    gap: 4,
  },
  itemFriendAvatar: {
    fontSize: 12,
  },
  itemFriendName: {
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  noFriendsAssigned: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  // Dropdown Arrow Styles
  dropdownArrowContainer: {
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dropdownArrowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  dropdownArrowText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  });

export default AddReceiptScreen;