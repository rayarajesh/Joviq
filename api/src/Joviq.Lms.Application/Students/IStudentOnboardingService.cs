namespace Joviq.Lms.Application.Students;

public interface IStudentOnboardingService
{
    Task<StudentOnboardingResponse> GetAsync(Guid userId, CancellationToken cancellationToken);

    Task<StudentOnboardingResponse> UpdatePersonalAsync(Guid userId, UpdatePersonalDetailsRequest request, CancellationToken cancellationToken);

    Task<StudentOnboardingResponse> UpdateAcademicAsync(Guid userId, UpdateAcademicDetailsRequest request, CancellationToken cancellationToken);

    Task<StudentOnboardingResponse> UpdateCareerAsync(Guid userId, UpdateCareerDetailsRequest request, CancellationToken cancellationToken);

    Task<StudentOnboardingResponse> SetResumeAsync(Guid userId, SetResumeRequest request, CancellationToken cancellationToken);

    Task<StudentOnboardingResponse> DeleteResumeAsync(Guid userId, CancellationToken cancellationToken);

    Task<StudentOnboardingResponse> CompleteAsync(Guid userId, CancellationToken cancellationToken);
}
