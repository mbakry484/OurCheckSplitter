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
            Console.WriteLine($"FirebaseAuth: Middleware called for {context.Request.Path}");
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                Console.WriteLine($"FirebaseAuth: Received token of length {token.Length}");
                Console.WriteLine($"FirebaseAuth: Token preview: {token.Substring(0, Math.Min(20, token.Length))}...");

                try
                {
                    var decodedToken = await firebaseAuthService.VerifyIdTokenAsync(token);
                    if (decodedToken != null)
                    {
                        var firebaseUid = decodedToken.Uid;
                        var email = decodedToken.Claims.ContainsKey("email") ? decodedToken.Claims["email"].ToString() : null;
                        var displayName = decodedToken.Claims.ContainsKey("name") ? decodedToken.Claims["name"].ToString() : null;
                        var picture = decodedToken.Claims.ContainsKey("picture") ? decodedToken.Claims["picture"].ToString() : null;

                        Console.WriteLine($"FirebaseAuth: Token verified successfully - UID: {firebaseUid}, Email: {email}");

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
                            Console.WriteLine($"FirebaseAuth: Created new user - ID: {user.Id}, Email: {user.Email}");
                        }
                        else if (user != null)
                        {
                            user.LastLoginAt = DateTime.UtcNow;
                            await dbContext.SaveChangesAsync();
                            Console.WriteLine($"FirebaseAuth: Found existing user - ID: {user.Id}, Email: {user.Email}");
                        }

                        // Attach user to context
                        context.Items["User"] = user;
                        Console.WriteLine($"FirebaseAuth: User attached to context - User is null: {user == null}");
                    }
                    else
                    {
                        Console.WriteLine("FirebaseAuth: Token verification failed - decodedToken is null");
                        // Don't return 401 here - let the request continue and let the controller handle it
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"FirebaseAuth: Exception during token verification: {ex.Message}");
                    Console.WriteLine($"FirebaseAuth: Exception type: {ex.GetType().Name}");
                    Console.WriteLine($"FirebaseAuth: Stack trace: {ex.StackTrace}");
                    // Don't return 401 here - let the request continue and let the controller handle it
                }
            }
            else
            {
                Console.WriteLine($"FirebaseAuth: No authorization header found for {context.Request.Path}");
            }
            // else: allow unauthenticated requests to pass through (optional: restrict to only allow authenticated)
            await _next(context);
        }
    }
}