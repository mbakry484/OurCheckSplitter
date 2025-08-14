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
import { ReceiptResponseDto, PaginatedResponseDto, convertReceiptToHomeFormat } from '../types/api';

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
  const [receipts, setReceipts] = useState<Receipt[]>([]);
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

  // Load receipts from API with pagination
  const loadReceipts = async (page: number = 1, isRefresh: boolean = false, searchTerm?: string) => {
    try {
      console.log(`Loading receipts - Page: ${page}, SearchTerm: '${searchTerm}', IsRefresh: ${isRefresh}`);
      
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await receiptApi.getReceiptsPaginated({
        page,
        pageSize: PAGE_SIZE,
        searchTerm: searchTerm || undefined,
      });
      
      console.log('Paginated API response:', response);
      console.log('Response type:', typeof response, 'Is array:', Array.isArray(response));
      
      // Check if response is in paginated format or direct array format
      let convertedReceipts: Receipt[] = [];
      let paginationInfo = {
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
        totalCount: 0,
      };

      if (response && Array.isArray(response)) {
        // Direct array format (fallback or old API response)
        convertedReceipts = response.map(convertReceiptToHomeFormat);
        paginationInfo.totalCount = response.length;
      } else if (response && response.items && Array.isArray(response.items)) {
        // Paginated format
        convertedReceipts = response.items.map(convertReceiptToHomeFormat);
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
        setReceipts(prev => [...prev, ...convertedReceipts]);
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
      loadReceipts(1, true, searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, hasInitiallyLoaded]);

  // Since we're doing server-side filtering, we can directly use receipts
  const displayReceipts = receipts;

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
