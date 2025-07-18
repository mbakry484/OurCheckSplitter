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
        public async Task<IActionResult> GetAllReceipts()
        {
            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            var receipts = await _context.Receipts
                .Where(r => r.UserId == user.Id)
                .Include(r => r.Friends)
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .ToListAsync();

            var receiptDtos = new List<ReceiptResponseDto>();

            foreach (var receipt in receipts)
            {
                var receiptDto = new ReceiptResponseDto
                {
                    Id = receipt.Id,
                    Name = receipt.Name,
                    Tax = receipt.Tax,
                    Tips = receipt.Tips,
                    Total = receipt.Total,
                    Friends = receipt.Friends.Select(f => new FriendResponseDto
                    {
                        Id = f.Id,
                        Name = f.Name
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
                receiptDtos.Add(receiptDto);
            }

            return Ok(receiptDtos);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReceiptById(int id)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Friends)
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (receipt == null)
                return NotFound("Receipt not found");

            var receiptDto = new ReceiptResponseDto
            {
                Id = receipt.Id,
                Name = receipt.Name,
                Tax = receipt.Tax,
                Tips = receipt.Tips,
                Total = receipt.Total,
                Friends = receipt.Friends.Select(f => new FriendResponseDto
                {
                    Id = f.Id,
                    Name = f.Name
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

            var receipt = _mapper.Map<Receipt>(dto);
            receipt.UserId = user.Id;

            // Set default tax type if not specified
            if (string.IsNullOrEmpty(receipt.TaxType))
            {
                receipt.TaxType = "amount";
            }

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
                Friends = new List<FriendResponseDto>(),
                Items = new List<ItemResponseDto>()
            };
            return Ok(receiptDto);
        }

        [HttpDelete("{id}")]  // Fix the delete endpoint route
        public async Task<IActionResult> DeleteReceipt(int id)
        {
            // Set all related friends' ReceiptId to null
            var friends = _context.Friends.Where(f => f.ReceiptId == id).ToList();
            foreach (var friend in friends)
            {
                friend.ReceiptId = null;
            }
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
                .Include(r => r.Friends)
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
                if (!receipt.Friends.Any(f => f.Id == existingFriend.Id))
                {
                    receipt.Friends.Add(existingFriend);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(receipt);
        }

        [HttpPost("assign-items")]
        public async Task<IActionResult> AssignItemsToReceipt([FromBody] AssignItemsToReceiptDto dto)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == dto.ReceiptId);

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

            // Return the updated receipt with its items
            return Ok(await _context.Receipts
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == dto.ReceiptId));
        }

        [HttpPost("assign-friends-to-items")]
        public async Task<IActionResult> AssignFriendsToItems([FromBody] AssignFriendsToItemDto dto)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .FirstOrDefaultAsync(r => r.Id == dto.ReceiptId);

            if (receipt == null)
            {
                return NotFound($"Receipt with ID {dto.ReceiptId} not found");
            }

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
                    var friend = await _context.Friends
                        .FirstOrDefaultAsync(f => f.Name == friendName);

                    if (friend == null)
                    {
                        friend = new Friend { Name = friendName };
                        _context.Friends.Add(friend);
                        await _context.SaveChangesAsync();
                    }

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

            await _context.SaveChangesAsync();

            // Map the updated receipt to DTOs
            var receiptDto = new ReceiptResponseDto
            {
                Id = receipt.Id,
                Name = receipt.Name,
                Tax = receipt.Tax,
                Tips = receipt.Tips,
                Total = receipt.Total,
                Friends = receipt.Friends.Select(f => new FriendResponseDto
                {
                    Id = f.Id,
                    Name = f.Name
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

        [HttpPost("assign-friends-to-whole-item")]
        public async Task<IActionResult> AssignFriendsToWholeItem([FromBody] AssignFriendsToWholeItemDto dto)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Items)
                .ThenInclude(i => i.Assignments)
                .ThenInclude(a => a.FriendAssignments)
                .ThenInclude(fa => fa.Friend)
                .FirstOrDefaultAsync(r => r.Id == dto.ReceiptId);

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

            foreach (var friendName in dto.FriendNames)
            {
                var friend = await _context.Friends.FirstOrDefaultAsync(f => f.Name == friendName);
                if (friend == null)
                {
                    friend = new Friend { Name = friendName };
                    _context.Friends.Add(friend);
                    await _context.SaveChangesAsync();
                }
                var friendAssignment = new FriendAssignment
                {
                    Friend = friend,
                    ItemAssignment = newItemAssignment
                };
                newItemAssignment.FriendAssignments.Add(friendAssignment);
            }

            item.Assignments.Add(newItemAssignment);
            await _context.SaveChangesAsync();

            // Map the updated receipt to DTOs
            var receiptDto = new ReceiptResponseDto
            {
                Id = receipt.Id,
                Name = receipt.Name,
                Tax = receipt.Tax,
                Tips = receipt.Tips,
                Total = receipt.Total,
                Friends = receipt.Friends.Select(f => new FriendResponseDto
                {
                    Id = f.Id,
                    Name = f.Name
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

            return Ok(new { message = $"Item '{item.Name}' successfully deleted from receipt" });
        }


        [HttpPut("edit-receipt/{id}")]
        public async Task<IActionResult> EditReceipt(int id, [FromBody] ReceiptDto dto)
        {
            var receipt = await _context.Receipts.FindAsync(id);
            if (receipt == null)
                return NotFound("Receipt not found");
            if (!string.IsNullOrWhiteSpace(dto.Name))
                receipt.Name = dto.Name;
            receipt.Tax = dto.Tax;
            receipt.Tips = dto.Tips;
            receipt.Total = dto.Total;
            await _context.SaveChangesAsync();
            return Ok(receipt);
        }



    }
}
