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

            // For each assignment, add the assignment price to each assigned friend's total
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

            // Add tax and tips, split equally among all friends on the receipt
            var allFriendIds = receipt.Friends.Select(f => f.Id).ToList();
            var totalTax = (decimal)receipt.Tax;
            var totalTips = (decimal)receipt.Tips;
            var friendCount = allFriendIds.Count;
            var taxPerFriend = friendCount > 0 ? totalTax / friendCount : 0;
            var tipsPerFriend = friendCount > 0 ? totalTips / friendCount : 0;
            foreach (var friendId in allFriendIds)
            {
                if (!friendAmounts.ContainsKey(friendId))
                {
                    friendAmounts[friendId] = 0;
                    friendNames[friendId] = receipt.Friends.First(f => f.Id == friendId).Name ?? string.Empty;
                }
                friendAmounts[friendId] += taxPerFriend + tipsPerFriend;
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
            if (Math.Abs(totalCalculated - receiptTotal) > 0.01m)
            {
                return BadRequest($"The sum of all friends' amounts ({totalCalculated}) does not match the receipt total ({receiptTotal}). Please check the item, tax, and tip assignments.");
            }

            return Ok(result);
        }



        [HttpPost("{receiptId}/{friendId}/CalculateChange")]
        
    }
}
