using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Sqlite;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.Controllers;
using AutoMapper;
using OurCheckSplitter.Api.Mappers;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<OurCheckSplitterContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("OurCheckSplitter")));

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAutoMapper(typeof(ReceiptMapper));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.Run();
