using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.DTOs;

namespace OurCheckSplitter.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FinalAmountController : ControllerBase
    {
        private readonly OurCheckSplitterContext _context;
        private readonly IMapper _mapper;

        public FinalAmountController(OurCheckSplitterContext context, IMapper mapper)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }


        [HttpGet("{receiptId}/friend-amounts")]
        public async Task<IActionResult> GetFriendAmounts(int receiptId)
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
                return NotFound($"Receipt with ID {receiptId} not found");
            }

            var friendAmounts = new Dictionary<int, decimal>();
            var friendNames = new Dictionary<int, string>();

            // Calculate each friend's item amounts
            foreach (var item in receipt.Items)
            {
                foreach (var assignment in item.Assignments)
                {
                    var assignedFriends = assignment.FriendAssignments.Select(fa => fa.Friend).ToList();
                    foreach (var friend in assignedFriends)
                    {
                        if (!friendAmounts.ContainsKey(friend.Id))
                        {
                            friendAmounts[friend.Id] = 0;
                            friendNames[friend.Id] = friend.Name ?? string.Empty;
                        }
                        friendAmounts[friend.Id] += assignment.Price;
                    }
                }
            }

            // Calculate tax percentage to apply to each friend
            double taxPercentage = 0;
            decimal totalItemAmount = friendAmounts.Values.Sum();
            decimal totalTips = (decimal)receipt.Tips;
            var friendCount = receipt.Friends.Count;
            bool tipsIncluded = receipt.TipsIncludedInTotal;
            decimal subtotal;

            // Calculate subtotal: always subtract tax from total
            // Tips will be handled separately based on tipsIncludedInTotal flag
            subtotal = (decimal)receipt.Total - (decimal)receipt.Tax;

            if (receipt.TaxType == "percentage")
            {
                taxPercentage = receipt.Tax;
            }
            else
            {
                if (subtotal > 0)
                {
                    taxPercentage = ((double)receipt.Tax / (double)subtotal) * 100.0;
                }
            }

            // Apply tax to each friend's amount
            foreach (var friendId in friendAmounts.Keys.ToList())
            {
                var itemAmount = friendAmounts[friendId];
                var taxAmount = itemAmount * (decimal)(taxPercentage / 100.0);
                friendAmounts[friendId] = itemAmount + taxAmount;
            }

            // Handle tips based on tipsIncludedInTotal flag
            if (tipsIncluded && friendCount > 0)
            {
                // Tips are included in total, distribute them among friends
                var tipsPerFriend = totalTips / friendCount;
                foreach (var friendId in friendAmounts.Keys.ToList())
                {
                    friendAmounts[friendId] += tipsPerFriend;
                }
            }
            else if (!tipsIncluded && friendCount > 0)
            {
                // Tips are not included in total, but we still distribute them
                // The receipt total should match the sum of items + tips
                var tipsPerFriend = totalTips / friendCount;
                foreach (var friendId in friendAmounts.Keys.ToList())
                {
                    friendAmounts[friendId] += tipsPerFriend;
                }
            }

            // Prepare result and round each friend's amount
            var result = friendAmounts.Select(kvp => new FriendWithAmountDto
            {
                Id = kvp.Key,
                Name = friendNames[kvp.Key],
                AmountToPay = Math.Round(kvp.Value, 2)
            }).ToList();

            // Ensure the sum matches the receipt total (allow for small rounding error)
            var totalCalculated = result.Sum(f => f.AmountToPay ?? 0);
            var receiptTotal = (decimal)receipt.Total;
            const decimal tolerance = 3.00m; // $3.00 tolerance

            // When tipsIncludedInTotal is false, the receipt total should match items + tips
            // When tipsIncludedInTotal is true, the receipt total already includes tips
            var expectedTotal = tipsIncluded ? receiptTotal : receiptTotal + totalTips;

            // If the sum is off by a small amount, adjust the last friend's amount
            var diff = expectedTotal - totalCalculated;
            if (Math.Abs(diff) > 0.01m && Math.Abs(diff) <= tolerance && result.Count > 0)
            {
                result[result.Count - 1].AmountToPay += diff;
                totalCalculated = result.Sum(f => f.AmountToPay ?? 0);
            }

            if (Math.Abs(totalCalculated - expectedTotal) > tolerance)
            {
                return BadRequest(new
                {
                    Message = "The sum of all friends' amounts does not match the receipt total within acceptable tolerance",
                    CalculatedTotal = totalCalculated,
                    ReceiptTotal = expectedTotal,
                    Difference = Math.Abs(totalCalculated - expectedTotal),
                    Tolerance = tolerance,
                    TaxPercentage = taxPercentage,
                    AcceptableRange = new
                    {
                        Minimum = expectedTotal - tolerance,
                        Maximum = expectedTotal + tolerance
                    }
                });
            }

            return Ok(result);
        }



        [HttpPost("{receiptId}/{friendId}/CalculateChange")]
        public async Task<IActionResult> CalculateChange(int receiptId, int friendId, int paidAmount)
        {
            var receipt = await _context.Receipts.FindAsync(receiptId);
            if (receipt == null)
            {
                return NotFound($"Receipt with ID {receiptId} not found");
            }

            var friend = await _context.Friends.FindAsync(friendId);
            if (friend == null)
            {
                return NotFound($"Friend with ID {friendId} not found");
            }

            var friendAmountsResult = await GetFriendAmounts(receiptId);
            if (friendAmountsResult is not OkObjectResult okResult)
            {
                return BadRequest("Failed to calculate friend amounts");
            }

            var friendAmounts = okResult.Value as List<FriendWithAmountDto>;
            var friendAmount = friendAmounts?.FirstOrDefault(f => f.Id == friendId);

            if (friendAmount == null)
            {
                return NotFound($"No amount found for friend {friendId} in receipt {receiptId}");
            }

            var amountToPay = friendAmount.AmountToPay ?? 0;
            if (paidAmount < amountToPay)
            {
                return BadRequest(new
                {
                    Message = "Insufficient payment",
                    RequiredAmount = amountToPay,
                    PaidAmount = paidAmount,
                    Shortage = amountToPay - paidAmount
                });
            }

            var change = paidAmount - amountToPay;
            return Ok(new
            {
                Message = "Change calculated successfully",
                AmountToPay = amountToPay,
                PaidAmount = paidAmount,
                Change = change
            });
        }
    }
}
