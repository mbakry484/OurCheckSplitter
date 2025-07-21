using Microsoft.AspNetCore.Mvc;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Services;

namespace OurCheckSplitter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VoiceController : ControllerBase
    {
        private readonly ReceiptAIService _aiService;
        private readonly SmartReceiptBuilder _receiptBuilder;

        public VoiceController(ReceiptAIService aiService, SmartReceiptBuilder receiptBuilder)
        {
            _aiService = aiService;
            _receiptBuilder = receiptBuilder;
        }

        [HttpPost("process-voice")]
        public async Task<IActionResult> ProcessVoiceReceipt([FromBody] VoiceReceiptDto dto)
        {
            try
            {
                // Step 1: Convert voice to text (if not already done client-side)
                string voiceText = dto.VoiceText ?? await ConvertVoiceToText(dto.VoiceData);

                // Step 2: Parse with AI chatbot
                var parsedData = await _aiService.ParseVoiceDescription(voiceText);

                // Step 3: If OCR data is provided, combine intelligently
                ReceiptData finalData;
                if (dto.OCRData != null)
                {
                    finalData = await _receiptBuilder.BuildReceipt(parsedData, dto.OCRData);
                }
                else
                {
                    finalData = parsedData;
                }

                // Step 4: Create receipt and calculate splits
                var receipt = await _receiptBuilder.CreateReceipt(finalData);

                return Ok(new
                {
                    Message = "Receipt processed successfully",
                    Receipt = receipt,
                    Confidence = finalData.ConfidenceScore
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Failed to process voice receipt", Error = ex.Message });
            }
        }

        private async Task<string> ConvertVoiceToText(byte[] voiceData)
        {
            // Implement voice-to-text conversion
            // This could use Azure Speech Services, Google Speech-to-Text, etc.
            throw new NotImplementedException("Voice-to-text conversion not yet implemented");
        }
    }
}