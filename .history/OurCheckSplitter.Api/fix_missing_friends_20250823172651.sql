-- Check current FriendReceipt relationships
SELECT 'Current FriendReceipt relationships:' as info;
SELECT COUNT(*) as total_friend_receipts FROM FriendReceipts;

-- Check which receipts have friends assigned to items but no FriendReceipt relationships
SELECT 'Receipts with assigned friends but no FriendReceipt relationships:' as info;
SELECT DISTINCT ia.ReceiptId, r.Name as ReceiptName, COUNT(DISTINCT fa.FriendId) as AssignedFriends
FROM ItemAssignments ia
INNER JOIN FriendAssignments fa ON ia.Id = fa.ItemAssignmentId
INNER JOIN Receipts r ON ia.ReceiptId = r.Id
WHERE NOT EXISTS (
    SELECT 1 FROM FriendReceipts fr 
    WHERE fr.ReceiptId = ia.ReceiptId
)
GROUP BY ia.ReceiptId, r.Name;

-- Fix missing FriendReceipt relationships
INSERT INTO FriendReceipts (FriendId, ReceiptId)
SELECT DISTINCT fa.FriendId, ia.ReceiptId
FROM FriendAssignments fa
INNER JOIN ItemAssignments ia ON fa.ItemAssignmentId = ia.Id
WHERE NOT EXISTS (
    SELECT 1 FROM FriendReceipts fr 
    WHERE fr.FriendId = fa.FriendId AND fr.ReceiptId = ia.ReceiptId
);

-- Check results after fix
SELECT 'FriendReceipt relationships after fix:' as info;
SELECT COUNT(*) as total_friend_receipts FROM FriendReceipts;

-- Show all FriendReceipt relationships
SELECT 'All FriendReceipt relationships:' as info;
SELECT fr.ReceiptId, r.Name as ReceiptName, fr.FriendId, f.Name as FriendName
FROM FriendReceipts fr
INNER JOIN Receipts r ON fr.ReceiptId = r.Id
INNER JOIN Friends f ON fr.FriendId = f.Id
ORDER BY fr.ReceiptId, f.Name;
