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
  detailedReceipts: any;
  id: string;
  name: string;
  avatar: string;
  receipts: string[];
  totalPaid: number;
}

// Utility function to convert API response to HomeScreen format
export const convertReceiptToHomeFormat = (apiReceipt: ReceiptResponseDto): HomeScreenReceipt => {
  return {
    id: apiReceipt.id.toString(),
    title: apiReceipt.name,
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    totalAmount: apiReceipt.total,
    userPaidAmount: apiReceipt.total, // Will need to calculate actual user amount later
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