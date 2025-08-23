import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, padding, height, width, screenDimensions } from '../utils/responsive';
import { friendsApi } from '../services/api';
import { PaginatedResponseDto, FriendDto } from '../types/api';
import { api } from '../services/api';

interface Receipt {
  id: string;
  title: string;
  date: string;
  totalAmount: number;
  friendPaidAmount: number;
  userPaidAmount: number;
  participants: string[];
  items?: ReceiptItem[];
  friendAmounts?: FriendAmount[];
}

interface ReceiptItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  assignedFriends: string[];
}

interface FriendAmount {
  id: number;
  name: string;
  amountToPay: number;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  receipts: string[]; // Array of receipt names (for backward compatibility)
  totalPaid: number; // Total amount this friend paid across all receipts
  detailedReceipts?: Receipt[]; // Detailed receipt information
}

interface FriendsScreenProps {
  navigation?: any;
  route?: any;
}

const FriendsScreen = ({ navigation, route }: FriendsScreenProps) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    totalCount: 0,
  });
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState<Set<string>>(new Set());
  const [loadingMoreReceipts, setLoadingMoreReceipts] = useState<Set<string>>(new Set());
  const [receiptsPagination, setReceiptsPagination] = useState<{ [friendId: string]: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    totalCount: number;
  } }>({});
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptViewMode, setReceiptViewMode] = useState<'list' | 'detail'>('list');
  const [loadingReceiptDetails, setLoadingReceiptDetails] = useState(false);

  // Handle navigation from HomeScreen
  useEffect(() => {
    if (route?.params?.selectedFriend) {
      setSelectedFriend(route.params.selectedFriend);
    }
  }, [route?.params?.selectedFriend]);

  const PAGE_SIZE = 10;



  // Load friends on component mount
  useEffect(() => {
    loadFriends(1, false);
    setHasInitiallyLoaded(true);
  }, []);

  // Handle search with debouncing (skip initial empty search)
  useEffect(() => {
    if (!hasInitiallyLoaded) return;
    
    const timeoutId = setTimeout(() => {
      loadFriends(1, true, searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, hasInitiallyLoaded]);

  // Load friends from API with pagination (without receipts initially)
  const loadFriends = async (page: number = 1, isRefresh: boolean = false, searchTerm?: string) => {
    try {
      console.log(`Loading friends - Page: ${page}, SearchTerm: '${searchTerm}', IsRefresh: ${isRefresh}`);
      
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await friendsApi.getFriendsPaginated({
        page,
        pageSize: PAGE_SIZE,
        searchTerm: searchTerm || undefined,
      });
      
      console.log('Loaded friends from API:', response);
      console.log('Friends response type:', typeof response, 'Is array:', Array.isArray(response));
      
      // Check if response is in paginated format or direct array format
      let mappedFriends: Friend[] = [];
      let paginationInfo = {
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
        totalCount: 0,
      };

      const mapFriendData = (friend: any): Friend => {
        return {
          id: friend.id.toString(),
          name: friend.name,
          avatar: generateAvatar(friend.name),
          receipts: friend.receipts?.map((r: any) => r.name || r.title) || [],
          totalPaid: friend.receipts?.reduce((sum: number, r: any) => sum + (r.total || 0), 0) || 0,
          detailedReceipts: [] // Will be loaded when friend is clicked
        };
      };

      if (response && Array.isArray(response)) {
        // Direct array format (fallback or old API response)
        mappedFriends = response.map(mapFriendData);
        paginationInfo.totalCount = response.length;
      } else if (response && response.items && Array.isArray(response.items)) {
        // Paginated format
        mappedFriends = response.items.map(mapFriendData);
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
        setFriends(mappedFriends);
      } else {
        setFriends(prev => [...prev, ...mappedFriends]);
      }

      setPagination(paginationInfo);

    } catch (error) {
      console.error('Error loading friends:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Fallback: try using the non-paginated API if this is the first page
      if (page === 1) {
        try {
          console.log('Trying fallback to non-paginated friends API...');
          const fallbackResponse = await friendsApi.getFriends();
          console.log('Fallback friends API response:', fallbackResponse);
          
          if (Array.isArray(fallbackResponse)) {
            // For fallback, use a simpler mapping without fetching receipt friends
            const mappedFriends = fallbackResponse.map((friend: any) => ({
              id: friend.id.toString(),
              name: friend.name,
              avatar: generateAvatar(friend.name),
              receipts: friend.receipts?.map((r: any) => r.name || r.title) || [],
              totalPaid: friend.receipts?.reduce((sum: number, r: any) => sum + (r.total || 0), 0) || 0,
              detailedReceipts: []
            }));
            
            setFriends(mappedFriends);
            setPagination({
              currentPage: 1,
              totalPages: 1,
              hasNextPage: false,
              totalCount: mappedFriends.length,
            });
            return; // Success with fallback
          }
        } catch (fallbackError) {
          console.error('Fallback friends API also failed:', fallbackError);
        }
        
        // Final fallback to mock data
        console.log('Using mock data as final fallback');
        setFriends(getMockFriends());
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  // Load receipts for a specific friend with pagination
  const loadFriendReceipts = async (friendId: string, page: number = 1, isLoadMore: boolean = false) => {
    try {
      console.log(`Loading receipts for friend ${friendId} - Page: ${page}, LoadMore: ${isLoadMore}`);
      
      if (page === 1) {
        setLoadingReceipts(prev => new Set([...prev, friendId]));
      } else {
        setLoadingMoreReceipts(prev => new Set([...prev, friendId]));
      }
      
      // Find the friend in the current list or use selectedFriend if available
      let friend = friends.find(f => f.id === friendId);
      if (!friend && selectedFriend && selectedFriend.id === friendId) {
        friend = selectedFriend;
      }
      if (!friend) {
        console.error(`Friend ${friendId} not found`);
        return;
      }

      // Get friend details with receipts from API (limit to 10 receipts per page)
      const friendDetails = await friendsApi.getFriendById(parseInt(friendId));
      if (!friendDetails || !friendDetails.receipts) {
        console.log(`No receipts found for friend ${friendId}`);
        return;
      }

      // Calculate pagination for receipts
      const receiptsPerPage = 10;
      const totalReceipts = friendDetails.receipts.length;
      const totalPages = Math.ceil(totalReceipts / receiptsPerPage);
      const startIndex = (page - 1) * receiptsPerPage;
      const endIndex = startIndex + receiptsPerPage;
      const pageReceipts = friendDetails.receipts.slice(startIndex, endIndex);

      // Load detailed receipt information with friends for each receipt on this page
      const detailedReceipts = await Promise.all(
        pageReceipts.map(async (r: any) => {
          try {
            // Fetch friends for this receipt
            const receiptFriends = await api.receipts.getReceiptFriends(parseInt(r.id));
            const participantNames = receiptFriends.map((f: any) => f.name);
            
            return {
              id: r.id?.toString() || '',
              title: r.name || r.title || 'Unknown Receipt',
              date: 'Today', // You can format this based on actual date
              totalAmount: r.total || 0,
              userPaidAmount: r.total || 0, // Assuming friend paid the total
              participants: participantNames
            };
          } catch (error) {
            console.error(`Failed to fetch friends for receipt ${r.id}:`, error);
            return {
              id: r.id?.toString() || '',
              title: r.name || r.title || 'Unknown Receipt',
              date: 'Today',
              totalAmount: r.total || 0,
              userPaidAmount: r.total || 0,
              participants: []
            };
          }
        })
      );

      // Update pagination state
      setReceiptsPagination(prev => ({
        ...prev,
        [friendId]: {
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          totalCount: totalReceipts,
        }
      }));

             // Update the friend with detailed receipts (append if loading more)
       const updatedFriend = {
         ...friend,
         detailedReceipts: isLoadMore 
           ? [...(friend.detailedReceipts || []), ...detailedReceipts]
           : detailedReceipts
       };

       // Update both the friends list and the selectedFriend state
       setFriends(prev => 
         prev.map(f => 
           f.id === friendId 
             ? updatedFriend
             : f
         )
       );

       // Also update the selectedFriend state if this is the currently selected friend
       setSelectedFriend(prev => 
         prev && prev.id === friendId 
           ? updatedFriend
           : prev
       );

      console.log(`Loaded ${detailedReceipts.length} receipts for friend ${friendId} (page ${page}/${totalPages})`);

    } catch (error) {
      console.error(`Failed to load receipts for friend ${friendId}:`, error);
    } finally {
      if (page === 1) {
        setLoadingReceipts(prev => {
          const newSet = new Set(prev);
          newSet.delete(friendId);
          return newSet;
        });
      } else {
        setLoadingMoreReceipts(prev => {
          const newSet = new Set(prev);
          newSet.delete(friendId);
          return newSet;
        });
      }
    }
  };

  // Load more receipts for a friend
  const loadMoreFriendReceipts = async (friendId: string) => {
    const pagination = receiptsPagination[friendId];
    if (pagination && pagination.hasNextPage && !loadingMoreReceipts.has(friendId)) {
      await loadFriendReceipts(friendId, pagination.currentPage + 1, true);
    }
  };

  // Generate avatar based on first letter of name
  const generateAvatar = (name: string): string => {
    const firstLetter = name.charAt(0).toUpperCase();
    const avatars: { [key: string]: string } = {
      'A': '👨',
      'E': '👩‍🦰',
      'S': '👩',
      'M': '👨‍💼',
      'J': '👨',
      'K': '👩‍💻',
      'L': '👨‍🏫',
      'D': '👩‍🎨',
    };
    return avatars[firstLetter] || '👤';
  };

  // Load more friends
  const loadMoreFriends = () => {
    if (pagination.hasNextPage && !loadingMore) {
      loadFriends(pagination.currentPage + 1, false, searchQuery);
    }
  };

  // Refresh friends
  const refreshFriends = () => {
    setIsRefreshing(true);
    loadFriends(1, true, searchQuery);
  };

  // Handle adding a new friend
  const handleAddFriend = () => {
    setShowAddFriendModal(true);
  };

  // Handle saving the new friend
  const handleSaveFriend = async () => {
    if (newFriendName && newFriendName.trim()) {
      try {
        setLoading(true);
        await friendsApi.createFriend(newFriendName.trim());
        await loadFriends(1, true, searchQuery); // Reload the friends list
        setShowAddFriendModal(false);
        setNewFriendName('');
        Alert.alert('Success', `${newFriendName.trim()} has been added to your friends!`);
      } catch (error) {
        console.error('Error adding friend:', error);
        Alert.alert('Error', 'Failed to add friend. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle canceling add friend
  const handleCancelAddFriend = () => {
    setShowAddFriendModal(false);
    setNewFriendName('');
  };

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

  const handleReceiptsNavigation = () => {
    if (navigation) {
      navigation.navigate('Receipts');
    }
  };

  const handleProfileNavigation = () => {
    if (navigation) {
      navigation.navigate('Profile');
    }
  };

  const handleFriendPress = (friend: Friend) => {
    // Always load real receipts from the database
    setSelectedFriend(friend);
    loadFriendReceipts(friend.id, 1, false); // Load first page of receipts for the selected friend
  };

  const handleBackToFriends = () => {
    setSelectedFriend(null);
    setSelectedReceipt(null);
    setReceiptViewMode('list');
  };

  const handleReceiptPress = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setReceiptViewMode('detail');
    await fetchReceiptDetails(receipt.id);
  };

  const handleBackToReceipts = () => {
    setSelectedReceipt(null);
    setReceiptViewMode('list');
  };

  const fetchReceiptDetails = async (receiptId: string) => {
    try {
      setLoadingReceiptDetails(true);
      // Fetch detailed receipt information including items and friend amounts
      const receiptDetails = await api.receipts.getReceiptById(parseInt(receiptId));
      
      if (receiptDetails) {
        setSelectedReceipt(prev => prev ? {
          ...prev,
          items: receiptDetails.items || [],
          friendAmounts: receiptDetails.friendAmounts || []
        } : null);
      }
    } catch (error) {
      console.error('Failed to fetch receipt details:', error);
    } finally {
      setLoadingReceiptDetails(false);
    }
  };

  // Mock data function for fallback
  const getMockFriends = (): Friend[] => [
    {
      id: '1',
      name: 'John',
      avatar: '👨',
      receipts: ['Dinner at Italian Place', 'Pizza Lunch', 'Gas Station', 'Breakfast at Cafe', 'Movie Night'],
      totalPaid: 89.75,
             detailedReceipts: [
         { id: '1', title: 'Dinner at Italian Place', date: 'Oct 30, 2023', totalAmount: 51.00, friendPaidAmount: 25.50, userPaidAmount: 25.50, participants: ['You', 'Sarah'] },
         { id: '5', title: 'Pizza Lunch', date: 'Oct 20, 2023', totalAmount: 32.75, friendPaidAmount: 10.92, userPaidAmount: 10.92, participants: ['You', 'Emma', 'Alex'] },
         { id: '6', title: 'Gas Station', date: 'Oct 18, 2023', totalAmount: 45.20, friendPaidAmount: 22.60, userPaidAmount: 22.60, participants: ['You', 'Sarah'] },
         { id: '7', title: 'Breakfast at Cafe', date: 'Oct 15, 2023', totalAmount: 28.90, friendPaidAmount: 14.45, userPaidAmount: 14.45, participants: ['You', 'Emma'] },
         { id: '4', title: 'Movie Night', date: 'Oct 22, 2023', totalAmount: 48.00, friendPaidAmount: 16.28, userPaidAmount: 16.28, participants: ['You', 'Sarah', 'Mike'] },
       ]
    },
    {
      id: '2',
      name: 'Sarah',
      avatar: '👩',
      receipts: ['Dinner at Italian Place', 'Gas Station', 'Movie Night'],
      totalPaid: 45.20,
             detailedReceipts: [
         { id: '1', title: 'Dinner at Italian Place', date: 'Oct 30, 2023', totalAmount: 51.00, friendPaidAmount: 25.50, userPaidAmount: 25.50, participants: ['You', 'John'] },
         { id: '6', title: 'Gas Station', date: 'Oct 18, 2023', totalAmount: 45.20, friendPaidAmount: 22.60, userPaidAmount: 22.60, participants: ['You', 'John'] },
         { id: '4', title: 'Movie Night', date: 'Oct 22, 2023', totalAmount: 48.00, friendPaidAmount: 16.00, userPaidAmount: 16.00, participants: ['You', 'John', 'Mike'] },
       ]
    },
    {
      id: '3',
      name: 'Mike',
      avatar: '👨‍💼',
      receipts: ['Movie Night', 'Uber Ride', 'Lunch Meeting', 'Coffee Break', 'Team Dinner', 'Office Supplies', 'Taxi Ride', 'Snacks'],
      totalPaid: 156.80,
             detailedReceipts: [
         { id: '4', title: 'Movie Night', date: 'Oct 22, 2023', totalAmount: 48.00, friendPaidAmount: 15.72, userPaidAmount: 15.72, participants: ['You', 'John', 'Sarah'] },
         { id: '8', title: 'Uber Ride', date: 'Oct 12, 2023', totalAmount: 18.50, friendPaidAmount: 9.25, userPaidAmount: 9.25, participants: ['You', 'Alex'] },
         { id: '9', title: 'Lunch Meeting', date: 'Oct 10, 2023', totalAmount: 67.80, friendPaidAmount: 22.60, userPaidAmount: 22.60, participants: ['You', 'Sarah', 'Lisa'] },
         { id: '10', title: 'Coffee Break', date: 'Oct 8, 2023', totalAmount: 15.40, friendPaidAmount: 7.70, userPaidAmount: 7.70, participants: ['You', 'Emma'] },
         { id: '11', title: 'Team Dinner', date: 'Oct 5, 2023', totalAmount: 89.50, friendPaidAmount: 29.83, userPaidAmount: 29.83, participants: ['You', 'Lisa', 'David'] },
         { id: '12', title: 'Office Supplies', date: 'Oct 3, 2023', totalAmount: 45.20, friendPaidAmount: 22.60, userPaidAmount: 22.60, participants: ['You', 'Lisa'] },
         { id: '13', title: 'Taxi Ride', date: 'Sep 30, 2023', totalAmount: 25.80, friendPaidAmount: 12.90, userPaidAmount: 12.90, participants: ['You', 'Alex'] },
         { id: '14', title: 'Snacks', date: 'Sep 28, 2023', totalAmount: 32.40, friendPaidAmount: 16.20, userPaidAmount: 16.20, participants: ['You', 'Emma'] },
       ]
    },
    {
      id: '4',
      name: 'Emma',
      avatar: '👩‍🦰',
      receipts: ['Groceries', 'Pizza Lunch', 'Breakfast at Cafe'],
      totalPaid: 32.15,
             detailedReceipts: [
         { id: '2', title: 'Groceries', date: 'Oct 29, 2023', totalAmount: 25.98, friendPaidAmount: 12.99, userPaidAmount: 12.99, participants: ['You'] },
         { id: '5', title: 'Pizza Lunch', date: 'Oct 20, 2023', totalAmount: 32.75, friendPaidAmount: 10.91, userPaidAmount: 10.91, participants: ['You', 'John', 'Alex'] },
         { id: '7', title: 'Breakfast at Cafe', date: 'Oct 15, 2023', totalAmount: 28.90, friendPaidAmount: 14.45, userPaidAmount: 14.45, participants: ['You', 'John'] },
       ]
    },
    {
      id: '5',
      name: 'Alex',
      avatar: '👨‍🎓',
      receipts: ['Coffee with Alex', 'Pizza Lunch', 'Uber Ride'],
      totalPaid: 28.90,
      detailedReceipts: [
        { id: '3', title: 'Coffee with Alex', date: 'Oct 24, 2023', totalAmount: 11.50, friendPaidAmount: 5.75, userPaidAmount: 5.75, participants: ['You'] },
        { id: '5', title: 'Pizza Lunch', date: 'Oct 20, 2023', totalAmount: 32.75, friendPaidAmount: 10.92, userPaidAmount: 10.92, participants: ['You', 'John', 'Emma'] },
        { id: '8', title: 'Uber Ride', date: 'Oct 12, 2023', totalAmount: 18.50, friendPaidAmount: 9.25, userPaidAmount: 9.25, participants: ['You', 'Mike'] },
      ]
    },
    {
      id: '6',
      name: 'Lisa',
      avatar: '👩‍💻',
      receipts: ['Shopping Trip', 'Lunch Date', 'Coffee Meeting', 'Book Store'],
      totalPaid: 67.45,
      detailedReceipts: [
        { id: '15', title: 'Shopping Trip', date: 'Oct 25, 2023', totalAmount: 89.60, friendPaidAmount: 44.80, userPaidAmount: 44.80, participants: ['You', 'Kate'] },
        { id: '9', title: 'Lunch Date', date: 'Oct 10, 2023', totalAmount: 67.80, friendPaidAmount: 22.60, userPaidAmount: 22.60, participants: ['You', 'Mike', 'Sarah'] },
        { id: '16', title: 'Coffee Meeting', date: 'Oct 7, 2023', totalAmount: 24.30, friendPaidAmount: 12.15, userPaidAmount: 12.15, participants: ['You'] },
        { id: '12', title: 'Book Store', date: 'Oct 3, 2023', totalAmount: 45.20, friendPaidAmount: 22.60, userPaidAmount: 22.60, participants: ['You', 'Mike'] },
      ]
    },
    {
      id: '7',
      name: 'David',
      avatar: '👨‍🔬',
      receipts: ['Lab Equipment', 'Research Dinner', 'Conference Lunch', 'Hotel Stay', 'Airport Taxi', 'Breakfast'],
      totalPaid: 234.60,
      detailedReceipts: [
        { id: '17', title: 'Lab Equipment', date: 'Oct 26, 2023', totalAmount: 156.80, friendPaidAmount: 78.40, userPaidAmount: 78.40, participants: ['You', 'Kate'] },
        { id: '11', title: 'Research Dinner', date: 'Oct 5, 2023', totalAmount: 89.50, friendPaidAmount: 29.83, userPaidAmount: 29.83, participants: ['You', 'Mike', 'Lisa'] },
        { id: '18', title: 'Conference Lunch', date: 'Oct 2, 2023', totalAmount: 45.70, friendPaidAmount: 22.85, userPaidAmount: 22.85, participants: ['You'] },
        { id: '19', title: 'Hotel Stay', date: 'Sep 29, 2023', totalAmount: 189.00, friendPaidAmount: 94.50, userPaidAmount: 94.50, participants: ['You'] },
        { id: '20', title: 'Airport Taxi', date: 'Sep 28, 2023', totalAmount: 34.20, friendPaidAmount: 17.10, userPaidAmount: 17.10, participants: ['You'] },
        { id: '21', title: 'Breakfast', date: 'Sep 27, 2023', totalAmount: 28.40, friendPaidAmount: 14.20, userPaidAmount: 14.20, participants: ['You'] },
      ]
    },
    {
      id: '8',
      name: 'Kate',
      avatar: '👩‍🎨',
      receipts: ['Art Supplies', 'Gallery Visit', 'Creative Workshop'],
      totalPaid: 78.30,
      detailedReceipts: [
        { id: '22', title: 'Art Supplies', date: 'Oct 21, 2023', totalAmount: 67.40, friendPaidAmount: 33.70, userPaidAmount: 33.70, participants: ['You'] },
        { id: '15', title: 'Gallery Visit', date: 'Oct 25, 2023', totalAmount: 89.60, friendPaidAmount: 44.80, userPaidAmount: 44.80, participants: ['You', 'Lisa'] },
        { id: '23', title: 'Creative Workshop', date: 'Oct 14, 2023', totalAmount: 125.00, friendPaidAmount: 62.50, userPaidAmount: 62.50, participants: ['You'] },
      ]
    },
  ];

  // Since we're doing server-side filtering, we can directly use friends
  const displayFriends = friends;

  const renderFriend = (friend: Friend) => (
    <TouchableOpacity key={friend.id} style={styles.friendCard} onPress={() => handleFriendPress(friend)}>
      <View style={styles.friendLeft}>
        <View style={styles.friendAvatar}>
          <Text style={styles.avatarText}>{friend.avatar}</Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={styles.friendReceiptsCount}>{friend.receipts.length} receipts</Text>
          <Text style={styles.friendReceiptsList}>
            {friend.receipts.slice(0, 2).join(', ')}
            {friend.receipts.length > 2 && `, +${friend.receipts.length - 2} more`}
          </Text>
        </View>
      </View>
      <View style={styles.friendRight}>
        <Text style={styles.totalPaidLabel}>Total Paid</Text>
        <Text style={styles.totalPaidAmount}>
          ${friend.totalPaid.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

    const renderFriendDetail = () => {
    if (!selectedFriend) return null;

    // If we're viewing a receipt detail, show that instead
    if (receiptViewMode === 'detail' && selectedReceipt) {
      return renderReceiptDetail();
    }

    return (
      <View style={styles.friendDetailContainer}>
        {/* Friend Detail Header */}
        <View style={styles.friendDetailHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToFriends}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.friendDetailInfo}>
            <View style={styles.friendDetailAvatar}>
              <Text style={styles.friendDetailAvatarText}>{selectedFriend.avatar}</Text>
            </View>
            <View style={styles.friendDetailText}>
              <Text style={styles.friendDetailName}>{selectedFriend.name}</Text>
              <Text style={styles.friendDetailStats}>
                {selectedFriend.receipts.length} receipts • ${selectedFriend.totalPaid.toFixed(2)} total paid
              </Text>
            </View>
          </View>
        </View>

                 {/* Friend's Receipts List */}
         <FlatList
           style={styles.friendReceiptsContainer}
           data={selectedFriend.detailedReceipts || []}
           keyExtractor={(item) => item.id}
           showsVerticalScrollIndicator={false}
           ListHeaderComponent={() => (
             <Text style={styles.receiptsListTitle}>Receipts</Text>
           )}
           renderItem={({ item: receipt }) => (
             <TouchableOpacity 
               style={styles.receiptCard}
               onPress={() => handleReceiptPress(receipt)}
             >
               <View style={styles.receiptCardLeft}>
                 <Text style={styles.receiptCardTitle}>{receipt.title}</Text>
                 <Text style={styles.receiptCardDate}>{receipt.date}</Text>
                 <Text style={styles.receiptCardPaid}>
                   {selectedFriend.name} Paid ${receipt.userPaidAmount.toFixed(2)}
                 </Text>
                 <View style={styles.receiptCardParticipants}>
                   <Text style={styles.receiptCardParticipantsLabel}>With: </Text>
                   <Text style={styles.receiptCardParticipantsNames}>
                     {receipt.participants && receipt.participants.length > 0 
                       ? receipt.participants.join(', ')
                       : 'Solo receipt'
                     }
                   </Text>
                 </View>
               </View>
               <View style={styles.receiptCardRight}>
                 <Text style={styles.receiptCardTotalLabel}>Total</Text>
                 <Text style={styles.receiptCardTotalAmount}>
                   ${receipt.totalAmount.toFixed(2)}
                 </Text>
                 <Ionicons 
                   name="chevron-forward" 
                   size={20} 
                   color="#666" 
                   style={styles.receiptCardArrow}
                 />
               </View>
             </TouchableOpacity>
           )}
           ListEmptyComponent={() => {
             if (loadingReceipts.has(selectedFriend.id)) {
               return (
                 <View style={styles.loadingReceiptsContainer}>
                   <ActivityIndicator size="small" color="#007AFF" />
                   <Text style={styles.loadingReceiptsText}>Loading receipts...</Text>
                 </View>
               );
             } else if (selectedFriend.receipts && selectedFriend.receipts.length > 0) {
               // Fallback to simple receipt list if detailed receipts not loaded yet
               return (
                 <>
                   {selectedFriend.receipts.map((receipt, index) => (
                     <View key={index} style={styles.receiptItem}>
                       <View style={styles.receiptLeft}>
                         <Ionicons name="receipt-outline" size={20} color="#007AFF" />
                         <Text style={styles.receiptName}>{receipt}</Text>
                       </View>
                       <Ionicons name="chevron-forward" size={16} color="#999" />
                     </View>
                   ))}
                 </>
               );
             } else {
               return (
                 <View style={styles.emptyReceiptsContainer}>
                   <Text style={styles.emptyReceiptsText}>No receipts found</Text>
                 </View>
               );
             }
           }}
           ListFooterComponent={() => {
             const pagination = receiptsPagination[selectedFriend.id];
             if (loadingMoreReceipts.has(selectedFriend.id)) {
               return (
                 <View style={styles.loadingMoreReceiptsContainer}>
                   <ActivityIndicator size="small" color="#007AFF" />
                   <Text style={styles.loadingMoreReceiptsText}>Loading more receipts...</Text>
                 </View>
               );
             } else if (pagination && pagination.hasNextPage) {
               return (
                 <TouchableOpacity 
                   style={styles.loadMoreReceiptsButton}
                   onPress={() => loadMoreFriendReceipts(selectedFriend.id)}
                 >
                   <Text style={styles.loadMoreReceiptsButtonText}>
                     Load More Receipts ({pagination.totalCount - (selectedFriend.detailedReceipts?.length || 0)} more)
                   </Text>
                 </TouchableOpacity>
               );
             }
             return null;
           }}
           onEndReached={() => {
             const pagination = receiptsPagination[selectedFriend.id];
             if (pagination && pagination.hasNextPage && !loadingMoreReceipts.has(selectedFriend.id)) {
               loadMoreFriendReceipts(selectedFriend.id);
             }
           }}
           onEndReachedThreshold={0.1}
         />
      </View>
    );
  };

  const renderReceiptDetail = () => {
    if (!selectedReceipt) return null;

    return (
      <View style={styles.friendDetailContainer}>
        {/* Receipt Detail Header */}
        <View style={styles.friendDetailHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToReceipts}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.friendDetailInfo}>
            <View style={styles.friendDetailAvatar}>
              <Ionicons name="receipt-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.friendDetailText}>
              <Text style={styles.friendDetailName}>{selectedReceipt.title}</Text>
              <Text style={styles.friendDetailStats}>
                {selectedReceipt.date} • ${selectedReceipt.totalAmount.toFixed(2)} total
              </Text>
            </View>
          </View>
        </View>

        {/* Receipt Details */}
        <ScrollView style={styles.friendReceiptsContainer} showsVerticalScrollIndicator={false}>
          {loadingReceiptDetails ? (
            <View style={styles.loadingReceiptsContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingReceiptsText}>Loading receipt details...</Text>
            </View>
          ) : (
            <>
              {/* Items Section */}
              {selectedReceipt.items && selectedReceipt.items.length > 0 && (
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {selectedReceipt.items.map((item, index) => (
                    <View key={index} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                      </View>
                      <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                      {item.assignedFriends && item.assignedFriends.length > 0 && (
                        <View style={styles.assignedFriends}>
                          <Text style={styles.assignedLabel}>Assigned to: </Text>
                          <Text style={styles.assignedNames}>
                            {item.assignedFriends.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Friend Amounts Section */}
              {selectedReceipt.friendAmounts && selectedReceipt.friendAmounts.length > 0 && (
                <View style={styles.friendAmountsSection}>
                  <Text style={styles.sectionTitle}>Friend Amounts</Text>
                  {selectedReceipt.friendAmounts.map((friendAmount, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.friendAmountCard,
                        friendAmount.name === selectedFriend?.name && styles.highlightedFriendCard
                      ]}
                    >
                      <Text style={[
                        styles.friendAmountName,
                        friendAmount.name === selectedFriend?.name && styles.highlightedFriendName
                      ]}>
                        {friendAmount.name}
                      </Text>
                      <Text style={[
                        styles.friendAmountValue,
                        friendAmount.name === selectedFriend?.name && styles.highlightedFriendAmount
                      ]}>
                        ${friendAmount.amountToPay.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Summary */}
              <View style={styles.receiptSummary}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount:</Text>
                  <Text style={styles.summaryValue}>${selectedReceipt.totalAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{selectedFriend?.name} Paid:</Text>
                  <Text style={styles.summaryValue}>${selectedReceipt.userPaidAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Participants:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedReceipt.participants && selectedReceipt.participants.length > 0 
                      ? selectedReceipt.participants.join(', ')
                      : 'Solo receipt'
                    }
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  };



  return (
    <SafeAreaView style={styles.container}>
      {selectedFriend ? (
        renderFriendDetail()
      ) : (
        <>
          {/* Header */}
          <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Friends</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddFriend} disabled={loading}>
              <Ionicons name="person-add-outline" size={24} color={loading ? "#ccc" : "#007AFF"} />
            </TouchableOpacity>
          </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
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
              {searchQuery.length > 0 ? 'Searching friends...' : 'Loading friends...'}
            </Text>
          </View>
        )}

        {/* Friends List */}
        {!loading && (
          <FlatList
            data={displayFriends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderFriend(item)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.friendsList}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshFriends}
                colors={['#007AFF']}
                tintColor="#007AFF"
              />
            }
            onEndReached={loadMoreFriends}
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
                    <Text style={styles.noResultsText}>No friends found</Text>
                    <Text style={styles.noResultsSubtext}>
                      Try searching for a different name
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
                    <Ionicons name="people-outline" size={48} color="#ccc" />
                    <Text style={styles.noResultsText}>No friends yet</Text>
                    <TouchableOpacity style={styles.addFirstFriendButton} onPress={handleAddFriend}>
                      <Text style={styles.addFirstFriendText}>Add Your First Friend</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          />
        )}
      </View>
        </>
      )}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomeNavigation}>
          <Ionicons name="home-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleReceiptsNavigation}>
          <Ionicons name="receipt-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfileNavigation}>
          <Ionicons name="person-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriendModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelAddFriend}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Friend's Name</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Enter friend's name"
                placeholderTextColor="#999"
                value={newFriendName}
                onChangeText={setNewFriendName}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleSaveFriend}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelAddFriend}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveFriend}
                disabled={loading || !newFriendName.trim()}
              >
                <Text style={[styles.saveButtonText, (!newFriendName.trim() || loading) && styles.disabledButtonText]}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
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
    justifyContent: 'space-between',
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
  backButton: {
    paddingTop: 10,

    padding: 5,
  },
  addButton: {
    paddingTop: 10,

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
  friendReceiptsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  friendReceiptsList: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  friendRight: {
    alignItems: 'flex-end',
  },
  totalPaidLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  totalPaidAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
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
  addFirstFriendButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstFriendText: {
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
  friendDetailContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  friendDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  friendDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 15,
  },
  friendDetailAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  friendDetailAvatarText: {
    fontSize: 24,
  },
  friendDetailText: {
    flex: 1,
  },
  friendDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  friendDetailStats: {
    fontSize: 14,
    color: '#666',
  },
  friendReceiptsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  receiptsListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  receiptName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  // Friend receipt styles (updated for click navigation)
  friendReceiptItem: {
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
  friendReceiptLeft: {
    flex: 1,
  },
  friendReceiptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendReceiptDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  friendReceiptType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  friendPaidContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  friendPaidAmount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  friendReceiptParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  friendReceiptParticipantsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  friendReceiptParticipantNames: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  friendReceiptRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  friendReceiptTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  friendReceiptAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  expandIcon: {
    marginTop: 4,
  },
  receiptDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  detailsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingDetailsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 5,
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  assignedFriends: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  assignedLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  assignedNames: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  friendAmountsSection: {
    marginBottom: 10,
  },
  friendAmountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  highlightedFriendCard: {
    backgroundColor: '#E8F5E8',
    borderLeftColor: '#4CAF50',
  },
  friendAmountName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  highlightedFriendName: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  friendAmountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  highlightedFriendAmount: {
    color: '#4CAF50',
  },
  receiptWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  // Receipt detail view styles for FriendsScreen
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
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  receiptDate: {
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
  highlightedAssignedFriend: {
    color: '#007AFF',
    fontWeight: 'bold',
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
  highlightedFriendNameBW: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  friendAmountBW: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  highlightedFriendAmountBW: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  itemsInlineBW: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginTop: 2,
  },
  highlightedItemsInlineBW: {
    color: '#007AFF',
    fontWeight: 'bold',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F8F9FA',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  disabledButtonText: {
    opacity: 0.5,
  },
  loadingReceiptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingReceiptsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyReceiptsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyReceiptsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  // Receipt card styles (like All Receipts screen)
  receiptCard: {
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
  receiptCardLeft: {
    flex: 1,
  },
  receiptCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  receiptCardDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  receiptCardPaid: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  receiptCardParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  receiptCardParticipantsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  receiptCardParticipantsNames: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  receiptCardRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  receiptCardTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptCardTotalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  receiptCardArrow: {
    marginTop: 4,
  },
  // Pagination styles for friend receipts
  loadingMoreReceiptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingMoreReceiptsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  loadMoreReceiptsButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
  },
  loadMoreReceiptsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  // Receipt summary styles
  receiptSummary: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

export default FriendsScreen;
