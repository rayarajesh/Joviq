using System.Net;
using System.IO.Compression;
using System.Text;
using System.Globalization;
using System.Text.RegularExpressions;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Infrastructure.Services;
using Moq;

namespace Joviq.Lms.Tests;

public sealed class CertificatePdfGeneratorTests
{
    [Theory]
    [InlineData(CertificateType.Training, "JOVIQ-20261015-TEST1234")]
    [InlineData(CertificateType.Internship, "JOVIQ-20261015-TEST1234")]
    [InlineData(CertificateType.Training, "JOVIQ-20261015-WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW")]
    [InlineData(CertificateType.Internship, "JOVIQ-20261015-WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW")]
    public async Task CertificateIdEndsBeforeQrWithClearGap(CertificateType type, string certificateId)
    {
        using var httpClient = new HttpClient(new CertificateArtworkHandler());
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(x => x.CreateClient("CertificatePdf")).Returns(httpClient);
        var attachment = await new CertificatePdfGenerator(factory.Object).CreateAsync(new Certificate
        {
            CertificateId = certificateId, StudentName = "Ravi Kumar", Type = type,
            VerificationUrl = "https://example.com/verify/test", QrCodeUrl = "https://example.com/qr.png"
        }, "Full Stack Web Development", default);

        var pdf = Encoding.ASCII.GetString(attachment.Content);
        var text = Regex.Match(pdf, @"BT /F3 ([\d.]+) Tf .*?1 0 0 1 ([\d.]+) ([\d.]+) Tm \(Certificate ID: " + Regex.Escape(certificateId) + @"\) Tj");
        var qr = Regex.Match(pdf, @"q [\d.]+ 0 0 [\d.]+ ([\d.]+) [\d.]+ cm /Qr Do");
        Assert.True(text.Success);
        Assert.True(qr.Success);
        double Read(string value) => double.Parse(value, CultureInfo.InvariantCulture);
        // Independent standard Times-Roman advances for the test IDs and label.
        var widths = new Dictionary<char, int> { ['J'] = 389, ['O'] = 722, ['V'] = 722, ['I'] = 333,
            ['Q'] = 722, ['T'] = 611, ['E'] = 611, ['S'] = 556, ['W'] = 944, ['-'] = 333 };
        var emWidth = (6054 + certificateId.Sum(c => char.IsDigit(c) ? 500 : widths[c])) / 1000d;
        var rightEdge = Read(text.Groups[2].Value) + Read(text.Groups[1].Value) * emWidth;
        Assert.True(rightEdge <= Read(qr.Groups[1].Value) - 9.99, "The full ID must leave a 10-point gap before the QR.");
    }

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

    [Fact]
    public async Task IncludesQrAndDefaultSignatureInPdfWhenAssetsAreAvailable()
    {
        using var httpClient = new HttpClient(new CertificateArtworkHandler());
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(x => x.CreateClient("CertificatePdf")).Returns(httpClient);
        var generator = new CertificatePdfGenerator(factory.Object);

        var attachment = await generator.CreateAsync(new Certificate
        {
            CertificateId = "JOVIQ-20261015-ARTWORK",
            StudentName = "Ravi Kumar",
            Type = Joviq.Lms.Domain.Enums.CertificateType.Internship,
            VerificationUrl = "https://example.com/verify/joviq-artwork",
            QrCodeUrl = "https://example.com/qr.png",
            FromDate = new DateOnly(2026, 10, 14),
            ToDate = new DateOnly(2027, 4, 12)
        }, "Full Stack Web Development", default);

        var pdf = Encoding.ASCII.GetString(attachment.Content);
        Assert.Contains("/Qr 7 0 R", pdf);
        Assert.Contains("/Sig 9 0 R", pdf);
        Assert.Contains("/SMask 8 0 R", pdf);
        Assert.Contains("/Filter /FlateDecode", pdf);
    }

    private sealed class NotFoundHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound) { RequestMessage = request });
    }

    private sealed class CertificateArtworkHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.RequestUri?.AbsolutePath.EndsWith("/certificate-signature.png", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(CreateOnePixelRgbaPng()),
                    RequestMessage = request
                });
            }

            if (request.RequestUri?.AbsolutePath.EndsWith("/qr.png", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent([0xFF, 0xD8, 0xFF, 0xD9]),
                    RequestMessage = request
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound) { RequestMessage = request });
        }

        private static byte[] CreateOnePixelRgbaPng()
        {
            using var stream = new MemoryStream();
            stream.Write([137, 80, 78, 71, 13, 10, 26, 10]);
            AddChunk(stream, "IHDR", [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);

            using var compressed = new MemoryStream();
            using (var zlib = new ZLibStream(compressed, CompressionLevel.SmallestSize, leaveOpen: true))
            {
                zlib.Write([0, 0, 0, 0, 255]);
            }

            AddChunk(stream, "IDAT", compressed.ToArray());
            AddChunk(stream, "IEND", []);
            return stream.ToArray();
        }

        private static void AddChunk(Stream stream, string type, byte[] data)
        {
            WriteUInt32BigEndian(stream, (uint)data.Length);
            stream.Write(Encoding.ASCII.GetBytes(type));
            stream.Write(data);
            stream.Write([0, 0, 0, 0]);
        }

        private static void WriteUInt32BigEndian(Stream stream, uint value)
            => stream.Write([(byte)(value >> 24), (byte)(value >> 16), (byte)(value >> 8), (byte)value]);
    }
}
