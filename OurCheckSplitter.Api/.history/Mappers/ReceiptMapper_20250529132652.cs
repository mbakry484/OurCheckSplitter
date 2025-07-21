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
              opt => opt.MapFrom(src => src.FriendAssignments.Select(fa => fa.Friend)))
          .ForMember(dest => dest.UnitNumber,
              opt => opt.MapFrom((src, dest, _, context) =>
              {
                var item = context.Items["Item"] as Item;
                var assignments = item?.Assignments.OrderBy(a => a.Id).ToList() ?? new List<ItemAssignment>();
                return assignments.IndexOf(src) + 1;
              }))
          .ForMember(dest => dest.Unitlabel,
              opt => opt.MapFrom((src, dest, _, context) =>
              {
                var item = context.Items["Item"] as Item;
                var assignments = item?.Assignments.OrderBy(a => a.Id).ToList() ?? new List<ItemAssignment>();
                var unitNumber = assignments.IndexOf(src) + 1;
                return $"unit{unitNumber}";
              }));
    }
  }
}
