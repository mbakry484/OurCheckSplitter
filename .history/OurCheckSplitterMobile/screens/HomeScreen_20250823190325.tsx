import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, padding, height, width, screenDimensions } from '../utils/responsive';
import { api } from '../services/api';
import { 
  FriendDto, 
  ReceiptResponseDto, 
  convertFriendToHomeFormat, 
  convertReceiptToHomeFormat,
  HomeScreenFriend,
  HomeScreenReceipt,
  ReceiptItem,
  FriendAmount,
} from '../types/api';

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

interface HomeScreenProps {
  navigation?: any;
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const insets = useSafeAreaInsets();
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabAnimation = useState(new Animated.Value(0))[0];
  
  // API state management
  const [friends, setFriends] = useState<HomeScreenFriend[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<HomeScreenReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [receiptsPagination, setReceiptsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    totalCount: 0,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Receipt detail state
  const [selectedReceipt, setSelectedReceipt] = useState<HomeScreenReceipt | null>(null);
  const [receiptViewMode, setReceiptViewMode] = useState<'items' | 'friends'>('items');
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  // Function to refresh friends for a specific receipt
  const refreshReceiptFriends = async (receiptId: number) => {
    try {
      const friendsResponse = await api.receipts.getReceiptFriends(receiptId);
      console.log(`Refreshed friends for receipt ${receiptId}:`, friendsResponse);
      
      // Update the receipt in the state with new friends data
      setRecentReceipts(prevReceipts => 
        prevReceipts.map(receipt => {
          if (receipt.id === receiptId.toString()) {
            return {
              ...receipt,
              participants: friendsResponse.map((f: any) => f.name)
            };
          }
          return receipt;
        })
      );
    } catch (error) {
      console.error(`Failed to refresh friends for receipt ${receiptId}:`, error);
    }
  };

  const loadData = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // First test basic connectivity
      console.log('Testing API connectivity...');
      try {
        const testResponse = await api.test.ping();
        console.log('API connectivity test successful:', testResponse);
        
        // Debug: Check what data exists in the database
        const debugData = await api.test.debugData();
        console.log('Debug data from database:', debugData);
      } catch (testError) {
        console.error('API connectivity test failed:', testError);
        // Continue anyway, maybe it's just the test endpoint
      }

      // Load friends and receipts in parallel with pagination
      const [friendsResponse, receiptsResponse] = await Promise.all([
        api.friends.getFriends(),
        api.receipts.getReceiptsPaginated({
          page,
          pageSize: 10, // Load only 10 receipts at a time
        }),
      ]);

      // Convert API responses to HomeScreen format
      const convertedFriends = friendsResponse.map((friend: FriendDto) => 
        convertFriendToHomeFormat(friend)
      );
      
      // Handle paginated receipts response
      let convertedReceipts: HomeScreenReceipt[] = [];
      let paginationInfo = {
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
        totalCount: 0,
      };

      if (receiptsResponse && Array.isArray(receiptsResponse)) {
        // Direct array format (fallback)
        convertedReceipts = receiptsResponse.map((receipt: ReceiptResponseDto) => {
          // Use friends that are already included in the receipt response
          const receiptWithFriends = {
            ...receipt,
            friends: receipt.friends || []
          };
          
          return convertReceiptToHomeFormat(receiptWithFriends);
        });
        paginationInfo.totalCount = receiptsResponse.length;
      } else if (receiptsResponse && receiptsResponse.items && Array.isArray(receiptsResponse.items)) {
        // Paginated format - friends are already included in the response
        convertedReceipts = receiptsResponse.items.map((receipt: ReceiptResponseDto) => {
          // Use friends that are already included in the receipt response
          const receiptWithFriends = {
            ...receipt,
            friends: receipt.friends || []
          };
          
          return convertReceiptToHomeFormat(receiptWithFriends);
        });
        paginationInfo = {
          currentPage: receiptsResponse.currentPage,
          totalPages: receiptsResponse.totalPages,
          hasNextPage: receiptsResponse.hasNextPage,
          totalCount: receiptsResponse.totalCount,
        };
      }

      if (page === 1 || isRefresh) {
        setFriends(convertedFriends);
        setRecentReceipts(convertedReceipts);
      } else {
        setRecentReceipts(prev => [...prev, ...convertedReceipts]);
      }
      
      setReceiptsPagination(paginationInfo);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please check your connection and try again.');
      
      // Show error alert
      Alert.alert(
        'Connection Error',
        'Failed to load data from server. Make sure your API is running.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate total paid by user
  const totalYouPaid = recentReceipts.reduce((sum, receipt) => sum + receipt.userPaidAmount, 0);



  // Refresh data
  const refreshData = () => {
    loadData(1, true);
  };


  // Fetch detailed receipt information including items and friend amounts
  const fetchReceiptDetails = async (receiptId: string) => {
    try {
      setLoadingDetails(prev => new Set([...prev, receiptId]));
      
      // Fetch detailed receipt information
      console.log('HomeScreen - Fetching receipt details for ID:', receiptId);
      const receiptDetails = await api.receipts.getReceiptById(parseInt(receiptId));
      console.log('HomeScreen - Receipt details response:', JSON.stringify(receiptDetails, null, 2));
      
      // Fetch friend amounts for this receipt
      console.log('HomeScreen - Fetching friend amounts for receipt ID:', receiptId);
      let friendAmounts = [];
      try {
        friendAmounts = await api.receipts.getFinalAmounts(parseInt(receiptId));
        console.log('HomeScreen - Friend amounts response:', JSON.stringify(friendAmounts, null, 2));
      } catch (friendAmountsError: any) {
        console.log('HomeScreen - FinalAmounts API error caught:', friendAmountsError.message);
        if (friendAmountsError.message?.includes('status: 400')) {
          console.log('HomeScreen - Receipt has no assigned items, using empty friend amounts');
          friendAmounts = [];
        } else {
          console.log('HomeScreen - Re-throwing non-400 error:', friendAmountsError);
          throw friendAmountsError; // Re-throw if it's a different error
        }
      }
      
      console.log('HomeScreen - Continuing with friend amounts:', friendAmounts);
      
      // Process items data
      const processedItems = receiptDetails?.items?.map((item: any) => {
        console.log('HomeScreen - Processing item:', JSON.stringify(item, null, 2));
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          assignedFriends: item.assignments?.flatMap((assignment: any) => 
            assignment.assignedFriends?.map((friend: any) => friend.name) || []
          ) || [],
        };
      }) || [];
      console.log('HomeScreen - Processed items:', JSON.stringify(processedItems, null, 2));
      
      // Process friend amounts data
      const processedFriendAmounts = friendAmounts?.map((friend: any) => ({
        id: friend.id,
        name: friend.name,
        amountToPay: friend.amountToPay,
      })) || [];
      console.log('HomeScreen - Processed friend amounts:', JSON.stringify(processedFriendAmounts, null, 2));
      
      // Create the updated receipt data
      const updatedReceiptData = {
        items: processedItems,
        friendAmounts: processedFriendAmounts,
      };
      
      // Update the receipt with detailed information
      setRecentReceipts(prev => 
        prev.map(receipt => {
          if (receipt.id === receiptId) {
            const updatedReceipt = {
              ...receipt,
              ...updatedReceiptData,
            };
            console.log('HomeScreen - Updated receipt:', JSON.stringify(updatedReceipt, null, 2));
            return updatedReceipt;
          }
          return receipt;
        })
      );
      
      // Update selectedReceipt if it's the same receipt
      if (selectedReceipt && selectedReceipt.id === receiptId) {
        const updatedSelectedReceipt = {
          ...selectedReceipt,
          ...updatedReceiptData,
        };
        console.log('HomeScreen - Updating selectedReceipt with:', JSON.stringify(updatedSelectedReceipt, null, 2));
        setSelectedReceipt(updatedSelectedReceipt);
      }
      
      // Fallback: Also update selectedReceipt directly if it wasn't updated above
      setSelectedReceipt(prev => {
        if (prev && prev.id === receiptId) {
          const fallbackUpdate = {
            ...prev,
            ...updatedReceiptData,
          };
          console.log('HomeScreen - Fallback update for selectedReceipt:', JSON.stringify(fallbackUpdate, null, 2));
          return fallbackUpdate;
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to fetch receipt details:', error);
      Alert.alert('Error', 'Failed to load receipt details. Please try again.');
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiptId);
        return newSet;
      });
    }
  };

  // Handle receipt selection
  const handleReceiptPress = async (receipt: HomeScreenReceipt) => {
    setSelectedReceipt(receipt);
    setReceiptViewMode('items');
    
    // Fetch details if not already loaded
    if (!receipt.items || !receipt.friendAmounts) {
      await fetchReceiptDetails(receipt.id);
    }
  };

  // Handle back to home screen
  const handleBackToHome = () => {
    setSelectedReceipt(null);
    setReceiptViewMode('items');
  };

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

  const handleFriendPress = (friend: HomeScreenFriend) => {
    if (navigation) {
      navigation.navigate('Friends', { selectedFriend: friend });
    }
  };

  const renderFriend = (friend: HomeScreenFriend) => (
    <TouchableOpacity key={friend.id} style={styles.friendItem} onPress={() => handleFriendPress(friend)}>
      <View style={styles.friendAvatar}>
        <Text style={styles.avatarText}>{friend.avatar}</Text>
      </View>
      <Text style={styles.friendName}>{friend.name}</Text>
      <Text style={styles.friendReceipts}>{friend.receipts.length} Receipts</Text>
    </TouchableOpacity>
  );

  const renderReceipt = (receipt: HomeScreenReceipt) => (
    <TouchableOpacity 
      key={receipt.id} 
      style={styles.receiptItem}
      onPress={() => handleReceiptPress(receipt)}
    >
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
            {(() => {
              // Use participants (already loaded from API in convertReceiptToHomeFormat)
              if (receipt.participants && receipt.participants.length > 0) {
                return receipt.participants.length > 4 
                  ? `${receipt.participants.slice(0, 4).join(', ')}, +${receipt.participants.length - 4} more`
                  : receipt.participants.join(', ');
              }
              
              // Fall back to friendAmounts if detailed view has been loaded
              if (receipt.friendAmounts && receipt.friendAmounts.length > 0) {
                const friendNames = receipt.friendAmounts.map(f => f.name);
                return friendNames.length > 4 
                  ? `${friendNames.slice(0, 4).join(', ')}, +${friendNames.length - 4} more`
                  : friendNames.join(', ');
              }
              
              // Show solo if no friends data available
              return 'Solo receipt';
            })()}
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
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color="#666" 
          style={styles.expandIcon}
        />
      </View>
    </TouchableOpacity>
  );

  // Render Items Receipt View
  const renderItemsReceipt = () => {
    if (!selectedReceipt) return null;

    console.log('HomeScreen - renderItemsReceipt called with selectedReceipt:', JSON.stringify(selectedReceipt, null, 2));
    console.log('HomeScreen - selectedReceipt.items:', selectedReceipt.items);

    return (
      <View style={styles.receiptContainer}>
        <ScrollView style={styles.receiptScroll} contentContainerStyle={styles.receiptScrollContent}>
          {/* Receipt Title and Date */}
          <View style={styles.receiptHeaderArea}>
            <Text style={styles.receiptTitleBW}>{selectedReceipt.title}</Text>
            <Text style={styles.receiptDateBW}>{selectedReceipt.date}</Text>
            <View style={styles.separator} />
          </View>

          {/* Items Section */}
          <View style={styles.itemsSection}>
            {selectedReceipt.items && selectedReceipt.items.length > 0 ? (
              selectedReceipt.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemNameBW}>{item.name}</Text>
                    <Text style={styles.itemQuantityBW}>Qty: {item.quantity}</Text>
                    {item.assignedFriends.length > 0 && (
                      <Text style={styles.assignedFriendsBW}>
                        → {item.assignedFriends.join(', ')}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.itemPriceBW}>${item.price.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>No items found</Text>
            )}
          </View>

          {/* Total */}
          <View style={styles.totalRowBW}>
            <Text style={styles.totalLabelBW}>TOTAL</Text>
            <Text style={styles.totalValueBW}>
              ${selectedReceipt.totalAmount.toFixed(2)}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render Friends Summary View
  const renderFriendsSummary = () => {
    if (!selectedReceipt) return null;

    return (
      <View style={styles.receiptContainer}>
        <ScrollView style={styles.receiptScroll} contentContainerStyle={styles.receiptScrollContent}>
          {/* Receipt Title and Date */}
          <View style={styles.receiptHeaderArea}>
            <Text style={styles.receiptTitleBW}>{selectedReceipt.title}</Text>
            <Text style={styles.receiptDateBW}>{selectedReceipt.date}</Text>
            <View style={styles.separator} />
          </View>

          {/* Friend Amounts */}
          <View style={styles.friendBlocks}>
            {selectedReceipt.friendAmounts && selectedReceipt.friendAmounts.length > 0 ? (
              selectedReceipt.friendAmounts.map((friend) => {
              // Find items assigned to this friend
              const friendItems = selectedReceipt.items?.filter(item => 
                item.assignedFriends.includes(friend.name)
              ) || [];
              
              // Format items like BillSplitResultScreen - comma-separated with wrapping
              const parts = friendItems.map((it) => `${it.name} ($${it.price.toFixed(2)})`);
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
                <View key={friend.id} style={styles.friendBlock}>
                  <View style={styles.friendRow}>
                    <Text style={styles.friendNameBW}>{friend.name}</Text>
                    <Text style={styles.friendAmountBW}>${friend.amountToPay.toFixed(2)}</Text>
                  </View>
                  {lines.map((ln, idx) => (
                    <Text key={idx} style={styles.itemsInlineBW}>
                      {ln}
                    </Text>
                  ))}
                  <View style={styles.dotRule} />
                </View>
              );
            })
            ) : (
              <Text style={styles.noItemsText}>No friend assignments found - receipt has no assigned items</Text>
            )}
          </View>

          {/* Grand Total */}
          <View style={styles.totalRowBW}>
            <Text style={styles.totalLabelBW}>TOTAL</Text>
            <Text style={styles.totalValueBW}>
              ${selectedReceipt.totalAmount.toFixed(2)}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render Receipt Detail View
  const renderReceiptDetail = () => {
    if (!selectedReceipt) return null;

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Details</Text>
          <View style={styles.addButton} />
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, receiptViewMode === 'items' && styles.activeToggleButton]}
            onPress={() => setReceiptViewMode('items')}
          >
            <Text style={[styles.toggleButtonText, receiptViewMode === 'items' && styles.activeToggleButtonText]}>
              Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, receiptViewMode === 'friends' && styles.activeToggleButton]}
            onPress={() => setReceiptViewMode('friends')}
          >
            <Text style={[styles.toggleButtonText, receiptViewMode === 'friends' && styles.activeToggleButtonText]}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.receiptWrapper}>
            {receiptViewMode === 'items' ? renderItemsReceipt() : renderFriendsSummary()}
          </View>
        </View>
      </SafeAreaView>
    );
  };

