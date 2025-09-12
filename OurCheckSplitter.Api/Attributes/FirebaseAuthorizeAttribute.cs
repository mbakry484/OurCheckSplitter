using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using OurCheckSplitter.Api.Services;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace OurCheckSplitter.Api.Attributes
{
    public class FirebaseAuthorizeAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            try
            {
                var authHeader = context.HttpContext.Request.Headers["Authorization"].ToString();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    context.Result = new UnauthorizedResult();
                    return;
                }

                var token = authHeader.Substring("Bearer ".Length).Trim();

                // Preserve the Authorization header for controllers to access
                context.HttpContext.Items["AuthorizationHeader"] = authHeader;
                Console.WriteLine($"FirebaseAuthorize: Verifying token of length {token.Length}");

                // Get services from DI container
                var firebaseAuthService = context.HttpContext.RequestServices.GetRequiredService<FirebaseAuthService>();
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<OurCheckSplitterContext>();

                var decodedToken = await firebaseAuthService.VerifyIdTokenAsync(token);
                if (decodedToken == null)
                {
                    Console.WriteLine("FirebaseAuthorize: Token verification failed");
                    context.Result = new UnauthorizedResult();
                    return;
                }

                var firebaseUid = decodedToken.Uid;
                var email = decodedToken.Claims.ContainsKey("email") ? decodedToken.Claims["email"].ToString() : null;
                var displayName = decodedToken.Claims.ContainsKey("name") ? decodedToken.Claims["name"].ToString() : null;

                Console.WriteLine($"FirebaseAuthorize: Token verified for {email}");

                // Find or create user
                var user = await dbContext.AppUsers.FirstOrDefaultAsync(u => u.FirebaseUid == firebaseUid || u.Email == email);
                if (user == null && email != null)
                {
                    user = new AppUser
                    {
                        FirebaseUid = firebaseUid,
                        Email = email,
                        DisplayName = displayName ?? email,
                        CreatedAt = DateTime.UtcNow,
                        LastLoginAt = DateTime.UtcNow
                    };
                    dbContext.AppUsers.Add(user);
                    await dbContext.SaveChangesAsync();
                    Console.WriteLine($"FirebaseAuthorize: Created new user - ID: {user.Id}, Email: {user.Email}");
                }
                else if (user != null)
                {
                    user.LastLoginAt = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync();
                    Console.WriteLine($"FirebaseAuthorize: Found existing user - ID: {user.Id}, Email: {user.Email}");
                }

                // Attach user to context
                context.HttpContext.Items["User"] = user;
                Console.WriteLine($"FirebaseAuthorize: User attached to context - User is null: {user == null}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"FirebaseAuthorize: Exception: {ex.Message}");
                context.Result = new UnauthorizedResult();
            }
        }
    }
}
