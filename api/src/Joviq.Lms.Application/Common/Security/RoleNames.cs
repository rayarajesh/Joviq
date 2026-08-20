namespace Joviq.Lms.Application.Common.Security;

public static class RoleNames
{
    public const string Admin = "Admin";
    public const string Mentor = "Mentor";
    public const string Student = "Student";

    public static readonly string[] All = [Admin, Mentor, Student];
}