  if (selectedReceipt) {
    return renderReceiptDetail();
  }

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
          <Text style={styles.headerTitle}>SplitWise</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <Text style={styles.headerTitle}>SplitWise</Text>
        {error && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => loadData(1, true)}
          >
            <Ionicons name="refresh-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        )}
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
            {friends.length > 0 ? (
              friends.slice(0, 5).map(renderFriend)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No friends yet. Add some receipts to get started!</Text>
              </View>
            )}
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
          {recentReceipts.length > 0 ? (
            <>
              {recentReceipts.slice(0, 5).map(renderReceipt)}
              {recentReceipts.length > 5 && (
                <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewAllReceipts}>
                  <Text style={styles.viewMoreText}>View More ({recentReceipts.length - 5} more)</Text>
                  <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                </TouchableOpacity>
              )}
              {receiptsPagination.hasNextPage && (
                <TouchableOpacity 
                  style={styles.loadMoreButton} 
                  onPress={loadMoreReceipts}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <>
                      <Text style={styles.loadMoreText}>Load More Receipts</Text>
                      <Ionicons name="chevron-down" size={16} color="#007AFF" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No receipts yet. Start by adding your first receipt!</Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddReceipt}>
                <Text style={styles.emptyStateButtonText}>Add Receipt</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: padding.xl,
    paddingVertical: padding.xl,
    paddingTop: padding.xxl,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    minHeight: height.header,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    paddingTop: padding.sm,
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
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  loadMoreText: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Receipt detail view styles
  backButton: {
    paddingTop: 10,
    padding: 5,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    marginTop: 4,
  },
  receiptWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  receiptContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: screenDimensions.width - 32,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  receiptScroll: {
    backgroundColor: 'white',
  },
  receiptScrollContent: {
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  receiptHeaderArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptTitleBW: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  receiptDateBW: {
    fontSize: 12,
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
  // Items section styles
  itemsSection: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameBW: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    marginBottom: 2,
  },
  itemQuantityBW: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  assignedFriendsBW: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  itemPriceBW: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  noItemsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Friends section styles
  friendBlocks: {
    marginBottom: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  friendAmountBW: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  itemsInlineBW: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginTop: 2,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  totalValueBW: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  // View toggle styles
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeToggleButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeToggleButtonText: {
    color: '#007AFF',
  },
});

export default HomeScreen;
