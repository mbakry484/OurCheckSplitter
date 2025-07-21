using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Services
{
    public class FriendAmountService
    {
        public decimal CalculateAmountToPay(Receipt receipt, int friendId)
        {
            decimal amountToPay = 0;
            foreach (var item in receipt.Items)
            {
                foreach (var assignment in item.Assignments)
                {
                    if (assignment.FriendAssignments.Any(fa => fa.FriendId == friendId))
                    {
                        amountToPay += assignment.Price;
                    }
                }
            }
            var friendCount = receipt.Friends.Count;
            var taxPerFriend = friendCount > 0 ? (decimal)receipt.Tax / friendCount : 0;
            var tipsPerFriend = friendCount > 0 ? (decimal)receipt.Tips / friendCount : 0;
            amountToPay += taxPerFriend + tipsPerFriend;
            return amountToPay;
        }
    }
}