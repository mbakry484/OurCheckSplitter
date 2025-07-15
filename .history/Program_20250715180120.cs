using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Sqlite;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.Controllers;
using AutoMapper;
using OurCheckSplitter.Api.Mappers;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
var builder = WebApplication.CreateBuilder(args);

// Initialize Firebase Admin SDK
var firebaseCredentialsPath = builder.Configuration["Firebase:CredentialsPath"];
if (FirebaseApp.DefaultInstance == null)
{
    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromFile(firebaseCredentialsPath),
    });
}

builder.Services.AddDbContext<OurCheckSplitterContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("OurCheckSplitter")));

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAutoMapper(typeof(ReceiptMapper));

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS before controllers
app.UseCors("AllowAll");

// Add static files and default files support
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.Run();
