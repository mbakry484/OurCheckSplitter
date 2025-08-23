-- Check current table structure
PRAGMA table_info(Receipts);

-- Check if TaxType column exists and its properties
SELECT sql FROM sqlite_master WHERE type='table' AND name='Receipts';

-- Check current data in Receipts table
SELECT Id, Name, Tax, TaxType, Tips, TipsIncludedInTotal, Total FROM Receipts LIMIT 5;

-- If TaxType column doesn't exist or is not nullable, add it
-- (This will be run manually if needed)
-- ALTER TABLE Receipts ADD COLUMN TaxType TEXT;

-- If TipsIncludedInTotal column doesn't exist, add it
-- (This will be run manually if needed)
-- ALTER TABLE Receipts ADD COLUMN TipsIncludedInTotal INTEGER DEFAULT 1;

-- Fix the Friend.ReceiptId relationships based on actual assignments
-- This script updates the direct relationship between Friends and Receipts
-- based on the existing ItemAssignment -> FriendAssignment -> Friend relationships

-- First, clear all existing ReceiptId values to start fresh
UPDATE Friends SET ReceiptId = NULL;

-- Update Friend.ReceiptId based on their assignments to items in receipts
UPDATE Friends 
SET ReceiptId = (
    SELECT DISTINCT ia.ReceiptId 
    FROM ItemAssignments ia
    INNER JOIN FriendAssignments fa ON ia.Id = fa.ItemAssignmentId
    WHERE fa.FriendId = Friends.Id
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM ItemAssignments ia
    INNER JOIN FriendAssignments fa ON ia.Id = fa.ItemAssignmentId
    WHERE fa.FriendId = Friends.Id
);

-- For friends assigned to multiple receipts, we'll keep the first one
-- (this is a limitation of the current design - one friend can only be directly linked to one receipt)
