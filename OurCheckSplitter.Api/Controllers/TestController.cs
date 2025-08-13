using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly OurCheckSplitterContext _context;

        public TestController(OurCheckSplitterContext context)
        {
            _context = context;
        }
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { 
                message = "API is working!", 
                timestamp = DateTime.Now,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            });
        }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok("pong");
        }

        [HttpGet("debug-data")]
        public async Task<IActionResult> DebugData()
        {
            var user = HttpContext.Items["User"] as AppUser;
            
            var allUsers = await _context.AppUsers.ToListAsync();
            var allFriends = await _context.Friends.ToListAsync();
            var allReceipts = await _context.Receipts.ToListAsync();

            return Ok(new
            {
                currentUser = user != null ? new { user.Id, user.Email, user.DisplayName } : null,
                allUsers = allUsers.Select(u => new { u.Id, u.Email, u.DisplayName, u.FirebaseUid }).ToList(),
                allFriends = allFriends.Select(f => new { f.Id, f.Name, f.UserId }).ToList(),
                allReceipts = allReceipts.Select(r => new { r.Id, r.Name, r.UserId, r.Total }).ToList()
            });
        }
    }
}