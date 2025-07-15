using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using OurCheckSplitter.Api.Services;
using OurCheckSplitter.Api.Data;
using Microsoft.EntityFrameworkCore;
using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.Services
{
    public class FirebaseAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;

        public FirebaseAuthenticationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, FirebaseAuthService firebaseAuthService, OurCheckSplitterContext dbContext)
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                var decodedToken = await firebaseAuthService.VerifyIdTokenAsync(token);
                if (decodedToken != null)
                {
                    var firebaseUid = decodedToken.Uid;
                    var email = decodedToken.Claims.ContainsKey("email") ? decodedToken.Claims["email"].ToString() : null;
                    var displayName = decodedToken.Claims.ContainsKey("name") ? decodedToken.Claims["name"].ToString() : null;
                    var picture = decodedToken.Claims.ContainsKey("picture") ? decodedToken.Claims["picture"].ToString() : null;

                    // Find or create user
                    var user = await dbContext.AppUsers.FirstOrDefaultAsync(u => u.FirebaseUid == firebaseUid || u.Email == email);
                    if (user == null && email != null)
                    {
                        user = new AppUser
                        {
                            FirebaseUid = firebaseUid,
                            Email = email,
                            DisplayName = displayName ?? email,
                            ProfilePictureUrl = picture,
                            CreatedAt = DateTime.UtcNow,
                            LastLoginAt = DateTime.UtcNow
                        };
                        dbContext.AppUsers.Add(user);
                        await dbContext.SaveChangesAsync();
                    }
                    else if (user != null)
                    {
                        user.LastLoginAt = DateTime.UtcNow;
                        await dbContext.SaveChangesAsync();
                    }

                    // Attach user to context
                    context.Items["User"] = user;
                }
                else
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Invalid Firebase token.");
                    return;
                }
            }
            // else: allow unauthenticated requests to pass through (optional: restrict to only allow authenticated)
            await _next(context);
        }
    }
}