using FirebaseAdmin.Auth;
using System.Threading.Tasks;

namespace OurCheckSplitter.Api.Services
{
    public class FirebaseAuthService
    {
        public async Task<FirebaseToken?> VerifyIdTokenAsync(string idToken)
        {
            try
            {
                return await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"FirebaseAuth: Token verification error: {ex.Message}");
                Console.WriteLine($"FirebaseAuth: Exception type: {ex.GetType().Name}");
                return null;
            }
        }
    }
}