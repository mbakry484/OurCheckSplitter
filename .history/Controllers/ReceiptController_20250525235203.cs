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
    public class ReceiptController: ControllerBase
    {
        private readonly OurCheckSplitterContext _context;

        private readonly IMapper _mapper;

        public ReceiptController(OurCheckSplitterContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }



        [HttpGet]
        public async Task<IActionResult> GetAllReceipts()
        {
            var TotalReceipts = await _context.Receipts.
             Include(r=>r.Friends)
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

            return Ok(dto);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteReceipt(int id)
        {
        var TargetReceipt= await _context.Receipts.FindAsync(id);
         if (TargetReceipt == null)
                return BadRequest("No Receipt Found!");
            _context.Receipts.Remove(TargetReceipt);
            await _context.SaveChangesAsync();
            
            return Ok();
        }
        
    }
}
