using AutoMapper;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Mappers
{
    public class ReceiptMapper :Profile
    {
      public ReceiptMapper() 
      {
            CreateMap<ReceiptDto, Receipt>();
            CreateMap<FriendWithAmountDto, Friend>();
            CreateMap<ItemDto, Item>();
            CreateMap<ItemAssignmentDto, ItemAssignment>();
                
      }  
    }
}
