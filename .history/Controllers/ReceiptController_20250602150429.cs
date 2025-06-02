using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Entities;
using System.Linq.Expressions;
using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Mvc.ApiExplorer;

namespace OurCheckSplitter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ApiExplorerSettings(GroupName = "Receipts")]
    public class ReceiptController : ControllerBase
    {
        private readonly OurCheckSplitterContext _context;

        private readonly IMapper _mapper;

        public ReceiptController(OurCheckSplitterContext context, IMapper mapper)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        [HttpGet]
        [ApiExplorerSettings(Order = 1)]
        public async Task<IActionResult> GetAllReceipts()
        {
            var receipts = await _context.Receipts
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
        [ApiExplorerSettings(Order = 2)]
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
        [ApiExplorerSettings(Order = 3)]
        public async Task<IActionResult> CreateReceipt([FromBody] ReceiptDto dto)
        {
            if (dto == null)
            {
                return BadRequest("No Receipt Added.");
            }

            var receipt = _mapper.Map<Receipt>(dto);

            _context.Receipts.Add(receipt);
            await _context.SaveChangesAsync();

            return Ok(receipt);
        }

        [HttpDelete]
        [ApiExplorerSettings(Order = 4)]
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

        [HttpPost("assign-friends")]
        [ApiExplorerSettings(Order = 5)]
        public async Task<IActionResult> AssignFriendsToReceipt([FromBody] AssignFriendsToReceiptDto dto)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Friends)
                .FirstOrDefaultAsync(r => r.Id == dto.ReceiptId);

            if (receipt == null)
            {
                return NotFound($"Receipt with ID {dto.ReceiptId} not found");
            }

            foreach (var friendName in dto.FriendNames)
            {
                // Check if friend already exists
                var existingFriend = await _context.Friends
                    .FirstOrDefaultAsync(f => f.Name == friendName);

                if (existingFriend == null)
                {
                    // Create new friend if doesn't exist
                    existingFriend = new Friend { Name = friendName };
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
        [ApiExplorerSettings(Order = 6)]
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
        [ApiExplorerSettings(Order = 7)]
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
        [ApiExplorerSettings(Order = 8)]
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

        [HttpGet("{receiptId}/friend-amounts")]
        [ApiExplorerSettings(Order = 9)]
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
            var taxPerFriend = allFriendIds.Count > 0 ? totalTax / allFriendIds.Count : 0;
            var tipsPerFriend = allFriendIds.Count > 0 ? totalTips / allFriendIds.Count : 0;
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

        [HttpPut("edit-receipt/{id}")]
        [ApiExplorerSettings(Order = 10)]
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
