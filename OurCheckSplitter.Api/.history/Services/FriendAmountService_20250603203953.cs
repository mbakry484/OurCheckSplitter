using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Services
{
    public class FriendAmountService
    {
        public decimal CalculateAmountToPay(Receipt receipt, int friendId)
        {
            decimal subtotal = 0;
            foreach (var item in receipt.Items)
            {
                foreach (var assignment in item.Assignments)
                {
                    if (assignment.FriendAssignments.Any(fa => fa.FriendId == friendId))
                    {
                        subtotal += assignment.Price;
                    }
                }
            }
            var friendCount = receipt.Friends.Count;
            decimal tipsPerFriend = friendCount > 0 ? (decimal)receipt.Tips / friendCount : 0;
            decimal total = 0;
            if (receipt.TaxType == TaxType.Percentage)
            {
                total = subtotal * (1 + (decimal)receipt.Tax / 100m) + tipsPerFriend;
            }
            else // Fixed
            {
                decimal taxPerFriend = friendCount > 0 ? (decimal)receipt.Tax / friendCount : 0;
                total = subtotal + taxPerFriend + tipsPerFriend;
            }
            return total;
        }
    }
}