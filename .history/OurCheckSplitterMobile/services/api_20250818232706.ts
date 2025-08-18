// API Configuration and Base Service
// Network configuration for React Native
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com/api';
  }
  
  // Development URLs - using ngrok tunnel for mobile hotspot access
  return 'https://4b47306e3692.ngrok-free.app/api';  // ngrok tunnel URL
  
  // Fallback options if the above doesn't work:
  // return 'http://10.0.2.2:5276/api';     // Android emulator localhost
  // return 'http://localhost:5276/api';    // Direct localhost (usually fails in RN)
};

const API_BASE_URL = getApiBaseUrl();

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
    headers['Authorization'] = `Bearer ${authToken}`;
    console.log('API: Adding auth token to request');
  } else {
    console.log('API: No auth token available');
  }
  
  const config: RequestInit = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    console.log(`Response status: ${response.status}`); // Debug log
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
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
    console.error(`API call failed for ${endpoint}:`, error);
    console.error('Full error details:', error);
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
  
  // Debug receipt creation
  debugCreateReceipt: async (receiptData: any) => {
    return apiCall('/Test/debug-receipt', {
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
};

// Export both APIs for convenience
export const api = {
  receipts: receiptApi,
  friends: friendsApi,
  test: testApi,
};

export default api;