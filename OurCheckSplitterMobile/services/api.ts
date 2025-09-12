// API Configuration and Base Service
// Network configuration for React Native
const getApiBaseUrl = () => {
  // Always use production API - no more ngrok development server
  return 'http://ourchecksplitter.runasp.net/api';
  
  // Development URLs (commented out - use production instead):
  // return 'https://4cef852954ce.ngrok-free.app/api';  // ngrok tunnel URL
  // return 'http://10.0.2.2:5276/api';     // Android emulator localhost
  // return 'http://localhost:5276/api';    // Direct localhost (usually fails in RN)
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('API Configuration:');
console.log('__DEV__:', __DEV__);
console.log('API_BASE_URL:', API_BASE_URL);

// Store auth token for API calls
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  console.log('API: Auth token updated:', token ? 'Set' : 'Cleared');
};

// Helper function to make API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`Making API call to: ${url}`); // Debug log
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Add authentication token if available
  if (authToken) {
    // Try multiple header formats to ensure compatibility
    headers['Authorization'] = `Bearer ${authToken}`;
    headers['authorization'] = `Bearer ${authToken}`;
    headers['X-Authorization'] = `Bearer ${authToken}`;
    console.log('API: Adding auth token to request');
    console.log('API: Token length:', authToken.length);
    console.log('API: Token preview:', authToken.substring(0, 20) + '...');
    console.log('API: Full Authorization header:', headers['Authorization']);
  } else {
    console.log('API: No auth token available');
  }
  
  const config: RequestInit = {
    headers,
    ...options,
  };

  // Debug: Log the exact config being sent
  console.log('API: Request config:', {
    url,
    method: config.method || 'GET',
    headers: config.headers,
    hasAuth: !!headers['Authorization']
  });

  try {
    const response = await fetch(url, config);
    
    console.log(`Response status: ${response.status}`); // Debug log
    
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
      } catch (parseError) {
        errorData = 'Failed to parse error response';
      }
      
      // Log different error types appropriately
      if (response.status === 409) {
        // 409 Conflict is expected for duplicates, log as info rather than error
        console.log(`Conflict response (${response.status}):`, errorData);
      } else {
        // Other HTTP errors are actual errors
        console.error(`HTTP error! status: ${response.status}, body:`, errorData);
      }
      
      // Create a detailed error object for specific error cases
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Handle plain text responses (like ping endpoint)
      data = await response.text();
    }
    
    console.log(`API call successful for ${endpoint}`, data); // Debug log
    return data;
  } catch (error) {
    // Handle different error types with appropriate logging
    if ((error as any)?.status === 409) {
      // 409 Conflict is expected for duplicates, don't log as error
      console.log(`API call returned conflict for ${endpoint}:`, (error as any)?.data);
    } else {
      // Other errors are actual failures
      console.error(`API call failed for ${endpoint}:`, error);
      console.error('Full error details:', error);
    }
    throw error;
  }
};

