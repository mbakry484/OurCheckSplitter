import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, padding, height, width, screenDimensions } from '../utils/responsive';
import { receiptApi } from '../services/api';
import { ReceiptResponseDto, PaginatedResponseDto, convertReceiptToHomeFormat, HomeScreenReceipt, ReceiptItem, FriendAmount } from '../types/api';
import { api } from '../services/api';


interface ReceiptsScreenProps {
  navigation?: any;
}

const ReceiptsScreen = ({ navigation }: ReceiptsScreenProps) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [receipts, setReceipts] = useState<HomeScreenReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    totalCount: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<HomeScreenReceipt | null>(null);
  const [receiptViewMode, setReceiptViewMode] = useState<'items' | 'friends'>('items');
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

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

  const PAGE_SIZE = 10;


  // Fetch detailed receipt information including items and friend amounts
  const fetchReceiptDetails = async (receiptId: string) => {
    try {
      setLoadingDetails(prev => new Set([...prev, receiptId]));
      
      // Fetch detailed receipt information
      console.log('Fetching receipt details for ID:', receiptId);
      const receiptDetails = await api.receipts.getReceiptById(parseInt(receiptId));
      console.log('Receipt details response:', JSON.stringify(receiptDetails, null, 2));
      
      // Fetch friend amounts for this receipt
      console.log('Fetching friend amounts for receipt ID:', receiptId);
      let friendAmounts = [];
      try {
        friendAmounts = await api.receipts.getFinalAmounts(parseInt(receiptId));
        console.log('Friend amounts response:', JSON.stringify(friendAmounts, null, 2));
      } catch (friendAmountsError: any) {
        console.log('ReceiptsScreen - FinalAmounts API error caught:', friendAmountsError.message);
        if (friendAmountsError.message?.includes('status: 400')) {
          console.log('ReceiptsScreen - Receipt has no assigned items, using empty friend amounts');
          friendAmounts = [];
        } else {
          console.log('ReceiptsScreen - Re-throwing non-400 error:', friendAmountsError);
          throw friendAmountsError; // Re-throw if it's a different error
        }
      }
      
      console.log('ReceiptsScreen - Continuing with friend amounts:', friendAmounts);
      
      // Process items data
      const processedItems = receiptDetails?.items?.map((item: any) => {
        console.log('Processing item:', JSON.stringify(item, null, 2));
        
        // Get all assigned friend names and remove duplicates
        const assignedFriendNames = item.assignments?.flatMap((assignment: any) => 
          assignment.assignedFriends?.map((friend: any) => friend.name) || []
        ) || [];
        
        // Remove duplicates using Set
        const uniqueAssignedFriends = [...new Set(assignedFriendNames)];
        
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          assignedFriends: uniqueAssignedFriends,
        };
      }) || [];
      console.log('Processed items:', JSON.stringify(processedItems, null, 2));
      
      // Process friend amounts data
      const processedFriendAmounts = friendAmounts?.map((friend: any) => ({
        id: friend.id,
        name: friend.name,
        amountToPay: friend.amountToPay,
      })) || [];
      console.log('Processed friend amounts:', JSON.stringify(processedFriendAmounts, null, 2));
      
      // Create the updated receipt object
      const updatedReceiptData = {
        items: processedItems,
        friendAmounts: processedFriendAmounts,
      };
      
      // Update the receipts array
      setReceipts(prev => 
        prev.map(receipt => {
          if (receipt.id === receiptId) {
            const updatedReceipt = {
              ...receipt,
              ...updatedReceiptData,
            };
            console.log('Updated receipt in array:', JSON.stringify(updatedReceipt, null, 2));
            return updatedReceipt;
          }
          return receipt;
        })
      );
      
      // Update selectedReceipt if it's the same receipt - use setState callback to get latest state
      setSelectedReceipt(prevSelectedReceipt => {
        if (prevSelectedReceipt && prevSelectedReceipt.id === receiptId) {
          const updatedSelectedReceipt = {
            ...prevSelectedReceipt,
            ...updatedReceiptData,
          };
          console.log('Updating selectedReceipt with:', JSON.stringify(updatedSelectedReceipt, null, 2));
          return updatedSelectedReceipt;
        }
        return prevSelectedReceipt;
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

  // Handle back to receipts list
  const handleBackToReceipts = () => {
    setSelectedReceipt(null);
    setReceiptViewMode('items');
  };

  // Load receipts from API with pagination
  const loadReceipts = async (page: number = 1, isRefresh: boolean = false, searchTerm?: string) => {
    try {
      const actualSearchTerm = searchTerm && searchTerm.trim() ? searchTerm.trim() : undefined;
      console.log(`Loading receipts - Page: ${page}, SearchTerm: '${actualSearchTerm}', IsRefresh: ${isRefresh}`);
      
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await receiptApi.getReceiptsPaginated({
        page,
        pageSize: PAGE_SIZE,
        searchTerm: actualSearchTerm,
      });
      
      console.log('Paginated API response:', response);
      console.log('Response type:', typeof response, 'Is array:', Array.isArray(response));
      
      // Check if response is in paginated format or direct array format
      let convertedReceipts: HomeScreenReceipt[] = [];
      let paginationInfo = {
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
        totalCount: 0,
      };

      if (response && Array.isArray(response)) {
        // Direct array format (fallback or old API response)
        // Fetch friends for each receipt
        convertedReceipts = await Promise.all(
          response.map(async (receipt: ReceiptResponseDto) => {
            try {
              const receiptFriends = await api.receipts.getReceiptFriends(receipt.id);
              console.log(`Fetched friends for receipt ${receipt.id}:`, receiptFriends);
              
              const receiptWithFriends = {
                ...receipt,
                friends: receiptFriends
              };
              
              return convertReceiptToHomeFormat(receiptWithFriends);
            } catch (error) {
              console.error(`Failed to fetch friends for receipt ${receipt.id}:`, error);
              return convertReceiptToHomeFormat(receipt);
            }
          })
        );
        paginationInfo.totalCount = response.length;
      } else if (response && response.items && Array.isArray(response.items)) {
        // Paginated format
        // Fetch friends for each receipt
        convertedReceipts = await Promise.all(
          response.items.map(async (receipt: ReceiptResponseDto) => {
            try {
              const receiptFriends = await api.receipts.getReceiptFriends(receipt.id);
              console.log(`Fetched friends for receipt ${receipt.id}:`, receiptFriends);
              
              const receiptWithFriends = {
                ...receipt,
                friends: receiptFriends
              };
              
              return convertReceiptToHomeFormat(receiptWithFriends);
            } catch (error) {
              console.error(`Failed to fetch friends for receipt ${receipt.id}:`, error);
              return convertReceiptToHomeFormat(receipt);
            }
          })
        );
        paginationInfo = {
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          hasNextPage: response.hasNextPage,
          totalCount: response.totalCount,
        };
      } else {
        throw new Error('Invalid API response format');
      }
      
      if (page === 1 || isRefresh) {
        setReceipts(convertedReceipts);
      } else {
        setReceipts(prev => {
          const newReceipts = [...prev, ...convertedReceipts];
          return newReceipts;
        });
      }

      setPagination(paginationInfo);
    } catch (error) {
      console.error('Failed to load receipts:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Fallback: try using the non-paginated API if this is the first page
      if (page === 1) {
        try {
          console.log('Trying fallback to non-paginated API...');
          const fallbackResponse = await receiptApi.getReceipts();
          console.log('Fallback API response:', fallbackResponse);
          
          if (Array.isArray(fallbackResponse)) {
            const convertedReceipts = fallbackResponse.map(convertReceiptToHomeFormat);
            setReceipts(convertedReceipts);
            setPagination({
              currentPage: 1,
              totalPages: 1,
              hasNextPage: false,
              totalCount: convertedReceipts.length,
            });
            return; // Success with fallback
          }
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
        }
      }
      
      // If we get here, both APIs failed
      let errorMessage = 'Failed to load receipts';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      if (page === 1) {
        Alert.alert('Error', errorMessage + '. Please try again.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  // Load more receipts
  const loadMoreReceipts = () => {
    if (pagination.hasNextPage && !loadingMore) {
      loadReceipts(pagination.currentPage + 1, false, searchQuery);
    }
  };

  // Refresh receipts
  // Function to refresh friends for a specific receipt
  const refreshReceiptFriends = async (receiptId: number) => {
    try {
      const friendsResponse = await api.receipts.getReceiptFriends(receiptId);
      console.log(`Refreshed friends for receipt ${receiptId}:`, friendsResponse);
      
      // Update the receipt in the state with new friends data
      setReceipts(prevReceipts => 
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

  const refreshReceipts = () => {
    setIsRefreshing(true);
    loadReceipts(1, true, searchQuery);
  };

  // Load receipts on component mount
  useEffect(() => {
    loadReceipts(1, false);
    setHasInitiallyLoaded(true);
  }, []);

  // Handle search with debouncing (skip initial empty search)
  useEffect(() => {
    if (!hasInitiallyLoaded) return;
    
    const timeoutId = setTimeout(() => {
      // Only make API call if search query has changed meaningfully
      const actualSearchTerm = searchQuery && searchQuery.trim() ? searchQuery.trim() : undefined;
      loadReceipts(1, true, actualSearchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, hasInitiallyLoaded]);

  // Since we're doing server-side filtering, we can directly use receipts
  const displayReceipts = receipts;

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

    console.log('Rendering items for selectedReceipt:', JSON.stringify(selectedReceipt, null, 2));
    console.log('Items array:', selectedReceipt.items);
    console.log('Items length:', selectedReceipt.items?.length);

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
              <Text style={styles.noItemsText}>No items found (Debug: items={JSON.stringify(selectedReceipt.items)})</Text>
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
    console.log('Rendering friends for selectedReceipt:', JSON.stringify(selectedReceipt, null, 2));
    console.log('Friend amounts array:', selectedReceipt?.friendAmounts);
    console.log('Friend amounts length:', selectedReceipt?.friendAmounts?.length);
    
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
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToReceipts}>
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
      </View>
    );
  };

  if (selectedReceipt) {
    return renderReceiptDetail();
  }

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
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && searchQuery.length > 0 && (
          <ActivityIndicator size="small" color="#666" style={styles.searchLoadingIndicator} />
        )}
        {searchQuery.length > 0 && !loading && (
          <TouchableOpacity 
            style={styles.clearSearchButton} 
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>


      <View style={styles.content}>
        {/* Loading State for initial load */}
        {loading && pagination.currentPage === 1 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {searchQuery.length > 0 ? 'Searching receipts...' : 'Loading receipts...'}
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadReceipts(1, true, searchQuery)}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Receipts List */}
        {!loading && !error && (
          <FlatList
            data={displayReceipts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderReceipt(item)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.receiptsList}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshReceipts}
                colors={['#007AFF']}
                tintColor="#007AFF"
              />
            }
            onEndReached={loadMoreReceipts}
            onEndReachedThreshold={0.1}
            ListFooterComponent={() => {
              if (loadingMore) {
                return (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingMoreText}>Loading more...</Text>
                  </View>
                );
              }
              return null;
            }}
            ListEmptyComponent={() => (
              <View style={styles.noResultsContainer}>
                {searchQuery.trim() ? (
                  <>
                    <Ionicons name="search-outline" size={48} color="#ccc" />
                    <Text style={styles.noResultsText}>No receipts found</Text>
                    <Text style={styles.noResultsSubtext}>
                      Try searching for a different receipt name or friend
                    </Text>
                    <TouchableOpacity 
                      style={styles.clearSearchButton} 
                      onPress={() => setSearchQuery('')}
                    >
                      <Text style={styles.clearSearchText}>Clear search</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Ionicons name="receipt-outline" size={48} color="#ccc" />
                    <Text style={styles.noResultsText}>No receipts yet</Text>
                    <TouchableOpacity style={styles.addFirstReceiptButton} onPress={handleAddReceipt}>
                      <Text style={styles.addFirstReceiptText}>Add Your First Receipt</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          />
        )}
      </View>

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
    paddingHorizontal: padding.xl,
    paddingVertical: padding.xl,
    paddingTop: padding.xxl,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    minHeight: height.header,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    paddingTop: padding.sm,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    paddingTop: 10,
  },
  addButton: {
    padding: 5,
    paddingTop: 15,

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
  clearSearchButton: {
    padding: 4,
  },
  searchLoadingIndicator: {
    marginRight: 8,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  receiptsList: {
    paddingTop: 10,
  },
  // Receipt styles (updated for click navigation)
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
  expandIcon: {
    marginTop: 4,
  },
  receiptWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  // Receipt detail view styles
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
  addFirstReceiptButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstReceiptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  noItemsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
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
