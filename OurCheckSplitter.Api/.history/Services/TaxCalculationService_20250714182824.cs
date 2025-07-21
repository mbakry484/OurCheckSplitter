using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace OurCheckSplitter.Api.Services
{
    public class TaxCalculationService
    {
        private readonly OurCheckSplitterContext _context;
        private readonly ILogger<TaxCalculationService> _logger;

        public TaxCalculationService(OurCheckSplitterContext context, ILogger<TaxCalculationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<TaxSplitDto> CalculateTaxSplit(int receiptId, string splitMethod = "equal")
        {
            var receipt = await _context.Receipts
                .Include(r => r.Friends)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Assignments)
                        .ThenInclude(a => a.FriendAssignments)
                            .ThenInclude(fa => fa.Friend)
                .FirstOrDefaultAsync(r => r.Id == receiptId);

            if (receipt == null)
            {
                throw new ArgumentException($"Receipt with ID {receiptId} not found");
            }

            // Calculate subtotal from items
            var subtotal = receipt.Items.Sum(item => (double)item.Price * item.Quantity);
            
            // Calculate tax amount based on type
            double totalTax = 0;
            double taxPercentage = 0;

            if (receipt.TaxType == "percentage")
            {
                taxPercentage = receipt.Tax;
                totalTax = subtotal * (receipt.Tax / 100.0);
            }
            else
            {
                totalTax = receipt.Tax;
                taxPercentage = subtotal > 0 ? (totalTax / subtotal) * 100.0 : 0;
            }

            var taxSplit = new TaxSplitDto
            {
                ReceiptId = receiptId,
                ReceiptName = receipt.Name ?? "Receipt",
                TotalTax = totalTax,
                TaxType = receipt.TaxType,
                TaxPercentage = taxPercentage,
                Subtotal = subtotal,
                SplitMethod = splitMethod
            };

            // Calculate friend splits
            var friendSplits = new List<FriendTaxSplitDto>();

            if (splitMethod == "equal")
            {
                // Split tax equally among all friends
                var taxPerFriend = receipt.Friends.Count > 0 ? totalTax / receipt.Friends.Count : 0;
                
                foreach (var friend in receipt.Friends)
                {
                    var friendSplit = new FriendTaxSplitDto
                    {
                        FriendId = friend.Id,
                        FriendName = friend.Name ?? "Unknown",
                        ItemSubtotal = CalculateFriendItemSubtotal(receipt, friend.Id),
                        TaxAmount = taxPerFriend,
                        TaxPercentage = receipt.Friends.Count > 0 ? 100.0 / receipt.Friends.Count : 0,
                        TotalAmount = CalculateFriendItemSubtotal(receipt, friend.Id) + taxPerFriend
                    };
                    friendSplits.Add(friendSplit);
                }
            }
            else if (splitMethod == "proportional")
            {
                // Split tax proportionally based on each friend's item subtotal
                var totalItemSubtotal = receipt.Friends.Sum(f => CalculateFriendItemSubtotal(receipt, f.Id));
                
                foreach (var friend in receipt.Friends)
                {
                    var friendItemSubtotal = CalculateFriendItemSubtotal(receipt, friend.Id);
                    var taxProportion = totalItemSubtotal > 0 ? friendItemSubtotal / totalItemSubtotal : 0;
                    var friendTaxAmount = totalTax * taxProportion;
                    var friendTaxPercentage = totalItemSubtotal > 0 ? (friendTaxAmount / friendItemSubtotal) * 100.0 : 0;

                    var friendSplit = new FriendTaxSplitDto
                    {
                        FriendId = friend.Id,
                        FriendName = friend.Name ?? "Unknown",
                        ItemSubtotal = friendItemSubtotal,
                        TaxAmount = friendTaxAmount,
                        TaxPercentage = friendTaxPercentage,
                        TotalAmount = friendItemSubtotal + friendTaxAmount
                    };
                    friendSplits.Add(friendSplit);
                }
            }

            taxSplit.FriendSplits = friendSplits;
            return taxSplit;
        }

        private double CalculateFriendItemSubtotal(Receipt receipt, int friendId)
        {
            double subtotal = 0;

            foreach (var item in receipt.Items)
            {
                foreach (var assignment in item.Assignments)
                {
                    var isAssignedToFriend = assignment.FriendAssignments.Any(fa => fa.FriendId == friendId);
                    if (isAssignedToFriend)
                    {
                        subtotal += (double)assignment.Price * assignment.Quantity;
                    }
                }
            }

            return subtotal;
        }

        public async Task<double> CalculateSubtotal(int receiptId)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == receiptId);

            if (receipt == null)
            {
                throw new ArgumentException($"Receipt with ID {receiptId} not found");
            }

            return receipt.Items.Sum(item => (double)item.Price * item.Quantity);
        }

        public async Task UpdateReceiptSubtotal(int receiptId)
        {
            var receipt = await _context.Receipts.FindAsync(receiptId);
            if (receipt == null)
            {
                throw new ArgumentException($"Receipt with ID {receiptId} not found");
            }

            var subtotal = await CalculateSubtotal(receiptId);
            receipt.Subtotal = subtotal;
            await _context.SaveChangesAsync();
        }
    }
} 