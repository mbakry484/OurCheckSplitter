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

            var friend = new Friend
            {
                Name = dto.Name,
                UserId = user.Id
            };
            _context.Friends.Add(friend);
            await _context.SaveChangesAsync();

            // Return a safe DTO
            var friendDto = new FriendDto
            {
                Id = friend.Id,
                Name = friend.Name ?? string.Empty,
                Receipts = new List<ReceiptSummaryDto>()
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
                    
                    allFriendDtos.Add(new FriendDto
                    {
                        Id = nonPagedCurrentUserFriend.Id,
                        Name = $"{nonPagedCurrentUserFriend.Name} (You)",
                        Receipts = receipts
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
                    allFriendDtos.Add(new FriendDto
                    {
                        Id = friend.Id,
                        Name = friend.Name ?? string.Empty,
                        Receipts = receipts
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
                
                // Add (You) label if this is the current user
                var displayName = (friend.Name != null && friend.Name.ToLower() == currentUserName.ToLower()) 
                    ? $"{friend.Name} (You)" 
                    : friend.Name ?? string.Empty;
                
                friendDtos.Add(new FriendDto
                {
                    Id = friend.Id,
                    Name = displayName,
                    Receipts = receipts
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
            var dto = new FriendDto { Name = friend.Name ?? string.Empty, Receipts = receipts };
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
    }
}
