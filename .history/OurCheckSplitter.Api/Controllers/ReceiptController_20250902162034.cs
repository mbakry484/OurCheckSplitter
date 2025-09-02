using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Entities;
using System.Linq.Expressions;
using System.Runtime.InteropServices;

namespace OurCheckSplitter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReceiptController : ControllerBase
    {
        private readonly OurCheckSplitterContext _context;

        private readonly IMapper _mapper;

        public ReceiptController(OurCheckSplitterContext context, IMapper mapper)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        // Helper method to update the many-to-many relationship between friends and receipts
        private async Task UpdateFriendReceiptRelationships(int receiptId)
        {
            // Get all friends that are assigned to items in this receipt
            var friendsFromItems = await _context.FriendAssignments
                .Where(fa => fa.ItemAssignment.ReceiptId == receiptId)
                .Select(fa => fa.FriendId)
                .Distinct()
                .ToListAsync();

            // Get existing FriendReceipt relationships to preserve direct assignments
            var existingFriendReceipts = await _context.FriendReceipts
                .Where(fr => fr.ReceiptId == receiptId)
                .ToListAsync();

            var existingFriendIds = existingFriendReceipts.Select(fr => fr.FriendId).Distinct().ToList();

            // Remove only the FriendReceipt relationships for friends that are no longer assigned to items
            var friendsToRemove = existingFriendIds.Except(friendsFromItems).ToList();
            var friendReceiptsToRemove = existingFriendReceipts.Where(fr => friendsToRemove.Contains(fr.FriendId)).ToList();

            if (friendReceiptsToRemove.Any())
            {
                _context.FriendReceipts.RemoveRange(friendReceiptsToRemove);
            }

            // Add new FriendReceipt relationships for friends assigned to items that don't already exist
            var friendsToAdd = friendsFromItems.Except(existingFriendIds).ToList();
            foreach (var friendId in friendsToAdd)
            {
                var friendReceipt = new FriendReceipt
                {
                    FriendId = friendId,
                    ReceiptId = receiptId
                };
                _context.FriendReceipts.Add(friendReceipt);
            }
        }

        // Add the new endpoint for adding items
        [HttpPost("{receiptId}/items")]
        public async Task<IActionResult> AddItemToReceipt(int receiptId, [FromBody] ItemDto itemDto)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipt = await _context.Receipts.FirstOrDefaultAsync(r => r.Id == receiptId && r.UserId == user.Id);
            if (receipt == null)
            {
                return NotFound($"Receipt with ID {receiptId} not found");
            }

            var item = new Item
            {
                Name = itemDto.Name,
                Price = itemDto.Price,
                Quantity = itemDto.Quantity > 0 ? itemDto.Quantity : 1, // Default to 1 if not specified
                ReceiptId = receiptId
            };

            _context.Items.Add(item);
            await _context.SaveChangesAsync();

            // Return a safe DTO
            var itemResponseDto = new ItemResponseDto
            {
                Id = item.Id,
                Name = item.Name,
                Quantity = item.Quantity,
                Price = item.Price,
                Assignments = new List<ItemAssignmentResponseDto>()
            };

            return Ok(itemResponseDto);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllReceipts(
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] string? searchTerm = null)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            // Debug logging
            Console.WriteLine($"Query parameters - Page: {page}, PageSize: {pageSize}, SearchTerm: '{searchTerm}'");

            // Check if pagination parameters are provided
            bool usePagination = page.HasValue && pageSize.HasValue && page > 0 && pageSize > 0;
            Console.WriteLine($"Using pagination: {usePagination}");

            // If no pagination parameters, return all receipts (backward compatibility)
            if (!usePagination)
            {
                var allReceipts = await _context.Receipts
                    .Where(r => r.UserId == user.Id)
                    .Include(r => r.FriendReceipts)
                    .ThenInclude(fr => fr.Friend)
                    .Include(r => r.Items)
                    .ThenInclude(i => i.Assignments)
                    .ThenInclude(a => a.FriendAssignments)
                    .ThenInclude(fa => fa.Friend)
                    .OrderByDescending(r => r.CreatedDate) // Order by most recent first
                    .ToListAsync();

                var allReceiptDtos = new List<ReceiptResponseDto>();

                foreach (var receipt in allReceipts)
                {
                    // Calculate the current user's paid amount for this receipt
                    var userPaidAmount = await CalculateCurrentUserAmountForReceipt(receipt.Id, user);

                    var receiptDto = new ReceiptResponseDto
                    {
                        Id = receipt.Id,
                        Name = receipt.Name,
                        Tax = receipt.Tax,
                        TaxType = receipt.TaxType,
                        Tips = receipt.Tips,
                        Total = receipt.Total,
                        TipsIncludedInTotal = receipt.TipsIncludedInTotal,
                        CreatedDate = receipt.CreatedDate,
                        UserPaidAmount = userPaidAmount,
                        Friends = receipt.FriendReceipts?.Select(fr => new FriendResponseDto
                        {
                            Id = fr.Friend.Id,
                            Name = fr.Friend.Name
                        }).ToList() ?? new List<FriendResponseDto>(),
                        Items = receipt.Items.Select(item => new ItemResponseDto
                        {
                            Id = item.Id,
                            Name = item.Name,
                            Quantity = item.Quantity,
                            Price = item.Price,
                            Assignments = item.Assignments
                                .OrderBy(a => a.Id)
                                .Select((assignment, index) => new ItemAssignmentResponseDto
                                {
                                    Id = assignment.Id,
                                    Unitlabel = $"unit{index + 1}",
                                    Price = assignment.Price,
                                    Quantity = assignment.Quantity,
                                    AssignedFriends = assignment.FriendAssignments
                                        .Select(fa => new FriendResponseDto
                                        {
                                            Id = fa.Friend.Id,
                                            Name = fa.Friend.Name
                                        }).ToList()
                                }).ToList()
                        }).ToList()
                    };
                    allReceiptDtos.Add(receiptDto);
                }

                return Ok(allReceiptDtos);
            }

            // Build query with search filtering
            var query = _context.Receipts
                .Where(r => r.UserId == user.Id)
                .Include(r => r.FriendReceipts)
                .ThenInclude(fr => fr.Friend)
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchTermLower = searchTerm.ToLower();
                Console.WriteLine($"Applying search filter for: '{searchTermLower}'");
                query = query.Where(r =>
                    // Search by receipt name
                    (r.Name != null && r.Name.ToLower().Contains(searchTermLower)) ||
                    // Search by friend names
                    r.FriendReceipts.Any(fr => 
                        fr.Friend.Name != null && 
                        fr.Friend.Name.ToLower().Contains(searchTermLower)
                    ) ||
                    // Search by item names
                    r.Items.Any(item => 
                        item.Name != null && 
                        item.Name.ToLower().Contains(searchTermLower)
                    ));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();
            Console.WriteLine($"Total count after filtering: {totalCount}");

            // Apply ordering and pagination
            var receipts = await query
                .OrderByDescending(r => r.CreatedDate) // Order by most recent first
                .Skip((page!.Value - 1) * pageSize!.Value)
                .Take(pageSize.Value)
                .ToListAsync();

            var receiptDtos = new List<ReceiptResponseDto>();

            foreach (var receipt in receipts)
            {
                // Calculate the current user's paid amount for this receipt
                var userPaidAmount = await CalculateCurrentUserAmountForReceipt(receipt.Id, user);

                var receiptDto = new ReceiptResponseDto
                {
                    Id = receipt.Id,
                    Name = receipt.Name,
                    Tax = receipt.Tax,
                    TaxType = receipt.TaxType,
                    Tips = receipt.Tips,
                    Total = receipt.Total,
                    TipsIncludedInTotal = receipt.TipsIncludedInTotal,
                    CreatedDate = receipt.CreatedDate,
                    UserPaidAmount = userPaidAmount,
                    Friends = receipt.FriendReceipts?.Select(fr => new FriendResponseDto
                    {
                        Id = fr.Friend.Id,
                        Name = fr.Friend.Name
                    }).ToList() ?? new List<FriendResponseDto>(),
                    Items = receipt.Items.Select(item => new ItemResponseDto
                    {
                        Id = item.Id,
                        Name = item.Name,
                        Quantity = item.Quantity,
                        Price = item.Price,
                        Assignments = item.Assignments
                            .OrderBy(a => a.Id)
                            .Select((assignment, index) => new ItemAssignmentResponseDto
                            {
                                Id = assignment.Id,
                                Unitlabel = $"unit{index + 1}",
                                Price = assignment.Price,
                                Quantity = assignment.Quantity,
                                AssignedFriends = assignment.FriendAssignments
                                    .Select(fa => new FriendResponseDto
                                    {
                                        Id = fa.Friend.Id,
                                        Name = fa.Friend.Name
                                    }).ToList()
                            }).ToList()
                    }).ToList()
                };
                receiptDtos.Add(receiptDto);
            }

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize!.Value);

            var paginatedResponse = new PaginatedResponseDto<ReceiptResponseDto>
            {
                Items = receiptDtos,
                TotalCount = totalCount,
                TotalPages = totalPages,
                CurrentPage = page!.Value,
                PageSize = pageSize.Value,
                HasNextPage = page.Value < totalPages,
                HasPreviousPage = page.Value > 1
            };

            Console.WriteLine($"Returning {receiptDtos.Count} receipts, page {page.Value} of {totalPages}");

            return Ok(paginatedResponse);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReceiptById(int id)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipt = await _context.Receipts
                .Include(r => r.FriendReceipts)
                .ThenInclude(fr => fr.Friend)
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == user.Id);
            if (receipt == null)
                return NotFound("Receipt not found");

            // Calculate the current user's paid amount for this receipt
            var userPaidAmount = await CalculateCurrentUserAmountForReceipt(receipt.Id, user);

            var receiptDto = new ReceiptResponseDto
            {
                Id = receipt.Id,
                Name = receipt.Name,
                Tax = receipt.Tax,
                TaxType = receipt.TaxType,
                Tips = receipt.Tips,
                Total = receipt.Total,
                TipsIncludedInTotal = receipt.TipsIncludedInTotal,
                CreatedDate = receipt.CreatedDate,
                UserPaidAmount = userPaidAmount,
                Friends = receipt.FriendReceipts.Select(fr => new FriendResponseDto
                {
                    Id = fr.Friend.Id,
                    Name = fr.Friend.Name
                }).ToList(),
                Items = receipt.Items.Select(item => new ItemResponseDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    Quantity = item.Quantity,
                    Price = item.Price,
                    Assignments = item.Assignments
                        .OrderBy(a => a.Id)
                        .Select((assignment, index) => new ItemAssignmentResponseDto
                        {
                            Id = assignment.Id,
                            Unitlabel = $"unit{index + 1}",
                            Price = assignment.Price,
                            Quantity = assignment.Quantity,
                            AssignedFriends = assignment.FriendAssignments
                                .Select(fa => new FriendResponseDto
                                {
                                    Id = fa.Friend.Id,
                                    Name = fa.Friend.Name
                                }).ToList()
                        }).ToList()
                }).ToList()
            };
            return Ok(receiptDto);
        }

        //Create a new Receipt
        [HttpPost]
        public async Task<IActionResult> CreateReceipt([FromBody] ReceiptDto dto)
        {
            if (dto == null)
            {
                return BadRequest("No Receipt Added.");
            }

            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            try
            {
                // Create receipt manually to ensure proper mapping
                var receipt = new Receipt
                {
                    Name = dto.Name,
                    Tax = dto.Tax,
                    TaxType = dto.TaxType, // Allow null values
                    Tips = dto.Tips,
                    Total = dto.Total,
                    TipsIncludedInTotal = dto.TipsIncludedInTotal,
                    UserId = user.Id,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Receipts.Add(receipt);
                await _context.SaveChangesAsync();

                // Return a safe DTO to avoid object cycles
                var receiptDto = new ReceiptResponseDto
                {
                    Id = receipt.Id,
                    Name = receipt.Name,
                    Tax = receipt.Tax,
                    TaxType = receipt.TaxType,
                    Tips = receipt.Tips,
                    Total = receipt.Total,
                    TipsIncludedInTotal = receipt.TipsIncludedInTotal,
                    CreatedDate = receipt.CreatedDate,
                    Friends = new List<FriendResponseDto>(),
                    Items = new List<ItemResponseDto>()
                };

                return Ok(receiptDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating receipt: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]  // Fix the delete endpoint route
        public async Task<IActionResult> DeleteReceipt(int id)
        {
            // Remove all FriendReceipt relationships for this receipt
            var friendReceipts = _context.FriendReceipts.Where(fr => fr.ReceiptId == id);
            _context.FriendReceipts.RemoveRange(friendReceipts);
            await _context.SaveChangesAsync();

            // Remove all FriendAssignments for ItemAssignments belonging to this receipt
            var itemAssignmentIds = _context.ItemAssignments
                .Where(ia => ia.ReceiptId == id)
                .Select(ia => ia.Id)
                .ToList();
            var friendAssignments = _context.FriendAssignments
                .Where(fa => itemAssignmentIds.Contains(fa.ItemAssignmentId));
            _context.FriendAssignments.RemoveRange(friendAssignments);

            // Remove all ItemAssignments for this receipt
            var itemAssignments = _context.ItemAssignments.Where(ia => ia.ReceiptId == id);
            _context.ItemAssignments.RemoveRange(itemAssignments);

            // Remove all Items for this receipt
            var items = _context.Items.Where(i => i.ReceiptId == id);
            _context.Items.RemoveRange(items);

            // Remove the receipt itself
            var receipt = await _context.Receipts.FindAsync(id);
            if (receipt == null)
                return BadRequest("No Receipt Found!");
            _context.Receipts.Remove(receipt);

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{id}/friends")]
        public async Task<IActionResult> AssignFriendsToReceipt(int id, [FromBody] AssignFriendsToReceiptDto dto)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipt = await _context.Receipts
                .Include(r => r.FriendReceipts)
                .ThenInclude(fr => fr.Friend)
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == user.Id);

            if (receipt == null)
            {
                return NotFound($"Receipt with ID {id} not found");
            }

            foreach (var friendName in dto.FriendNames)
            {
                var normalizedName = friendName.Trim().ToLower();

                // Check if friend already exists (case-insensitive) for this user
                var existingFriend = await _context.Friends
                    .FirstOrDefaultAsync(f => f.Name.ToLower() == normalizedName && f.UserId == user.Id);

                if (existingFriend == null)
                {
                    // Create new friend if doesn't exist
                    existingFriend = new Friend { Name = friendName.Trim(), UserId = user.Id };
                    _context.Friends.Add(existingFriend);
                    await _context.SaveChangesAsync();
                }

                // Check if friend is already assigned to this receipt
                var existingFriendReceipt = await _context.FriendReceipts
                    .FirstOrDefaultAsync(fr => fr.FriendId == existingFriend.Id && fr.ReceiptId == receipt.Id);

                if (existingFriendReceipt == null)
                {
                    // Create new FriendReceipt relationship
                    var friendReceipt = new FriendReceipt
                    {
                        FriendId = existingFriend.Id,
                        ReceiptId = receipt.Id
                    };
                    _context.FriendReceipts.Add(friendReceipt);
                }
            }

            await _context.SaveChangesAsync();

            // Update the many-to-many relationship to ensure consistency
            await UpdateFriendReceiptRelationships(receipt.Id);
            await _context.SaveChangesAsync();

            // Refresh the receipt data to get updated FriendReceipts
            var updatedReceipt = await _context.Receipts
                .Include(r => r.FriendReceipts)
                .ThenInclude(fr => fr.Friend)
                .FirstOrDefaultAsync(r => r.Id == receipt.Id);

            // Return a safe DTO to avoid object cycles
            var receiptDto = new ReceiptResponseDto
            {
                Id = updatedReceipt.Id,
                Name = updatedReceipt.Name,
                Tax = updatedReceipt.Tax,
                TaxType = updatedReceipt.TaxType,
                Tips = updatedReceipt.Tips,
                Total = updatedReceipt.Total,
                TipsIncludedInTotal = updatedReceipt.TipsIncludedInTotal,
                Friends = updatedReceipt.FriendReceipts.Select(fr => new FriendResponseDto
                {
                    Id = fr.Friend.Id,
                    Name = fr.Friend.Name
                }).ToList(),
                Items = new List<ItemResponseDto>()
            };
            return Ok(receiptDto);
        }

        [HttpPost("assign-items")]
        public async Task<IActionResult> AssignItemsToReceipt([FromBody] AssignItemsToReceiptDto dto)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipt = await _context.Receipts
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == dto.ReceiptId && r.UserId == user.Id);

            if (receipt == null)
            {
                return NotFound($"Receipt with ID {dto.ReceiptId} not found");
            }

            foreach (var itemDto in dto.Items)
            {
                // Create new item
                var newItem = new Item
                {
                    Name = itemDto.Name,
                    Price = itemDto.Price,
                    Quantity = itemDto.Quantity,
                    ReceiptId = receipt.Id
                };

                // Add the item to the receipt
                receipt.Items.Add(newItem);
            }

            await _context.SaveChangesAsync();

            // Return a safe DTO to avoid object cycles
            var updatedReceipt = await _context.Receipts
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == dto.ReceiptId);

            var receiptDto = new ReceiptResponseDto
            {
                Id = updatedReceipt.Id,
                Name = updatedReceipt.Name,
                Tax = updatedReceipt.Tax,
                TaxType = updatedReceipt.TaxType,
                Tips = updatedReceipt.Tips,
                Total = updatedReceipt.Total,
                TipsIncludedInTotal = updatedReceipt.TipsIncludedInTotal,
                Friends = new List<FriendResponseDto>(),
                Items = updatedReceipt.Items.Select(item => new ItemResponseDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    Quantity = item.Quantity,
                    Price = item.Price,
                    Assignments = new List<ItemAssignmentResponseDto>()
                }).ToList()
            };
            return Ok(receiptDto);
        }

        [HttpPost("assign-friends-to-items")]
        public async Task<IActionResult> AssignFriendsToItems([FromBody] AssignFriendsToItemDto dto)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipt = await _context.Receipts
                .Include(r => r.FriendReceipts)
                .ThenInclude(fr => fr.Friend)
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .FirstOrDefaultAsync(r => r.Id == dto.ReceiptId && r.UserId == user.Id);

            if (receipt == null)
            {
                return NotFound($"Receipt with ID {dto.ReceiptId} not found");
            }

            // Track all friends that will be assigned to this receipt
            var friendsToAssign = new HashSet<int>();

            foreach (var itemAssignment in dto.ItemAssignments)
            {
                var item = receipt.Items.FirstOrDefault(i => i.Id == itemAssignment.ItemId);
                if (item == null)
                {
                    return NotFound($"Item with ID {itemAssignment.ItemId} not found in receipt");
                }

                // Check if adding a new assignment would exceed the item's quantity
                if (item.Assignments.Count >= item.Quantity)
                {
                    return BadRequest($"Cannot add more assignments for item '{item.Name}'. Maximum assignments allowed: {item.Quantity}");
                }

                // Create a new item assignment using the item's existing quantity
                var newItemAssignment = new ItemAssignment
                {
                    ItemId = item.Id,
                    ReceiptId = receipt.Id,
                    Unitlabel = "unit",
                    Price = item.Price / item.Quantity, // Price per unit
                    Quantity = item.Quantity // Use the item's existing quantity
                };

                // Get or create friends
                foreach (var friendName in itemAssignment.FriendNames)
                {
                    var normalizedName = friendName.Trim().ToLower();

                    // Check if friend already exists (case-insensitive) for this user
                    var friend = await _context.Friends
                        .FirstOrDefaultAsync(f => f.Name.ToLower() == normalizedName && f.UserId == user.Id);

                    if (friend == null)
                    {
                        // Create new friend if doesn't exist
                        friend = new Friend { Name = friendName.Trim(), UserId = user.Id };
                        _context.Friends.Add(friend);
                        await _context.SaveChangesAsync();
                    }

                    // Track this friend for receipt assignment
                    friendsToAssign.Add(friend.Id);

                    // Create friend assignment
                    var friendAssignment = new FriendAssignment
                    {
                        Friend = friend,
                        ItemAssignment = newItemAssignment
                    };

                    newItemAssignment.FriendAssignments.Add(friendAssignment);
                }

                item.Assignments.Add(newItemAssignment);
            }

            // Update the many-to-many relationship between friends and receipt
            await UpdateFriendReceiptRelationships(receipt.Id);

            await _context.SaveChangesAsync();

            // Refresh the receipt data to get updated FriendReceipts
            var updatedReceipt = await _context.Receipts
                .Include(r => r.FriendReceipts)
                .ThenInclude(fr => fr.Friend)
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .FirstOrDefaultAsync(r => r.Id == receipt.Id);

            // Map the updated receipt to DTOs
            var receiptDto = new ReceiptResponseDto
            {
                Id = updatedReceipt.Id,
                Name = updatedReceipt.Name,
                Tax = updatedReceipt.Tax,
                TaxType = updatedReceipt.TaxType,
                Tips = updatedReceipt.Tips,
                Total = updatedReceipt.Total,
                TipsIncludedInTotal = updatedReceipt.TipsIncludedInTotal,
                CreatedDate = updatedReceipt.CreatedDate,
                Friends = updatedReceipt.FriendReceipts.Select(fr => new FriendResponseDto
                {
                    Id = fr.Friend.Id,
                    Name = fr.Friend.Name
                }).ToList(),
                Items = updatedReceipt.Items.Select(item => new ItemResponseDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    Quantity = item.Quantity,
                    Price = item.Price,
                    Assignments = item.Assignments
                        .OrderBy(a => a.Id)
                        .Select((assignment, index) => new ItemAssignmentResponseDto
                        {
                            Id = assignment.Id,
                            Unitlabel = $"unit{index + 1}",
                            Price = assignment.Price,
                            Quantity = assignment.Quantity,
                            AssignedFriends = assignment.FriendAssignments
                                .Select(fa => new FriendResponseDto
                                {
                                    Id = fa.Friend.Id,
                                    Name = fa.Friend.Name
                                }).ToList()
                        }).ToList()
                }).ToList()
            };

            return Ok(receiptDto);
        }

        [HttpPost("assign-friends-to-whole-item")]
        public async Task<IActionResult> AssignFriendsToWholeItem([FromBody] AssignFriendsToWholeItemDto dto)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipt = await _context.Receipts
                .Include(r => r.FriendReceipts)
                .ThenInclude(fr => fr.Friend)
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .FirstOrDefaultAsync(r => r.Id == dto.ReceiptId && r.UserId == user.Id);

            if (receipt == null)
            {
                return NotFound($"Receipt with ID {dto.ReceiptId} not found");
            }

            var item = receipt.Items.FirstOrDefault(i => i.Id == dto.ItemId);
            if (item == null)
            {
                return NotFound($"Item with ID {dto.ItemId} not found in receipt");
            }

            // Remove any previous whole-item assignments (optional, for idempotency)
            item.Assignments.Clear();

            // Calculate price per friend
            var pricePerFriend = item.Price / dto.FriendNames.Count;
            var quantityPerFriend = (double)item.Quantity / dto.FriendNames.Count;

            var newItemAssignment = new ItemAssignment
            {
                ItemId = item.Id,
                ReceiptId = receipt.Id,
                Unitlabel = "whole",
                Price = pricePerFriend,
                Quantity = item.Quantity
            };

            // Track all friends that will be assigned to this receipt
            var friendsToAssign = new HashSet<int>();

            foreach (var friendName in dto.FriendNames)
            {
                var normalizedName = friendName.Trim().ToLower();

                // Check if friend already exists (case-insensitive) for this user
                var friend = await _context.Friends
                    .FirstOrDefaultAsync(f => f.Name.ToLower() == normalizedName && f.UserId == user.Id);

                if (friend == null)
                {
                    // Create new friend if doesn't exist
                    friend = new Friend { Name = friendName.Trim(), UserId = user.Id };
                    _context.Friends.Add(friend);
                    await _context.SaveChangesAsync();
                }

                // Track this friend for receipt assignment
                friendsToAssign.Add(friend.Id);

                var friendAssignment = new FriendAssignment
                {
                    Friend = friend,
                    ItemAssignment = newItemAssignment
                };
                newItemAssignment.FriendAssignments.Add(friendAssignment);
            }

            item.Assignments.Add(newItemAssignment);

            // Update the many-to-many relationship between friends and receipt
            await UpdateFriendReceiptRelationships(receipt.Id);

            await _context.SaveChangesAsync();

            // Refresh the receipt data to get updated FriendReceipts
            var updatedReceipt = await _context.Receipts
                .Include(r => r.FriendReceipts)
                .ThenInclude(fr => fr.Friend)
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .FirstOrDefaultAsync(r => r.Id == receipt.Id);

            // Map the updated receipt to DTOs
            var receiptDto = new ReceiptResponseDto
            {
                Id = updatedReceipt.Id,
                Name = updatedReceipt.Name,
                Tax = updatedReceipt.Tax,
                TaxType = updatedReceipt.TaxType,
                Tips = updatedReceipt.Tips,
                Total = updatedReceipt.Total,
                TipsIncludedInTotal = updatedReceipt.TipsIncludedInTotal,
                CreatedDate = updatedReceipt.CreatedDate,
                Friends = updatedReceipt.FriendReceipts.Select(fr => new FriendResponseDto
                {
                    Id = fr.Friend.Id,
                    Name = fr.Friend.Name
                }).ToList(),
                Items = updatedReceipt.Items.Select(item => new ItemResponseDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    Quantity = item.Quantity,
                    Price = item.Price,
                    Assignments = item.Assignments
                        .OrderBy(a => a.Id)
                        .Select((assignment, index) => new ItemAssignmentResponseDto
                        {
                            Id = assignment.Id,
                            Unitlabel = assignment.Unitlabel,
                            Price = assignment.Price,
                            Quantity = assignment.Quantity,
                            AssignedFriends = assignment.FriendAssignments
                                .Select(fa => new FriendResponseDto
                                {
                                    Id = fa.Friend.Id,
                                    Name = fa.Friend.Name
                                }).ToList()
                        }).ToList()
                }).ToList()
            };

            return Ok(receiptDto);
        }

        [HttpDelete("{receiptId}/items/{itemId}")]
        public async Task<IActionResult> DeleteItemFromReceipt(int receiptId, int itemId)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipt = await _context.Receipts
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .FirstOrDefaultAsync(r => r.Id == receiptId && r.UserId == user.Id);

            if (receipt == null)
            {
                return NotFound($"Receipt with ID {receiptId} not found");
            }

            var item = receipt.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null)
            {
                return NotFound($"Item with ID {itemId} not found in receipt {receiptId}");
            }

            // Get all friends that were assigned to this item
            var friendsToCheck = item.Assignments
                .SelectMany(a => a.FriendAssignments)
                .Select(fa => fa.Friend.Id)
                .Distinct()
                .ToList();

            // Remove all friend assignments for this item's assignments
            var friendAssignments = item.Assignments
                .SelectMany(a => a.FriendAssignments)
                .ToList();
            _context.FriendAssignments.RemoveRange(friendAssignments);

            // Remove all item assignments for this item
            _context.ItemAssignments.RemoveRange(item.Assignments);

            // Remove the item itself
            _context.Items.Remove(item);

            await _context.SaveChangesAsync();

            // Update the many-to-many relationship after removing items
            await UpdateFriendReceiptRelationships(receiptId);

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Item '{item.Name}' successfully deleted from receipt" });
        }


        [HttpGet("{receiptId}/friends")]
        public async Task<IActionResult> GetReceiptFriends(int receiptId)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipt = await _context.Receipts
                .Include(r => r.FriendReceipts)
                .ThenInclude(fr => fr.Friend)
                .FirstOrDefaultAsync(r => r.Id == receiptId && r.UserId == user.Id);

            if (receipt == null)
                return NotFound($"Receipt with ID {receiptId} not found");

            var friendDtos = receipt.FriendReceipts.Select(fr => new FriendResponseDto
            {
                Id = fr.Friend.Id,
                Name = fr.Friend.Name
            }).ToList();

            return Ok(friendDtos);
        }

        [HttpPut("edit-receipt/{id}")]
        public async Task<IActionResult> EditReceipt(int id, [FromBody] ReceiptDto dto)
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipt = await _context.Receipts.FirstOrDefaultAsync(r => r.Id == id && r.UserId == user.Id);
            if (receipt == null)
                return NotFound("Receipt not found");
            if (!string.IsNullOrWhiteSpace(dto.Name))
                receipt.Name = dto.Name;
            receipt.Tax = dto.Tax;
            receipt.TaxType = dto.TaxType;
            receipt.Tips = dto.Tips;
            receipt.Total = dto.Total;
            receipt.TipsIncludedInTotal = dto.TipsIncludedInTotal;
            await _context.SaveChangesAsync();

            // Return a safe DTO to avoid object cycles
            var receiptDto = new ReceiptResponseDto
            {
                Id = receipt.Id,
                Name = receipt.Name,
                Tax = receipt.Tax,
                TaxType = receipt.TaxType,
                Tips = receipt.Tips,
                Total = receipt.Total,
                TipsIncludedInTotal = receipt.TipsIncludedInTotal,
                CreatedDate = receipt.CreatedDate,
                Friends = new List<FriendResponseDto>(),
                Items = new List<ItemResponseDto>()
            };
            return Ok(receiptDto);
        }

        /// <summary>
        /// Helper method to calculate the amount the current user should pay for a specific receipt
        /// </summary>
        private async Task<decimal> CalculateCurrentUserAmountForReceipt(int receiptId, AppUser user)
        {
            try
            {
                // Extract user's name from DisplayName or Email
                var currentUserName = (user.DisplayName != null && user.DisplayName != "User") 
                    ? user.DisplayName.Split('@')[0] 
                    : user.Email.Split('@')[0];

                // Find the current user's friend entry
                var currentUserFriend = await _context.Friends
                    .FirstOrDefaultAsync(f => f.UserId == user.Id && f.Name != null && f.Name.ToLower() == currentUserName.ToLower());

                if (currentUserFriend == null)
                    return 0;

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

                // Check if this user is assigned to any items in this receipt
                var isAssignedToAnyItem = receipt.Items
                    .Any(item => item.Assignments
                        .Any(assignment => assignment.FriendAssignments
                            .Any(fa => fa.FriendId == currentUserFriend.Id)));

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

                // If the user is not in the calculation, return 0
                if (!friendAmounts.ContainsKey(currentUserFriend.Id))
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

                // Apply tax to this user's amount
                var itemAmount = friendAmounts[currentUserFriend.Id];
                var taxAmount = itemAmount * (decimal)(taxPercentage / 100.0);
                var userAmountWithTax = itemAmount + taxAmount;

                // Add tips if user is part of the receipt
                if (friendCount > 0)
                {
                    var tipsPerFriend = totalTips / friendCount;
                    userAmountWithTax += tipsPerFriend;
                }

                return Math.Round(userAmountWithTax, 2);
            }
            catch
            {
                // If any error occurs, return 0
                return 0;
            }
        }
    }
}
