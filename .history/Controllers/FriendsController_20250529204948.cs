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



        [HttpGet]
        public async Task<IActionResult> GetAllFriends()
        {
            var AllFriends = await _context.Friends.ToListAsync();

            return Ok(AllFriends);

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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFriendById(int id)
        {
            var friend = await _context.Friends.FindAsync(id);
            if (friend == null)
                return NotFound("Friend not found");
            var dto = new FriendDto { Name = friend.Name ?? string.Empty };
            return Ok(dto);
        }

    }
}
