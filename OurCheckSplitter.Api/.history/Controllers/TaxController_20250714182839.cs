using Microsoft.AspNetCore.Mvc;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Services;

namespace OurCheckSplitter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TaxController : ControllerBase
    {
        private readonly TaxCalculationService _taxService;
        private readonly ILogger<TaxController> _logger;

        public TaxController(TaxCalculationService taxService, ILogger<TaxController> logger)
        {
            _taxService = taxService;
            _logger = logger;
        }

        [HttpGet("{receiptId}/split")]
        public async Task<IActionResult> GetTaxSplit(int receiptId, [FromQuery] string splitMethod = "equal")
        {
            try
            {
                var taxSplit = await _taxService.CalculateTaxSplit(receiptId, splitMethod);
                return Ok(taxSplit);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating tax split for receipt {ReceiptId}", receiptId);
                return StatusCode(500, "An error occurred while calculating tax split");
            }
        }

        [HttpGet("{receiptId}/subtotal")]
        public async Task<IActionResult> GetReceiptSubtotal(int receiptId)
        {
            try
            {
                var subtotal = await _taxService.CalculateSubtotal(receiptId);
                return Ok(new { ReceiptId = receiptId, Subtotal = subtotal });
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating subtotal for receipt {ReceiptId}", receiptId);
                return StatusCode(500, "An error occurred while calculating subtotal");
            }
        }

        [HttpPost("{receiptId}/update-subtotal")]
        public async Task<IActionResult> UpdateReceiptSubtotal(int receiptId)
        {
            try
            {
                await _taxService.UpdateReceiptSubtotal(receiptId);
                return Ok(new { Message = "Receipt subtotal updated successfully" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating subtotal for receipt {ReceiptId}", receiptId);
                return StatusCode(500, "An error occurred while updating subtotal");
            }
        }

        [HttpPost("calculate")]
        public async Task<IActionResult> CalculateTaxSplit([FromBody] TaxCalculationRequestDto request)
        {
            try
            {
                var taxSplit = await _taxService.CalculateTaxSplit(request.ReceiptId, request.SplitMethod);
                return Ok(taxSplit);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating tax split for receipt {ReceiptId}", request.ReceiptId);
                return StatusCode(500, "An error occurred while calculating tax split");
            }
        }
    }
}