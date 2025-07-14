using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Services
{
    public class SmartReceiptBuilder
    {
        private readonly OurCheckSplitterContext _context;
        private readonly ILogger<SmartReceiptBuilder> _logger;

        public SmartReceiptBuilder(OurCheckSplitterContext context, ILogger<SmartReceiptBuilder> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ReceiptData> BuildReceipt(ReceiptData voiceData, OCRData ocrData)
        {
            var finalData = new ReceiptData
            {
                RestaurantName = voiceData.RestaurantName ?? ocrData.RestaurantName,
                Total = ocrData.Total > 0 ? ocrData.Total : voiceData.Total,
                Tax = ocrData.Tax > 0 ? ocrData.Tax : voiceData.Tax,
                Tips = ocrData.Tips > 0 ? ocrData.Tips : voiceData.Tips,
                People = voiceData.People,
                SplittingMethod = voiceData.SplittingMethod,
                RawText = voiceData.RawText
            };

            // Merge items from both sources
            finalData.Items = await MergeItems(voiceData.Items, ocrData.Items);

            // Calculate confidence score based on data consistency
            finalData.ConfidenceScore = CalculateConfidence(voiceData, ocrData);

            return finalData;
        }

        public async Task<Receipt> CreateReceipt(ReceiptData data)
        {
            // Create the receipt
            var receipt = new Receipt
            {
                Name = data.RestaurantName ?? "Voice Receipt",
                Tax = (double)data.Tax,
                Tips = (double)data.Tips,
                Total = (double)data.Total
            };

            _context.Receipts.Add(receipt);
            await _context.SaveChangesAsync();

            // Create or find friends
            var friends = new List<Friend>();
            foreach (var personName in data.People)
            {
                var friend = await _context.Friends.FirstOrDefaultAsync(f =>
                    f.Name.ToLower() == personName.ToLower());

                if (friend == null)
                {
                    friend = new Friend { Name = personName };
                    _context.Friends.Add(friend);
                }

                friends.Add(friend);
            }

            // Add friends to receipt
            receipt.Friends = friends;
            await _context.SaveChangesAsync();

            // Create items
            foreach (var itemData in data.Items)
            {
                var item = new Item
                {
                    Name = itemData.Name,
                    Price = itemData.Price,
                    Quantity = itemData.Quantity,
                    ReceiptId = receipt.Id
                };

                _context.Items.Add(item);
                await _context.SaveChangesAsync();

                // Create item assignments for each person assigned to this item
                foreach (var personName in itemData.AssignedPeople)
                {
                    var friend = friends.FirstOrDefault(f =>
                        f.Name.ToLower() == personName.ToLower());

                    if (friend != null)
                    {
                        var assignment = new ItemAssignment
                        {
                            ItemId = item.Id,
                            ReceiptId = receipt.Id,
                            Price = itemData.Price / itemData.AssignedPeople.Count, // Split equally among assigned people
                            Quantity = itemData.Quantity
                        };

                        _context.ItemAssignments.Add(assignment);
                        await _context.SaveChangesAsync();

                        var friendAssignment = new FriendAssignment
                        {
                            ItemAssignmentId = assignment.Id,
                            FriendId = friend.Id
                        };

                        _context.FriendAssignments.Add(friendAssignment);
                    }
                }
            }

            await _context.SaveChangesAsync();
            return receipt;
        }

        private async Task<List<ReceiptItemData>> MergeItems(List<ReceiptItemData> voiceItems, List<OCRItem> ocrItems)
        {
            var mergedItems = new List<ReceiptItemData>();

            // Use OCR items as base (more accurate prices)
            foreach (var ocrItem in ocrItems)
            {
                var voiceItem = voiceItems.FirstOrDefault(vi =>
                    IsSimilarItem(vi.Name, ocrItem.Name));

                var mergedItem = new ReceiptItemData
                {
                    Name = voiceItem?.Name ?? ocrItem.Name,
                    Price = ocrItem.Price, // Prefer OCR price (more accurate)
                    Quantity = ocrItem.Quantity,
                    AssignedPeople = voiceItem?.AssignedPeople ?? new List<string>()
                };

                mergedItems.Add(mergedItem);
            }

            // Add voice items that weren't found in OCR
            foreach (var voiceItem in voiceItems)
            {
                if (!mergedItems.Any(mi => IsSimilarItem(mi.Name, voiceItem.Name)))
                {
                    mergedItems.Add(voiceItem);
                }
            }

            return mergedItems;
        }

        private bool IsSimilarItem(string name1, string name2)
        {
            // Simple similarity check - could be enhanced with fuzzy matching
            return name1.ToLower().Contains(name2.ToLower()) ||
                   name2.ToLower().Contains(name1.ToLower());
        }

        private double CalculateConfidence(ReceiptData voiceData, OCRData ocrData)
        {
            var confidence = 0.5; // Base confidence

            // Check if totals match
            if (Math.Abs((double)(voiceData.Total - ocrData.Total)) < 1.0)
                confidence += 0.2;

            // Check if tax amounts match
            if (Math.Abs((double)(voiceData.Tax - ocrData.Tax)) < 0.5)
                confidence += 0.1;

            // Check if we have people assigned
            if (voiceData.People.Any())
                confidence += 0.1;

            // Check OCR confidence
            confidence += ocrData.ConfidenceScore * 0.1;

            return Math.Min(confidence, 1.0);
        }
    }
}