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
  createdDate: string;
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

// Receipt item for detailed view
export interface ReceiptItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  assignedFriends: string[];
}

// Friend amount for detailed view
export interface FriendAmount {
  id: number;
  name: string;
  amountToPay: number;
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
  items?: ReceiptItem[];
  friendAmounts?: FriendAmount[];
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
  
  // Format the date to be user-friendly
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'Today';
      } else if (diffDays === 2) {
        return 'Yesterday';
      } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Recently added';
    }
  };
  
  // Debug logging
  console.log(`Converting receipt ${apiReceipt.id}: friends =`, JSON.stringify(apiReceipt.friends, null, 2));
  
  const participants = (apiReceipt.friends || []).map(f => f.name);
  console.log(`Receipt ${apiReceipt.id}: participants =`, participants);
  
  return {
    id: apiReceipt.id.toString(),
    title: apiReceipt.name || 'Unnamed Receipt',
    date: formatDate(apiReceipt.createdDate),
    totalAmount: apiReceipt.total,
    userPaidAmount: userPaidAmount,
    type: 'paid',
    participants: participants,
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