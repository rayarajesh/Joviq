using System.Net;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Infrastructure.Services;
using Moq;

namespace Joviq.Lms.Tests;

public sealed class CertificatePdfGeneratorTests
{
    [Fact]
    public async Task CreatesPdfAttachmentWhenArtworkAssetsAreUnavailable()
    {
        using var httpClient = new HttpClient(new NotFoundHandler());
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(x => x.CreateClient("CertificatePdf")).Returns(httpClient);
        var generator = new CertificatePdfGenerator(factory.Object);

        var attachment = await generator.CreateAsync(new Certificate
        {
            CertificateId = "JOVIQ-20261015-TEST1234",
            StudentName = "Ravi Kumar",
            Type = Joviq.Lms.Domain.Enums.CertificateType.Training,
            VerificationUrl = "https://example.com/verify/joviq-test",
            QrCodeUrl = "https://example.com/qr.png",
            FromDate = new DateOnly(2026, 10, 14),
            ToDate = new DateOnly(2027, 4, 12)
        }, "Full Stack Web Development", default);

        Assert.Equal("application/pdf", attachment.ContentType);
        Assert.Equal("JOVIQ-20261015-TEST1234.pdf", attachment.FileName);
        var pdf = System.Text.Encoding.ASCII.GetString(attachment.Content);
        Assert.StartsWith("%PDF-1.4", pdf);
        Assert.Contains("JOVIQ-20261015-TEST1234", pdf);
        Assert.Contains("/Contents 7 0 R", pdf);
        Assert.Contains("7 0 obj\n<< /Length ", pdf);
        Assert.Contains("stream\nBT ", pdf);
        Assert.Contains("\nendstream\nendobj", pdf);
    }

    private sealed class NotFoundHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound) { RequestMessage = request });
    }
}
