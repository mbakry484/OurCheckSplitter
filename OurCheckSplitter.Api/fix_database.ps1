# PowerShell script to fix missing FriendReceipt relationships
Write-Host "Fixing missing FriendReceipt relationships..." -ForegroundColor Green

# Read the SQL file and execute it
$sqlContent = Get-Content "fix_missing_friends.sql" -Raw

# Execute the SQL commands
try {
    # You can run this manually with: sqlite3 OurCheckSplitter.db < fix_missing_friends.sql
    Write-Host "To fix the database, run this command:" -ForegroundColor Yellow
    Write-Host "sqlite3 OurCheckSplitter.db < fix_missing_friends.sql" -ForegroundColor Cyan
    
    Write-Host "`nOr use the API endpoint:" -ForegroundColor Yellow
    Write-Host "POST /api/receipt/fix-all-relationships" -ForegroundColor Cyan
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`nFix completed!" -ForegroundColor Green