// Receipt API calls
export const receiptApi = {
  // Get all receipts (legacy method for backward compatibility)
  getReceipts: async () => {
    return apiCall('/Receipt');
  },
  
  // Get receipts with pagination
  getReceiptsPaginated: async (paginationParams: { page: number; pageSize: number; searchTerm?: string }) => {
    const queryParams = new URLSearchParams({
      page: paginationParams.page.toString(),
      pageSize: paginationParams.pageSize.toString(),
    });
    
    if (paginationParams.searchTerm && paginationParams.searchTerm.trim()) {
      queryParams.append('searchTerm', paginationParams.searchTerm.trim());
    }
    
    const url = `/Receipt?${queryParams.toString()}`;
    console.log('Receipts API call URL:', url);
    
    return apiCall(url);
  },
  
  // Get receipt by ID
  getReceiptById: async (id: number) => {
    return apiCall(`/Receipt/${id}`);
  },
  
  // Create new receipt
  createReceipt: async (receiptData: any) => {
    return apiCall('/Receipt', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  },

  // Delete receipt
  deleteReceipt: async (id: number) => {
    return apiCall(`/Receipt/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Add item to receipt
  addItemToReceipt: async (receiptId: number, itemData: { name: string; price: number; quantity?: number }) => {
    return apiCall(`/Receipt/${receiptId}/items`, {
      method: 'POST',
      body: JSON.stringify({
        Name: itemData.name,
        Price: itemData.price,
        Quantity: itemData.quantity || 1,
      }),
    });
  },
  
  // Assign friends to whole item (when split equally is chosen)
  assignFriendsToWholeItem: async (assignmentData: {
    receiptId: number;
    itemId: number;
    friendNames: string[];
  }) => {
    return apiCall('/Receipt/assign-friends-to-whole-item', {
      method: 'POST',
      body: JSON.stringify({
        receiptId: assignmentData.receiptId,
        itemId: assignmentData.itemId,
        friendNames: assignmentData.friendNames,
      }),
    });
  },
  
  // Assign friends to sub items (when assigning to individual units)
  assignFriendsToItems: async (assignmentData: {
    receiptId: number;
    itemAssignments: Array<{
      itemId: number;
      friendNames: string[];
    }>;
  }) => {
    return apiCall('/Receipt/assign-friends-to-items', {
      method: 'POST',
      body: JSON.stringify({
        receiptId: assignmentData.receiptId,
        itemAssignments: assignmentData.itemAssignments,
      }),
    });
  },

  // Get final amounts for each friend (with proper tax/tip distribution)
  getFinalAmounts: async (receiptId: number) => {
    return apiCall(`/FinalAmount/${receiptId}/friend-amounts`);
  },

  // Calculate change for a friend's payment
  calculateChange: async (receiptId: number, friendId: number, amountPaid: number) => {
    console.log(`API call: /FinalAmount/${receiptId}/${friendId}/CalculateChange with amount: ${amountPaid}`);
    // Backend expects paidAmount as query parameter since it's not in route template
    return apiCall(`/FinalAmount/${receiptId}/${friendId}/CalculateChange?paidAmount=${amountPaid}`, {
      method: 'POST',
    });
  },

  // Get friends for a specific receipt
  getReceiptFriends: async (receiptId: number) => {
    return apiCall(`/Receipt/${receiptId}/friends`);
  },

  // Assign friends directly to receipt
  assignFriendsToReceipt: async (receiptId: number, assignmentData: { friendNames: string[] }) => {
    return apiCall(`/Receipt/${receiptId}/friends`, {
      method: 'POST',
      body: JSON.stringify({
        friendNames: assignmentData.friendNames,
      }),
    });
  },
};

// Friends API calls
export const friendsApi = {
  // Get all friends (legacy method for backward compatibility)
  getFriends: async () => {
    return apiCall('/Friends');
  },
  
  // Get friends with pagination
  getFriendsPaginated: async (paginationParams: { page: number; pageSize: number; searchTerm?: string }) => {
    const queryParams = new URLSearchParams({
      page: paginationParams.page.toString(),
      pageSize: paginationParams.pageSize.toString(),
    });
    
    if (paginationParams.searchTerm && paginationParams.searchTerm.trim()) {
      queryParams.append('searchTerm', paginationParams.searchTerm.trim());
    }
    
    const url = `/Friends?${queryParams.toString()}`;
    console.log('Friends API call URL:', url);
    
    return apiCall(url);
  },
  
  // Get friend by ID
  getFriendById: async (id: number) => {
    return apiCall(`/Friends/${id}`);
  },
  
  // Create new friend
  createFriend: async (name: string) => {
    return apiCall('/Friends', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  
  // Edit friend
  editFriend: async (id: number, name: string) => {
    return apiCall(`/Friends/edit-friend/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },
  
  // Delete friend
  deleteFriend: async (id: number) => {
    return apiCall(`/Friends/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Get current user's total paid amount
  getCurrentUserTotalPaid: async () => {
    return apiCall('/Friends/me/total-paid');
  },
  
  // Get amounts a specific friend paid for each of their receipts
  getFriendReceiptAmounts: async (friendId: number) => {
    return apiCall(`/Friends/${friendId}/receipt-amounts`);
  },
};

// Test API calls
export const testApi = {
  // Test basic connectivity
  ping: async () => {
    return apiCall('/Test/ping');
  },
  
  // Test with detailed response
  test: async () => {
    return apiCall('/Test');
  },

  // Debug data to see what's in database
  debugData: async () => {
    return apiCall('/Test/debug-data');
  },

  // Log headers to see what's being sent
  logHeaders: async () => {
    return apiCall('/Test/log-headers');
  },
};

// Export both APIs for convenience
export const api = {
  receipts: receiptApi,
  friends: friendsApi,
  test: testApi,
};

export default api;