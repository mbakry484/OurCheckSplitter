using AutoMapper;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Mappers
{
  public class ReceiptMapper : Profile
  {
    public ReceiptMapper()
    {
      CreateMap<Receipt, ReceiptResponseDto>();
      CreateMap<Friend, FriendResponseDto>();
      CreateMap<Item, ItemResponseDto>();
      CreateMap<ItemAssignment, ItemAssignmentResponseDto>()
          .ForMember(dest => dest.AssignedFriends,
              opt => opt.MapFrom(src => src.FriendAssignments.Select(fa => fa.Friend)));
    }
  }
}
