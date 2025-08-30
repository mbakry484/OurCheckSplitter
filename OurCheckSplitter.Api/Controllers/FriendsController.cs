using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Swashbuckle.AspNetCore.Annotations;

namespace OurCheckSplitter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendsController : ControllerBase
    {
        private readonly OurCheckSplitterContext _context;

        public FriendsController(OurCheckSplitterContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateFriend([FromBody] CreateFriendDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Name is required");
            }

            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            // Check if a friend with this name already exists for this user (case-insensitive)
            var existingFriend = await _context.Friends
                .FirstOrDefaultAsync(f => f.UserId == user.Id && 
                                         f.Name != null && 
                                         f.Name.ToLower() == dto.Name.Trim().ToLower());

            if (existingFriend != null)
            {
                return Conflict($"A friend named '{dto.Name.Trim()}' already exists in your friends list.");
            }

            var friend = new Friend
            {
                Name = dto.Name.Trim(),
                UserId = user.Id
            };
            _context.Friends.Add(friend);
            await _context.SaveChangesAsync();

            // Return a safe DTO
            var friendDto = new FriendDto
            {
                Id = friend.Id,
                Name = friend.Name ?? string.Empty,
                Receipts = new List<ReceiptSummaryDto>(),
                TotalPaidAmount = 0
            };
            return Ok(friendDto);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllFriends(
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] string? searchTerm = null)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            // Debug logging
            Console.WriteLine($"Friends query parameters - Page: {page}, PageSize: {pageSize}, SearchTerm: '{searchTerm}'");

            // Check if pagination parameters are provided
            bool usePagination = page.HasValue && pageSize.HasValue && page > 0 && pageSize > 0;
            Console.WriteLine($"Friends using pagination: {usePagination}");

            // If no pagination parameters, return all friends (backward compatibility)
            if (!usePagination)
            {
                var allFriends = await _context.Friends.Where(f => f.UserId == user.Id).ToListAsync();
                var allFriendDtos = new List<FriendDto>();
                
                // Extract user's name from DisplayName or Email
                var nonPagedCurrentUserName = (user.DisplayName != null && user.DisplayName != "User") 
                    ? user.DisplayName.Split('@')[0] 
                    : user.Email.Split('@')[0];
                
                // Find current user's friend entry
                var nonPagedCurrentUserFriend = allFriends.FirstOrDefault(f => 
                    f.Name?.Equals(nonPagedCurrentUserName, StringComparison.OrdinalIgnoreCase) == true);
                
                // If current user is not found as a friend, create them automatically
                if (nonPagedCurrentUserFriend == null)
                {
                    nonPagedCurrentUserFriend = new Friend
                    {
                        Name = nonPagedCurrentUserName,
                        UserId = user.Id
                    };
                    _context.Friends.Add(nonPagedCurrentUserFriend);
                    await _context.SaveChangesAsync();
                    
                    // Add to the list for processing
                    allFriends.Add(nonPagedCurrentUserFriend);
                }
                
                // Process current user first if found
                if (nonPagedCurrentUserFriend != null)
                {
                    var receipts = await _context.Receipts
                        .Where(r => r.UserId == user.Id && r.Items.Any(i => i.Assignments.Any(a => a.FriendAssignments.Any(fa => fa.FriendId == nonPagedCurrentUserFriend.Id))))
                        .Select(r => new ReceiptSummaryDto
                        {
                            Id = r.Id,
                            Name = r.Name,
                            Total = r.Total
                        }).ToListAsync();

                    // Calculate the total amount this friend actually paid across all receipts
                    decimal totalPaidAmount = 0;
                    foreach (var receipt in receipts)
                    {
                        var friendAmount = await CalculateFriendAmountForReceipt(receipt.Id, nonPagedCurrentUserFriend.Id);
                        totalPaidAmount += friendAmount;
                    }
                    
                    allFriendDtos.Add(new FriendDto
                    {
                        Id = nonPagedCurrentUserFriend.Id,
                        Name = nonPagedCurrentUserFriend.Name ?? string.Empty,
                        Receipts = receipts,
                        TotalPaidAmount = totalPaidAmount
                    });
                    
                    // Remove current user from the list to avoid duplication
                    allFriends = allFriends.Where(f => f.Id != nonPagedCurrentUserFriend.Id).ToList();
                }
                
                // Process remaining friends
                foreach (var friend in allFriends)
                {
                    // Find all receipts where this friend is assigned to any item assignment
                    var receipts = await _context.Receipts
                        .Where(r => r.UserId == user.Id && r.Items.Any(i => i.Assignments.Any(a => a.FriendAssignments.Any(fa => fa.FriendId == friend.Id))))
                        .Select(r => new ReceiptSummaryDto
                        {
                            Id = r.Id,
                            Name = r.Name,
                            Total = r.Total
                        }).ToListAsync();

                    // Calculate the total amount this friend actually paid across all receipts
                    decimal totalPaidAmount = 0;
                    foreach (var receipt in receipts)
                    {
                        var friendAmount = await CalculateFriendAmountForReceipt(receipt.Id, friend.Id);
                        totalPaidAmount += friendAmount;
                    }

                    allFriendDtos.Add(new FriendDto
                    {
                        Id = friend.Id,
                        Name = friend.Name ?? string.Empty,
                        Receipts = receipts,
                        TotalPaidAmount = totalPaidAmount
                    });
                }
                return Ok(allFriendDtos);
            }

            // Extract user's name from DisplayName or Email
            var currentUserName = (user.DisplayName != null && user.DisplayName != "User") 
                ? user.DisplayName.Split('@')[0] 
                : user.Email.Split('@')[0];
            
            // Build query with search filtering
            var query = _context.Friends
                .Where(f => f.UserId == user.Id)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchTermLower = searchTerm.ToLower();
                Console.WriteLine($"Applying friends search filter for: '{searchTermLower}'");
                query = query.Where(f => f.Name != null && f.Name.ToLower().Contains(searchTermLower));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();
            Console.WriteLine($"Friends total count after filtering: {totalCount}");

            // Find current user's friend entry first
            var currentUserFriend = await query
                .FirstOrDefaultAsync(f => f.Name != null && f.Name.ToLower() == currentUserName.ToLower());
            
            // If current user is not found as a friend, create them automatically
            if (currentUserFriend == null)
            {
                currentUserFriend = new Friend
                {
                    Name = currentUserName,
                    UserId = user.Id
                };
                _context.Friends.Add(currentUserFriend);
                await _context.SaveChangesAsync();
                
                // Refresh the query to include the new friend
                query = _context.Friends.Where(f => f.UserId == user.Id).AsQueryable();
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var searchTermLower = searchTerm.ToLower();
                    query = query.Where(f => f.Name != null && f.Name.ToLower().Contains(searchTermLower));
                }
            }

            // Apply custom ordering: current user first, then alphabetical
            var friends = await query
                .OrderBy(f => f.Name != null && f.Name.ToLower() == currentUserName.ToLower() ? 0 : 1) // Current user first
                .ThenBy(f => f.Name) // Then alphabetically
                .Skip((page!.Value - 1) * pageSize!.Value)
                .Take(pageSize.Value)
                .ToListAsync();

            var friendDtos = new List<FriendDto>();
            foreach (var friend in friends)
            {
                // Find all receipts where this friend is assigned to any item assignment
                var receipts = await _context.Receipts
                    .Where(r => r.UserId == user.Id && r.Items.Any(i => i.Assignments.Any(a => a.FriendAssignments.Any(fa => fa.FriendId == friend.Id))))
                    .Select(r => new ReceiptSummaryDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        Total = r.Total
                    }).ToListAsync();

                // Calculate the total amount this friend actually paid across all receipts
                decimal totalPaidAmount = 0;
                foreach (var receipt in receipts)
                {
                    var friendAmount = await CalculateFriendAmountForReceipt(receipt.Id, friend.Id);
                    totalPaidAmount += friendAmount;
                }
                
                friendDtos.Add(new FriendDto
                {
                    Id = friend.Id,
                    Name = friend.Name ?? string.Empty,
                    Receipts = receipts,
                    TotalPaidAmount = totalPaidAmount
                });
            }

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize!.Value);

            var paginatedResponse = new PaginatedResponseDto<FriendDto>
            {
                Items = friendDtos,
                TotalCount = totalCount,
                TotalPages = totalPages,
                CurrentPage = page!.Value,
                PageSize = pageSize.Value,
                HasNextPage = page.Value < totalPages,
                HasPreviousPage = page.Value > 1
            };

            Console.WriteLine($"Returning {friendDtos.Count} friends, page {page.Value} of {totalPages}");

            return Ok(paginatedResponse);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFriendById(int id)
        {
            var friend = await _context.Friends.FindAsync(id);
            if (friend == null)
                return NotFound("Friend not found");
            var receipts = await _context.Receipts
                .Where(r => r.Items.Any(i => i.Assignments.Any(a => a.FriendAssignments.Any(fa => fa.FriendId == friend.Id))))
                .Select(r => new ReceiptSummaryDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Total = r.Total
                }).ToListAsync();

            // Calculate the total amount this friend actually paid across all receipts
            decimal totalPaidAmount = 0;
            foreach (var receipt in receipts)
            {
                var friendAmount = await CalculateFriendAmountForReceipt(receipt.Id, friend.Id);
                totalPaidAmount += friendAmount;
            }

            var dto = new FriendDto { 
                Name = friend.Name ?? string.Empty, 
                Receipts = receipts,
                TotalPaidAmount = totalPaidAmount
            };
            return Ok(dto);
        }

        [HttpPut("edit-friend/{id}")]
        public async Task<IActionResult> EditFriend(int id, [FromBody] CreateFriendDto dto)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var friend = await _context.Friends.FirstOrDefaultAsync(f => f.Id == id && f.UserId == user.Id);
            if (friend == null)
                return NotFound("Friend not found");
            if (!string.IsNullOrWhiteSpace(dto.Name))
                friend.Name = dto.Name;
            await _context.SaveChangesAsync();
            return Ok(friend);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFriend(int id)
        {
            var TargetFriend = await _context.Friends.FindAsync(id);
            if (TargetFriend == null)
            {
                return BadRequest("No Friend Found");
            }
            _context.Friends.Remove(TargetFriend);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("me")]
        [SwaggerOperation(Summary = "Get the current authenticated user's info.",
            Description = "Requires a valid Firebase ID token in the Authorization header as 'Bearer <token>'.")]
        [SwaggerResponse(200, "Returns the authenticated user's info.")]
        [SwaggerResponse(401, "Unauthorized - missing or invalid token.")]
        public IActionResult GetCurrentUser()
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();
            return Ok(new { user.Id, user.Email, user.DisplayName, user.ProfilePictureUrl });
        }

        [HttpGet("me/total-paid")]
        [SwaggerOperation(Summary = "Get the total amount the current user has paid across all receipts.",
            Description = "Calculates the actual amount based on item assignments, taxes, and tips.")]
        [SwaggerResponse(200, "Returns the total amount paid by the current user.")]
        [SwaggerResponse(401, "Unauthorized - missing or invalid token.")]
        public async Task<IActionResult> GetCurrentUserTotalPaid()
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            // Extract user's name from DisplayName or Email
            var currentUserName = (user.DisplayName != null && user.DisplayName != "User") 
                ? user.DisplayName.Split('@')[0] 
                : user.Email.Split('@')[0];

            // Find the current user's friend entry
            var currentUserFriend = await _context.Friends
                .FirstOrDefaultAsync(f => f.UserId == user.Id && f.Name != null && f.Name.ToLower() == currentUserName.ToLower());

            decimal totalPaidAmount = 0;

            if (currentUserFriend != null)
            {
                // Find all receipts where this user is assigned to any item assignment
                var receipts = await _context.Receipts
                    .Where(r => r.UserId == user.Id && r.Items.Any(i => i.Assignments.Any(a => a.FriendAssignments.Any(fa => fa.FriendId == currentUserFriend.Id))))
                    .Select(r => new { r.Id })
                    .ToListAsync();

                // Calculate the total amount this user actually paid across all receipts
                foreach (var receipt in receipts)
                {
                    var friendAmount = await CalculateFriendAmountForReceipt(receipt.Id, currentUserFriend.Id);
                    totalPaidAmount += friendAmount;
                }
            }

            return Ok(new { TotalPaidAmount = totalPaidAmount });
        }

        [HttpGet("{friendId}/receipt-amounts")]
        [SwaggerOperation(Summary = "Get the amount a specific friend paid for each of their receipts.",
            Description = "Returns a list of receipts with the calculated amount the friend should pay for each.")]
        [SwaggerResponse(200, "Returns the friend's receipts with their calculated amounts.")]
        [SwaggerResponse(401, "Unauthorized - missing or invalid token.")]
        [SwaggerResponse(404, "Friend not found.")]
        public async Task<IActionResult> GetFriendReceiptAmounts(int friendId)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            // Find the friend
            var friend = await _context.Friends
                .FirstOrDefaultAsync(f => f.Id == friendId && f.UserId == user.Id);

            if (friend == null)
                return NotFound("Friend not found");

            // Find all receipts where this friend is assigned to any item assignment
            var receipts = await _context.Receipts
                .Where(r => r.UserId == user.Id && r.Items.Any(i => i.Assignments.Any(a => a.FriendAssignments.Any(fa => fa.FriendId == friendId))))
                .Select(r => new { r.Id, r.Name, r.Total, r.CreatedDate })
                .ToListAsync();

            var receiptAmounts = new List<object>();

            // Calculate the amount for each receipt
            foreach (var receipt in receipts)
            {
                var friendAmount = await CalculateFriendAmountForReceipt(receipt.Id, friendId);
                
                receiptAmounts.Add(new
                {
                    ReceiptId = receipt.Id,
                    ReceiptName = receipt.Name,
                    ReceiptTotal = receipt.Total,
                    FriendPaidAmount = friendAmount,
                    CreatedDate = receipt.CreatedDate
                });
            }

            return Ok(receiptAmounts);
        }

        /// <summary>
        /// Helper method to calculate the amount a specific friend should pay for a specific receipt
        /// </summary>
        private async Task<decimal> CalculateFriendAmountForReceipt(int receiptId, int friendId)
        {
            try
            {
                var receipt = await _context.Receipts
                    .Include(r => r.FriendReceipts)
                    .ThenInclude(fr => fr.Friend)
                    .Include(r => r.Items)
                        .ThenInclude(i => i.Assignments)
                            .ThenInclude(a => a.FriendAssignments)
                                .ThenInclude(fa => fa.Friend)
                    .FirstOrDefaultAsync(r => r.Id == receiptId);

                if (receipt == null)
                    return 0;

                // Check if this friend is assigned to any items in this receipt
                var isAssignedToAnyItem = receipt.Items
                    .Any(item => item.Assignments
                        .Any(assignment => assignment.FriendAssignments
                            .Any(fa => fa.FriendId == friendId)));

                if (!isAssignedToAnyItem)
                    return 0;

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

                // If the friend is not in the calculation, return 0
                if (!friendAmounts.ContainsKey(friendId))
                    return 0;

                // Calculate tax percentage to apply to each friend
                double taxPercentage = 0;
                decimal totalItemAmount = friendAmounts.Values.Sum();
                decimal totalTips = (decimal)receipt.Tips;
                var friendCount = receipt.FriendReceipts?.Count ?? 0;
                bool tipsIncluded = receipt.TipsIncludedInTotal;
                decimal subtotal;
                
                if (tipsIncluded)
                {
                    subtotal = (decimal)receipt.Total - (decimal)receipt.Tax - totalTips;
                }
                else
                {
                    subtotal = (decimal)receipt.Total - (decimal)receipt.Tax;
                }

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

                // Apply tax to this friend's amount
                var itemAmount = friendAmounts[friendId];
                var taxAmount = itemAmount * (decimal)(taxPercentage / 100.0);
                var friendAmountWithTax = itemAmount + taxAmount;

                // Add tips if friend is part of the receipt
                if (friendCount > 0)
                {
                    var tipsPerFriend = totalTips / friendCount;
                    friendAmountWithTax += tipsPerFriend;
                }

                return Math.Round(friendAmountWithTax, 2);
            }
            catch
            {
                // If any error occurs, return 0
                return 0;
            }
        }
    }
}
