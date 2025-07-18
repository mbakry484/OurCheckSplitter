using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Sqlite;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.Controllers;
using AutoMapper;
using OurCheckSplitter.Api.Mappers;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.OpenApi.Models;

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
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "OurCheckSplitter API", Version = "v1" });
    c.EnableAnnotations();

    // Add JWT Bearer authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});
builder.Services.AddAutoMapper(typeof(ReceiptMapper));

// Register FirebaseAuthService
builder.Services.AddScoped<OurCheckSplitter.Api.Services.FirebaseAuthService>();

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

// Use Firebase authentication middleware
app.UseMiddleware<OurCheckSplitter.Api.Services.FirebaseAuthenticationMiddleware>();

// Add static files and default files support
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.Run();
