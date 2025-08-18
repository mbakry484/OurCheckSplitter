using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.Entities;
using OurCheckSplitter.Api.DTOs;

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
            return Ok(new
            {
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

        [HttpPost("debug-receipt")]
        public async Task<IActionResult> DebugReceiptCreation([FromBody] ReceiptDto dto)
        {
            if (dto == null)
            {
                return BadRequest("No Receipt Added.");
            }

            var user = HttpContext.Items["User"] as AppUser;
            if (user == null)
                return Unauthorized();

            // Log the incoming DTO for debugging
            Console.WriteLine($"=== DEBUG RECEIPT CREATION ===");
            Console.WriteLine($"Received DTO: Name={dto.Name}, Tax={dto.Tax}, TaxType={dto.TaxType}, Tips={dto.Tips}, Total={dto.Total}, TipsIncludedInTotal={dto.TipsIncludedInTotal}");

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

            Console.WriteLine($"Created Receipt object: Name={receipt.Name}, Tax={receipt.Tax}, TaxType={receipt.TaxType}, Tips={receipt.Tips}, Total={receipt.Total}, TipsIncludedInTotal={receipt.TipsIncludedInTotal}");

            _context.Receipts.Add(receipt);
            await _context.SaveChangesAsync();

            Console.WriteLine($"After SaveChanges: Id={receipt.Id}, TaxType={receipt.TaxType}, TipsIncludedInTotal={receipt.TipsIncludedInTotal}");

            // Query the receipt back from database to see what was actually saved
            var savedReceipt = await _context.Receipts.FindAsync(receipt.Id);
            Console.WriteLine($"Queried from DB: Id={savedReceipt.Id}, TaxType={savedReceipt.TaxType}, TipsIncludedInTotal={savedReceipt.TipsIncludedInTotal}");

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

            Console.WriteLine($"=== END DEBUG ===");

            return Ok(receiptDto);
        }
    }
}