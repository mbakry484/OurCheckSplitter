using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Services
{
    public class FriendAmountService
    {
        public decimal CalculateAmountToPay(Receipt receipt, int friendId)
        {
            // Calculate subtotal for all items
            decimal subtotal = 0;
            foreach (var item in receipt.Items)
            {
                foreach (var assignment in item.Assignments)
                {
                    subtotal += assignment.Price;
                }
            }

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

            // Use the entered total as the source of truth
            decimal total = (decimal)receipt.Total;
            decimal friendShare = subtotal > 0 ? friendSubtotal / subtotal : 0;
            decimal amountToPay = total * friendShare;
            return amountToPay;
        }
    }
}