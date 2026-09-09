using System.Text.Json;
using System.Text.RegularExpressions;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Joviq.Lms.Infrastructure.Persistence;

public static class LmsSeedData
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var now = DateTimeOffset.UtcNow;
        var categories = new[]
        {
            new SeedCategory(
                "Computer Science & IT",
                "computer-science-it",
                "Software, cloud, data, cyber security, and AI programs built around live projects.",
                [
                    "Generative AI",
                    "Full Stack Web Development",
                    "Machine Learning",
                    "Cyber Security / Ethical Hacking",
                    "Data Analytics",
                    "Data Science",
                    "Cloud Computing",
                    "DevOps"
                ]),
            new SeedCategory(
                "Electrical & Electronics",
                "electrical-electronics",
                "Core engineering paths for embedded systems, VLSI, and semiconductor readiness.",
                [
                    "Embedded Systems",
                    "VLSI"
                ]),
            new SeedCategory(
                "Mechanical & Civil",
                "mechanical-civil",
                "CAD, drafting, design, mobility, and engineering portfolio programs.",
                [
                    "SolidWorks",
                    "Creo",
                    "AutoCAD",
                    "HEV Management"
                ]),
            new SeedCategory(
                "Management",
                "management",
                "Finance, marketing, analytics, HR, and business career tracks with portfolio outcomes.",
                [
                    "Finance",
                    "Stock Market",
                    "Digital Marketing",
                    "Business Analytics",
                    "IBM",
                    "HRM"
                ])
        };

        var sortOrder = 1;
        foreach (var categorySeed in categories)
        {
            var category = await dbContext.LearningProgramCategories
                .FirstOrDefaultAsync(x => x.Slug == categorySeed.Slug);

            if (category is null)
            {
                category = new LearningProgramCategory
                {
                    Id = Guid.NewGuid(),
                    Name = categorySeed.Name,
                    Slug = categorySeed.Slug,
                    Description = categorySeed.Description,
                    SortOrder = sortOrder,
                    IsPublished = true
                };
                dbContext.LearningProgramCategories.Add(category);
            }

            var programOrder = 1;
            foreach (var title in categorySeed.Programs)
            {
                var slug = ToSlug(title);
                if (await dbContext.LearningPrograms.AnyAsync(x => x.Slug == slug))
                {
                    programOrder++;
                    continue;
                }

                var program = CreateProgram(category, title, programOrder);
                dbContext.LearningPrograms.Add(program);
                AddPlans(dbContext, program);
                AddCurriculum(dbContext, program, title);
                AddProjects(dbContext, program, title);
                programOrder++;
            }

            sortOrder++;
        }

        if (!await dbContext.Coupons.AnyAsync(x => x.Code == "JOVIQEARLY"))
        {
            dbContext.Coupons.Add(new Coupon
            {
                Id = Guid.NewGuid(),
                Code = "JOVIQEARLY",
                Description = "Early learner launch discount",
                DiscountValue = 10,
                IsPercentage = true,
                IsActive = true
            });
        }

        await dbContext.SaveChangesAsync();
    }

    private static LearningProgram CreateProgram(LearningProgramCategory category, string title, int sortOrder)
    {
        var slug = ToSlug(title);
        var skills = BuildSkills(title);

        return new LearningProgram
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Category = category,
            Slug = slug,
            Title = title,
            ShortDescription = $"Build job-ready {title} skills through structured classes, practice labs, and real-time projects.",
            Overview = $"{title} is designed as a career-focused learning track. Learners move from fundamentals to practical implementation, complete real-time projects, get expert feedback, and prepare for interview conversations with portfolio proof.",
            Level = "Beginner to job-ready",
            Duration = "8 to 16 weeks",
            LearningMode = "Live + recorded + project practice",
            CertificationName = $"Joviq {title} Career Program Certification",
            ThumbnailUrl = ThumbnailFor(title),
            SkillsJson = Serialize(skills),
            OutcomesJson = Serialize([
                "Build a portfolio with real-time project evidence",
                "Explain domain concepts confidently in interviews",
                "Complete reviewed project work",
                "Prepare a resume, LinkedIn profile, and project walkthrough"
            ]),
            FaqsJson = JsonSerializer.Serialize(new[]
            {
                new { question = "Can beginners join?", answer = "Yes. The curriculum starts with foundations and moves into guided projects." },
                new { question = "Will I get projects?", answer = "Yes. Each program includes 5 to 6 real-time project examples and reviewed submissions." },
                new { question = "Is interview support included?", answer = "Career-track learners receive resume review, project explanation practice, and mock interview support." }
            }, JsonOptions),
            Status = ProgramStatus.Published,
            SortOrder = sortOrder
        };
    }

    private static void AddPlans(ApplicationDbContext dbContext, LearningProgram program)
    {
        var plans = new[]
        {
            new PlanSeed("Launch", "SELF", 8000m, 8000m, 1500m, [
                "Lesson Replays",
                "Complete Curriculum",
                "Projects",
                "LMS Access",
                "Certificate",
                "Basic Support"
            ]),
            new PlanSeed("Elevate", "INTERMEDIATE", 10000m, 10000m, 1500m, [
                "Live Sessions",
                "Project Reviews",
                "Resume Review",
                "Interview Preparation",
                "Priority Support"
            ]),
            new PlanSeed("Mastery", "MASTER", 15000m, 15000m, 3000m, [
                "Additional Live Sessions",
                "Advanced Project Reviews",
                "Portfolio Development",
                "Resume Optimization",
                "Mock Interviews",
                "Technical Interview Preparation",
                "HR Interview Preparation",
                "Career / Placement Assistance",
                "Priority Support"
            ])
        };

        for (var index = 0; index < plans.Length; index++)
        {
            var plan = plans[index];
            dbContext.ProgramPlans.Add(new ProgramPlan
            {
                Id = Guid.NewGuid(),
                ProgramId = program.Id,
                Program = program,
                Name = plan.Name,
                Code = plan.Code,
                ActualPrice = plan.ActualPrice,
                OfferPrice = plan.OfferPrice,
                ReserveAmount = plan.ReserveAmount,
                FeaturesJson = Serialize(plan.Features),
                IsActive = true,
                SortOrder = index + 1
            });
        }
    }

    private static void AddCurriculum(ApplicationDbContext dbContext, LearningProgram program, string title)
    {
        var modules = new[]
        {
            new ModuleSeed($"{title} Foundations", "Concepts, tools, workflows, and domain vocabulary."),
            new ModuleSeed("Project Implementation", "Build practical outputs with reviews and improvements."),
            new ModuleSeed("Career Readiness", "Portfolio polish and interview explanation practice.")
        };

        for (var moduleIndex = 0; moduleIndex < modules.Length; moduleIndex++)
        {
            var module = new CurriculumModule
            {
                Id = Guid.NewGuid(),
                ProgramId = program.Id,
                Program = program,
                Title = modules[moduleIndex].Title,
                Description = modules[moduleIndex].Description,
                SortOrder = moduleIndex + 1
            };
            dbContext.CurriculumModules.Add(module);

            for (var lessonIndex = 1; lessonIndex <= 3; lessonIndex++)
            {
                var lesson = new Lesson
                {
                    Id = Guid.NewGuid(),
                    ModuleId = module.Id,
                    Module = module,
                    Title = $"{modules[moduleIndex].Title} - Lesson {lessonIndex}",
                    Summary = "Structured lesson with notes, practice prompts, and project checkpoints.",
                    DurationMinutes = 45 + lessonIndex * 5,
                    AccessLevel = moduleIndex == 0 && lessonIndex == 1 ? ContentAccessLevel.Preview : ContentAccessLevel.Full,
                    VideoUrl = $"https://learn.joviq.com/videos/{program.Slug}/lesson-{moduleIndex + 1}-{lessonIndex}",
                    NotesUrl = $"https://learn.joviq.com/notes/{program.Slug}/lesson-{moduleIndex + 1}-{lessonIndex}",
                    SortOrder = lessonIndex
                };
                dbContext.Lessons.Add(lesson);
                dbContext.LessonResources.Add(new LessonResource
                {
                    Id = Guid.NewGuid(),
                    LessonId = lesson.Id,
                    Lesson = lesson,
                    Title = "Practice worksheet",
                    ResourceType = "Worksheet",
                    Url = $"https://learn.joviq.com/resources/{program.Slug}/worksheet-{moduleIndex + 1}-{lessonIndex}.pdf"
                });
            }
        }
    }

    private static void AddProjects(ApplicationDbContext dbContext, LearningProgram program, string title)
    {
        foreach (var projectTitle in ProjectIdeas(title))
        {
            dbContext.Projects.Add(new Project
            {
                Id = Guid.NewGuid(),
                ProgramId = program.Id,
                Program = program,
                Title = projectTitle,
                Description = $"A portfolio-ready {title} project with clear deliverables, review checkpoints, and interview talking points.",
                RequiredArtifactsJson = Serialize(["GitHub or document link", "Demo or screenshots", "Short project explanation"]),
                MaxScore = 100,
                IsPublished = true
            });
        }
    }

    private static IReadOnlyList<string> BuildSkills(string title)
    {
        return title switch
        {
            "Generative AI" => ["Prompt engineering", "RAG", "LLM apps", "Vector databases", "AI evaluation"],
            "Full Stack Web Development" => ["React", "ASP.NET Core", "PostgreSQL", "REST APIs", "Deployment"],
            "Machine Learning" => ["Python", "Model training", "Feature engineering", "Evaluation", "MLOps basics"],
            "Cyber Security / Ethical Hacking" => ["Networking", "Web security", "Vulnerability testing", "Reporting", "Security tools"],
            "Data Analytics" => ["Excel", "SQL", "Power BI", "Dashboards", "Business insights"],
            "Data Science" => ["Python", "SQL", "Machine learning", "Statistics", "Model deployment"],
            "Cloud Computing" => ["Cloud fundamentals", "Linux", "Networking", "Hosting", "Monitoring"],
            "DevOps" => ["Git", "CI/CD", "Docker", "Cloud deployment", "Observability"],
            "Embedded Systems" => ["C programming", "Microcontrollers", "Sensors", "Protocols", "Debugging"],
            "VLSI" => ["Digital design", "Verilog", "Timing analysis", "Verification", "Semiconductor basics"],
            "SolidWorks" => ["Part modeling", "Assemblies", "Drawings", "Simulation basics", "Design portfolio"],
            "Creo" => ["Parametric modeling", "Assemblies", "Drafting", "Surface design", "Manufacturing drawings"],
            "AutoCAD" => ["2D drafting", "3D basics", "Layering", "Civil drawings", "Annotation"],
            "HEV Management" => ["EV architecture", "Battery basics", "Powertrain", "Diagnostics", "Energy management"],
            "Finance" => ["Financial statements", "Excel modeling", "Valuation", "Reporting", "Business finance"],
            "Stock Market" => ["Market basics", "Technical analysis", "Risk management", "Portfolio tracking", "Trading psychology"],
            "Digital Marketing" => ["SEO", "Content marketing", "Ads", "Analytics", "Campaign planning"],
            "Business Analytics" => ["SQL", "Dashboards", "Statistics", "Case analysis", "Storytelling"],
            "IBM" => ["Enterprise tools", "Cloud concepts", "Data workflows", "Business process", "Project delivery"],
            "HRM" => ["Recruitment", "HR operations", "Employee engagement", "Payroll basics", "HR analytics"],
            _ => ["Foundation skills", "Tools", "Projects", "Interview preparation"]
        };
    }

    private static IReadOnlyList<string> ProjectIdeas(string title)
    {
        return title switch
        {
            "Generative AI" => [
                "Resume screening assistant",
                "Company policy chatbot",
                "AI interview question generator",
                "Document summarization workflow",
                "Customer support RAG bot"
            ],
            "Full Stack Web Development" => [
                "LMS dashboard",
                "Placement tracker",
                "E-commerce admin panel",
                "Job portal API",
                "Student project review system"
            ],
            "Data Science" => [
                "Customer churn prediction",
                "Sales forecasting model",
                "House price prediction",
                "Loan risk scoring",
                "Recommendation engine"
            ],
            "Data Analytics" => [
                "Sales dashboard",
                "Marketing performance report",
                "HR attrition dashboard",
                "Finance KPI tracker",
                "Operations analytics board"
            ],
            "Cyber Security / Ethical Hacking" => [
                "Web vulnerability report",
                "Network scan report",
                "Phishing awareness audit",
                "Secure login checklist",
                "Incident response playbook"
            ],
            "Cloud Computing" => [
                "Static website hosting",
                "Cloud cost dashboard",
                "Secure storage setup",
                "API deployment",
                "Monitoring alert workflow"
            ],
            "DevOps" => [
                "CI/CD pipeline for web app",
                "Dockerized API deployment",
                "Release automation board",
                "Log monitoring setup",
                "Infrastructure checklist"
            ],
            _ => [
                $"{title} portfolio project 1",
                $"{title} portfolio project 2",
                $"{title} portfolio project 3",
                $"{title} portfolio project 4",
                $"{title} portfolio project 5"
            ]
        };
    }

    private static string ThumbnailFor(string title)
    {
        return title switch
        {
            "Generative AI" or "Machine Learning" or "Data Science" => "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=82",
            "Full Stack Web Development" or "DevOps" or "Cloud Computing" => "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=82",
            "Cyber Security / Ethical Hacking" => "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=82",
            "Embedded Systems" or "VLSI" => "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=82",
            "SolidWorks" or "Creo" or "AutoCAD" or "HEV Management" => "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=82",
            _ => "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=82"
        };
    }

    private static string ToSlug(string value)
    {
        var slug = value.ToLowerInvariant().Replace("&", "and");
        slug = Regex.Replace(slug, @"[^a-z0-9]+", "-").Trim('-');
        return Regex.Replace(slug, "-{2,}", "-");
    }

    private static string Serialize(IEnumerable<string> values)
    {
        return JsonSerializer.Serialize(values, JsonOptions);
    }

    private sealed record SeedCategory(string Name, string Slug, string Description, IReadOnlyList<string> Programs);

    private sealed record PlanSeed(
        string Name,
        string Code,
        decimal ActualPrice,
        decimal OfferPrice,
        decimal ReserveAmount,
        IReadOnlyList<string> Features);

    private sealed record ModuleSeed(string Title, string Description);
}
