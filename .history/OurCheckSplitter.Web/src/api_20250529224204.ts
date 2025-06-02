const API_BASE = 'http://localhost:5276/api';

export async function getReceipts() {
  const res = await fetch(`${API_BASE}/Receipt`);
  if (!res.ok) throw new Error('Failed to fetch receipts');
  return res.json();
}

export async function createReceipt(data: { name?: string }) {
  const res = await fetch(`${API_BASE}/Receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create receipt');
  return res.json();
}

export async function getFriends() {
  const res = await fetch(`${API_BASE}/Friends`);
  if (!res.ok) throw new Error('Failed to fetch friends');
  return res.json();
}

export async function addFriend(data: { name: string }) {
  const res = await fetch(`${API_BASE}/Friends`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add friend');
  return res.json();
}

export async function deleteFriend(id: number) {
  const res = await fetch(`${API_BASE}/Friends?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete friend');
}

export async function addItemsToReceipt(receiptId: number, items: { name: string; price: number; quantity: number }[]) {
  const res = await fetch(`${API_BASE}/Receipt/assign-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiptId, items }),
  });
  if (!res.ok) throw new Error('Failed to add items');
  return res.json();
}

export async function assignFriendsToWholeItem(receiptId: number, itemId: number, friendNames: string[]) {
  const res = await fetch(`${API_BASE}/Receipt/assign-friends-to-whole-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiptId, itemId, friendNames }),
  });
  if (!res.ok) throw new Error('Failed to assign friends to whole item');
  return res.json();
}

export async function assignFriendsToItems(receiptId: number, itemAssignments: { itemId: number; friendNames: string[] }[]) {
  const res = await fetch(`${API_BASE}/Receipt/assign-friends-to-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiptId, itemAssignments }),
  });
  if (!res.ok) throw new Error('Failed to assign friends to items');
  return res.json();
} 