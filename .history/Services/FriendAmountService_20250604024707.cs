using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Services
{
    public class FriendAmountService
    {
        public decimal CalculateAmountToPay(Receipt receipt, int friendId)
        {
            // Calculate this friend's subtotal
            decimal friendSubtotal = 0;
            foreach (var item in receipt.Items)
            {
                foreach (var assignment in item.Assignments)
                {
                    if (assignment.FriendAssignments.Any(fa => fa.FriendId == friendId))
                    {
                        friendSubtotal += assignment.Price;
                    }
                }
            }

            int friendCount = receipt.Friends?.Count ?? 1;
            decimal tipsPerFriend = friendCount > 0 ? (decimal)receipt.Tips / friendCount : 0;
            decimal total = 0;
            if (receipt.TaxType == TaxType.Percentage)
            {
                total = friendSubtotal * (1 + (decimal)receipt.Tax / 100m) ;
            }
            else // Fixed
            {
                decimal taxPerFriend = friendCount > 0 ? (decimal)receipt.Tax / friendCount : 0;
                total = friendSubtotal + taxPerFriend ;
            }
            return total;
        }
    }
}