// API Response Types - matching the .NET API DTOs

export interface FriendResponseDto {
  id: number;
  name: string;
}

export interface ItemAssignmentResponseDto {
  id: number;
  unitlabel: string;
  price: number;
  quantity: number;
  assignedFriends: FriendResponseDto[];
}

export interface ItemResponseDto {
  id: number;
  name: string;
  quantity: number;
  price: number;
  assignments: ItemAssignmentResponseDto[];
}

export interface ReceiptResponseDto {
  id: number;
  name: string;
  tax: number;
  taxType?: string;
  tips: number;
  total: number;
  tipsIncludedInTotal?: boolean;
  friends: FriendResponseDto[];
  items: ItemResponseDto[];
}

export interface ReceiptSummaryDto {
  id: number;
  name: string;
  total: number;
}

export interface FriendDto {
  id: number;
  name: string;
  receipts: ReceiptSummaryDto[];
}

// Request DTOs
export interface CreateFriendDto {
  name: string;
}

export interface ReceiptDto {
  name: string;
  tax: number;
  taxType?: string;
  tips: number;
  total: number;
  tipsIncludedInTotal?: boolean;
}

// Pagination DTOs
export interface PaginationRequestDto {
  page: number;
  pageSize: number;
  searchTerm?: string;
}

export interface PaginatedResponseDto<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// For HomeScreen compatibility
export interface HomeScreenReceipt {
  id: string;
  title: string;
  date: string;
  totalAmount: number;
  userPaidAmount: number;
  type: 'paid';
  participants: string[];
}

export interface HomeScreenFriend {
  id: string;
  name: string;
  avatar: string;
  receipts: string[];
  totalPaid: number;
}

// Utility function to convert API response to HomeScreen format
export const convertReceiptToHomeFormat = (apiReceipt: ReceiptResponseDto): HomeScreenReceipt => {
  // Calculate user's paid amount based on assignments
  // For now, we'll use a simple approximation - if there are items and assignments, 
  // calculate based on assignments, otherwise assume user paid the full amount
  let userPaidAmount = apiReceipt.total;
  
  if (apiReceipt.items && apiReceipt.items.length > 0) {
    // Sum up all assignments that don't include the current user (we don't have user context here)
    // For simplicity, we'll show the total for now
    userPaidAmount = apiReceipt.total;
  }
  
  return {
    id: apiReceipt.id.toString(),
    title: apiReceipt.name || 'Unnamed Receipt',
    date: 'Recently added', // Since there's no date field in the API
    totalAmount: apiReceipt.total,
    userPaidAmount: userPaidAmount,
    type: 'paid',
    participants: apiReceipt.friends.map(f => f.name),
  };
};

export const convertFriendToHomeFormat = (apiFriend: FriendDto): HomeScreenFriend => {
  // Generate a simple avatar based on first letter
  const avatar = apiFriend.name.charAt(0).toUpperCase() === 'A' ? '👨' :
                 apiFriend.name.charAt(0).toUpperCase() === 'E' ? '👩‍🦰' :
                 apiFriend.name.charAt(0).toUpperCase() === 'S' ? '👩' :
                 apiFriend.name.charAt(0).toUpperCase() === 'M' ? '👨‍💼' :
                 apiFriend.name.charAt(0).toUpperCase() === 'J' ? '👨' : '👤';
  
  return {
    id: apiFriend.id.toString(),
    name: apiFriend.name,
    avatar: avatar,
    receipts: apiFriend.receipts.map(r => r.name),
    totalPaid: apiFriend.receipts.reduce((sum, receipt) => sum + receipt.total, 0),
  };
};