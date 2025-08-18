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
