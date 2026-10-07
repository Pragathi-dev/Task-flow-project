using Microsoft.AspNetCore.Identity;
using TaskFlow.API.Entities;
using TaskFlow.API.Interfaces;

namespace TaskFlow.API.Services;

public class PasswordHasherService : IPasswordHasherService
{
    private readonly PasswordHasher<User> _hasher = new();

    public string HashPassword(User user, string password)
    {
        return _hasher.HashPassword(user, password);
    }

    public bool VerifyPassword(User user, string password, string hashedPassword)
    {
        var result = _hasher.VerifyHashedPassword(user, hashedPassword, password);
        return result != PasswordVerificationResult.Failed;
    }
}
