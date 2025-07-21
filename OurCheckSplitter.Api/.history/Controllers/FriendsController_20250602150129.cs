using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendsController : Controller
    {
        private readonly OurCheckSplitterContext _context;

        public FriendsController(OurCheckSplitterContext context)
        {
            _context = context;
        }

          [HttpPost]
        public async Task<IActionResult> CreateFriend([FromBody] FriendDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Name is required");
            }

            var friend = new Friend
            {
                Name = dto.Name
            };
            _context.Friends.Add(friend);
            await _context.SaveChangesAsync();
            return Ok(friend);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllFriends()
        {
            var friends = await _context.Friends.ToListAsync();
            var friendDtos = new List<FriendDto>();
            foreach (var friend in friends)
            {
                // Find all receipts where this friend is assigned to any item assignment
                var receipts = await _context.Receipts
                    .Where(r => r.Items.Any(i => i.Assignments.Any(a => a.FriendAssignments.Any(fa => fa.FriendId == friend.Id))))
                    .Select(r => new ReceiptSummaryDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        Total = r.Total
                    }).ToListAsync();
                friendDtos.Add(new FriendDto
                {
                    Name = friend.Name ?? string.Empty,
                    Receipts = receipts
                });
            }
            return Ok(friendDtos);
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
        public async Task<IActionResult> EditFriend(int id, [FromBody] FriendDto dto)
        {
            var friend = await _context.Friends.FindAsync(id);
            if (friend == null)
                return NotFound("Friend not found");
            if (!string.IsNullOrWhiteSpace(dto.Name))
                friend.Name = dto.Name;
            await _context.SaveChangesAsync();
            return Ok(friend);
        }
        
        [HttpDelete]
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


       

    }
}
