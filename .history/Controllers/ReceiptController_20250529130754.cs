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



        [HttpGet]
        public async Task<IActionResult> GetAllReceipts()
        {
            var TotalReceipts = await _context.Receipts.
             Include(r => r.Friends)
            .Include(r => r.Items)
            .ThenInclude(i => i.Assignments)
            .Include(r => r.Items)
            .ThenInclude(i => i.Assignments)
            .ThenInclude(a => a.FriendAssignments).
             ToListAsync();

            return Ok(TotalReceipts);
        }

        //Create a new Receipt
        [HttpPost]
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
        public async Task<IActionResult> DeleteReceipt(int id)
        {
            var TargetReceipt = await _context.Receipts.FindAsync(id);
            if (TargetReceipt == null)
                return BadRequest("No Receipt Found!");
            _context.Receipts.Remove(TargetReceipt);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("assign-friends")]
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

    }
}
