using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Entities;
using System.Runtime.InteropServices;

namespace OurCheckSplitter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReceiptController: ControllerBase
    {
        private readonly OurCheckSplitterContext _context;

        public ReceiptController(OurCheckSplitterContext context)
        {
            _context = context;
        }



        [HttpGet]
        public async Task<IActionResult> GetAllReceipts()
        {
            var TotalReceipts = await _context.Receipts.
                Include(r=>r.Friends).
                Include(r=>r.Items).
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

            var Receipt = new Receipt
            {
                Name = dto.Name,
                Total=dto.Total,
                Tax=dto.Tax,
                Tips=dto.Tips,
                Friends=dto.Friends<>,
                Items=dto.Items<>

            };

            _context.Receipts.Add(Receipt);
            await _context.SaveChangesAsync();

            return Ok(dto);
        }


    }
}
