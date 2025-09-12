using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OurCheckSplitter.Api.Data;
using OurCheckSplitter.Api.Entities;
using OurCheckSplitter.Api.DTOs;
using OurCheckSplitter.Api.Services;

namespace OurCheckSplitter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly OurCheckSplitterContext _context;
        private readonly FirebaseAuthService _firebaseAuthService;

        public TestController(OurCheckSplitterContext context, FirebaseAuthService firebaseAuthService)
        {
            _context = context;
            _firebaseAuthService = firebaseAuthService;
        }
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                message = "API is working!",
                timestamp = DateTime.Now,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            });
        }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok("pong");
        }

        [HttpGet("debug-data")]
        public async Task<IActionResult> DebugData()
        {
            var user = HttpContext.Items["User"] as AppUser;

            // Test Firebase token verification directly
            var authHeader = HttpContext.Items["AuthorizationHeader"]?.ToString() ?? HttpContext.Request.Headers["Authorization"].ToString();
            var token = authHeader?.StartsWith("Bearer ") == true ? authHeader.Substring("Bearer ".Length).Trim() : null;

            var allUsers = await _context.AppUsers.ToListAsync();
            var allFriends = await _context.Friends.ToListAsync();
            var allReceipts = await _context.Receipts.ToListAsync();

            return Ok(new
            {
                currentUser = user != null ? new { user.Id, user.Email, user.DisplayName } : null,
                authHeader = authHeader,
                tokenLength = token?.Length,
                tokenPreview = token?.Substring(0, Math.Min(20, token?.Length ?? 0)) + "...",
                allUsers = allUsers.Select(u => new { u.Id, u.Email, u.DisplayName, u.FirebaseUid }).ToList(),
                allFriends = allFriends.Select(f => new { f.Id, f.Name, f.UserId }).ToList(),
                allReceipts = allReceipts.Select(r => new { r.Id, r.Name, r.UserId, r.Total }).ToList()
            });
        }

        [HttpGet("test-auth")]
        public async Task<IActionResult> TestAuth()
        {
            try
            {
                var authHeader = HttpContext.Items["AuthorizationHeader"]?.ToString() ?? HttpContext.Request.Headers["Authorization"].ToString();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    return Ok(new { error = "No Bearer token found", authHeader = authHeader });
                }

                var token = authHeader.Substring("Bearer ".Length).Trim();
                Console.WriteLine($"TestAuth: Testing token of length {token.Length}");

                var decodedToken = await _firebaseAuthService.VerifyIdTokenAsync(token);
                if (decodedToken == null)
                {
                    return Ok(new { error = "Token verification failed", tokenLength = token.Length });
                }

                var firebaseUid = decodedToken.Uid;
                var email = decodedToken.Claims.ContainsKey("email") ? decodedToken.Claims["email"].ToString() : null;
                var displayName = decodedToken.Claims.ContainsKey("name") ? decodedToken.Claims["name"].ToString() : null;

                // Find user in database
                var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.FirebaseUid == firebaseUid || u.Email == email);

                return Ok(new
                {
                    success = true,
                    firebaseUid = firebaseUid,
                    email = email,
                    displayName = displayName,
                    userInDb = user != null ? new { user.Id, user.Email, user.DisplayName } : null,
                    tokenLength = token.Length
                });
            }
            catch (Exception ex)
            {
                return Ok(new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("test-firebase-init")]
        public IActionResult TestFirebaseInit()
        {
            try
            {
                var firebaseApp = FirebaseAdmin.FirebaseApp.DefaultInstance;
                if (firebaseApp == null)
                {
                    return Ok(new { error = "Firebase App is not initialized", firebaseApp = "null" });
                }

                var firebaseAuth = FirebaseAdmin.Auth.FirebaseAuth.DefaultInstance;
                if (firebaseAuth == null)
                {
                    return Ok(new { error = "Firebase Auth is not initialized", firebaseAuth = "null" });
                }

                return Ok(new
                {
                    success = true,
                    firebaseApp = firebaseApp.Name,
                    firebaseAuth = "initialized",
                    projectId = firebaseApp.Options.ProjectId
                });
            }
            catch (Exception ex)
            {
                return Ok(new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("log-headers")]
        public IActionResult LogHeaders()
        {
            var headers = new Dictionary<string, string>();

            foreach (var header in HttpContext.Request.Headers)
            {
                headers[header.Key] = header.Value.ToString();
            }

            Console.WriteLine("=== REQUEST HEADERS ===");
            foreach (var header in headers)
            {
                Console.WriteLine($"{header.Key}: {header.Value}");
            }
            Console.WriteLine("=======================");

            // Check for Authorization header in multiple formats
            var authHeader = HttpContext.Request.Headers["Authorization"].ToString() ??
                           HttpContext.Request.Headers["authorization"].ToString() ??
                           HttpContext.Request.Headers["X-Authorization"].ToString();

            return Ok(new
            {
                message = "Headers logged to console",
                headers = headers,
                userAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                authorization = authHeader,
                authorizationCapital = HttpContext.Request.Headers["Authorization"].ToString(),
                authorizationLower = HttpContext.Request.Headers["authorization"].ToString(),
                authorizationX = HttpContext.Request.Headers["X-Authorization"].ToString()
            });
        }

    }
}