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
            if (receipt.TaxType == "percentage")
            {
                // Use the tax percentage directly
                taxPercentage = receipt.Tax;
            }
            else
            {
                // Calculate tax percentage from amount
                var totalItemAmount = friendAmounts.Values.Sum();
                if (totalItemAmount > 0)
                {
                    taxPercentage = ((double)receipt.Tax / (double)totalItemAmount) * 100.0;
                }
            }

            // Apply tax to each friend's amount
            foreach (var friendId in friendAmounts.Keys.ToList())
            {
                var itemAmount = friendAmounts[friendId];
                var taxAmount = itemAmount * (decimal)(taxPercentage / 100.0);
                friendAmounts[friendId] = itemAmount + taxAmount;
            }

            // Add tips, split equally among all friends on the receipt
            var allFriendIds = receipt.Friends.Select(f => f.Id).ToList();
            var totalTips = (decimal)receipt.Tips;
            var friendCount = allFriendIds.Count;
            var tipsPerFriend = friendCount > 0 ? totalTips / friendCount : 0;

            foreach (var friendId in allFriendIds)
            {
                if (!friendAmounts.ContainsKey(friendId))
                {
                    friendAmounts[friendId] = 0;
                    friendNames[friendId] = receipt.Friends.First(f => f.Id == friendId).Name ?? string.Empty;
                }
                friendAmounts[friendId] += tipsPerFriend;
            }

            var result = friendAmounts.Select(kvp => new FriendWithAmountDto
            {
                Id = kvp.Key,
                Name = friendNames[kvp.Key],
                AmountToPay = kvp.Value
            }).ToList();

            // Ensure the sum matches the receipt total (allow for small rounding error)
            var totalCalculated = result.Sum(f => f.AmountToPay ?? 0);
            var receiptTotal = (decimal)receipt.Total;
            const decimal tolerance = 3.00m; // $3.00 tolerance

            if (Math.Abs(totalCalculated - receiptTotal) > tolerance)
            {
                return BadRequest(new
                {
                    Message = "The sum of all friends' amounts does not match the receipt total within acceptable tolerance",
                    CalculatedTotal = totalCalculated,
                    ReceiptTotal = receiptTotal,
                    Difference = Math.Abs(totalCalculated - receiptTotal),
                    Tolerance = tolerance,
                    TaxPercentage = taxPercentage,
                    AcceptableRange = new
                    {
                        Minimum = receiptTotal - tolerance,
                        Maximum = receiptTotal + tolerance
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
