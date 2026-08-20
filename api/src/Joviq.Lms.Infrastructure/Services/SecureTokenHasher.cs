using System.Security.Cryptography;
using System.Text;

namespace Joviq.Lms.Infrastructure.Services;

internal static class SecureTokenHasher
{
    public static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }

    public static string NewUrlSafeToken(int byteLength = 64)
    {
        var bytes = RandomNumberGenerator.GetBytes(byteLength);
        return Microsoft.IdentityModel.Tokens.Base64UrlEncoder.Encode(bytes);
    }

    public static string NewNumericCode(int length)
    {
        var min = (int)Math.Pow(10, length - 1);
        var max = (int)Math.Pow(10, length) - 1;
        return RandomNumberGenerator.GetInt32(min, max).ToString();
    }
}
