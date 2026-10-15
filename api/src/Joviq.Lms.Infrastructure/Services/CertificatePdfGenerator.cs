using System.Globalization;
using System.IO.Compression;
using System.Net.Http;
using System.Text;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Domain.Entities;

namespace Joviq.Lms.Infrastructure.Services;

/// <summary>
/// Creates the same landscape certificate composition used by the web certificate viewer.
/// The artwork is kept as a JPEG background and the certificate-specific fields are drawn
/// into a small, dependency-free PDF so it can be attached directly to transactional email.
/// </summary>
public sealed class CertificatePdfGenerator(IHttpClientFactory httpClientFactory)
{
    private const double PageWidth = 841.89;
    private const double PageHeight = 595.28;
    private const double ArtworkWidth = 1600;
    private const double ArtworkHeight = 1131;
    private const string DefaultSignatory = "M VIJAYARAMARAJU";
    private const string DefaultSignatureText = "Executive Director";

    public async Task<EmailAttachment> CreateAsync(
        Certificate certificate,
        string programTitle,
        CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient("CertificatePdf");
        var templateName = certificate.Type.ToString().Equals("Internship", StringComparison.OrdinalIgnoreCase)
            ? "internship-template.jpg"
            : "training-template.jpg";
        var frontendOrigin = GetFrontendOrigin(certificate.VerificationUrl);
        var templateBytes = await DownloadOptionalAsync(
            client,
            $"{frontendOrigin}/assets/certificates/{templateName}",
            cancellationToken);
        var qrCodeBytes = string.IsNullOrWhiteSpace(certificate.QrCodeUrl)
            ? null
            : await DownloadOptionalAsync(client, AddJpegFormat(certificate.QrCodeUrl), cancellationToken);
        var signatureBytes = UsesDefaultSignature(certificate)
            ? await DownloadOptionalAsync(client, $"{frontendOrigin}/assets/certificate-signature.png", cancellationToken)
            : null;

        var pdf = BuildPdf(certificate, programTitle, templateBytes, qrCodeBytes, signatureBytes);
        return new EmailAttachment(
            $"{SanitizeFileName(certificate.CertificateId)}.pdf",
            "application/pdf",
            pdf);
    }

    private static async Task<byte[]?> DownloadOptionalAsync(HttpClient client, string url, CancellationToken cancellationToken)
    {
        try
        {
            return await client.GetByteArrayAsync(url, cancellationToken);
        }
        catch (HttpRequestException)
        {
            return null;
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return null;
        }
    }

    private static byte[] BuildPdf(
        Certificate certificate,
        string programTitle,
        byte[]? templateBytes,
        byte[]? qrCodeBytes,
        byte[]? signatureBytes)
    {
        var objects = new List<byte[]>
        {
            Ascii("<< /Type /Catalog /Pages 2 0 R >>"),
            Ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
            Array.Empty<byte>(),
            Ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
            Ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-BoldOblique >>"),
            Ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>")
        };

        var backgroundId = 0;
        if (templateBytes is { Length: > 0 })
        {
            backgroundId = objects.Count + 1;
            objects.Add(ImageObject(templateBytes, 1600, 1131));
        }

        var qrId = 0;
        if (qrCodeBytes is { Length: > 0 })
        {
            qrId = objects.Count + 1;
            var (qrWidth, qrHeight) = ReadJpegDimensions(qrCodeBytes);
            objects.Add(ImageObject(qrCodeBytes, qrWidth, qrHeight));
        }

        var signatureId = 0;
        if (signatureBytes is { Length: > 0 } && TryReadRgbaPng(signatureBytes) is { } signature)
        {
            var maskId = objects.Count + 1;
            objects.Add(FlateImageObject(signature.AlphaBytes, signature.Width, signature.Height, 1, null));
            signatureId = objects.Count + 1;
            objects.Add(FlateImageObject(signature.RgbBytes, signature.Width, signature.Height, 3, maskId));
        }

        var contentId = objects.Count + 1;
        objects.Add(ContentStreamObject(BuildContent(certificate, programTitle, backgroundId, qrId, signatureId)));
        objects[2] = Ascii(BuildPage(contentId, backgroundId, qrId, signatureId));
        return RenderDocument(objects);
    }

    private static string BuildPage(int contentId, int backgroundId, int qrId, int signatureId)
    {
        var xObjects = new StringBuilder();
        if (backgroundId > 0) xObjects.Append($"/Bg {backgroundId} 0 R ");
        if (qrId > 0) xObjects.Append($"/Qr {qrId} 0 R ");
        if (signatureId > 0) xObjects.Append($"/Sig {signatureId} 0 R ");
        return $"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PageWidth.ToString(CultureInfo.InvariantCulture)} {PageHeight.ToString(CultureInfo.InvariantCulture)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> /XObject << {xObjects}>> >> /Contents {contentId} 0 R >>";
    }

    private static string BuildContent(Certificate certificate, string programTitle, int backgroundId, int qrId, int signatureId)
    {
        var internship = certificate.Type.ToString().Equals("Internship", StringComparison.OrdinalIgnoreCase);
        var name = ToPdfText(certificate.StudentName);
        var program = ToPdfText(programTitle);
        var from = certificate.FromDate?.ToString("dd MMM yyyy", CultureInfo.InvariantCulture) ?? string.Empty;
        var to = certificate.ToDate?.ToString("dd MMM yyyy", CultureInfo.InvariantCulture) ?? string.Empty;
        var id = ToPdfText($"Certificate ID: {certificate.CertificateId}");
        var template = internship
            ? new CertificateLayout(800, 492, 1084, 574, 799, 616, 169, 841, 540, 770, 134, 878, 867, 898, [722, 840, 1014, 906], 726, 731, 300, 100)
            : new CertificateLayout(800, 560, 990, 629, 828, 671, 182, 1012, 553, 940, 134, 1107, 1009, 1041, [966, 982, 1250, 1052], 957, 873, 300, 100);

        var content = new StringBuilder();
        if (backgroundId > 0)
        {
            content.AppendLine($"q {Number(PageWidth)} 0 0 {Number(PageHeight)} 0 0 cm /Bg Do Q");
        }

        AddCenteredText(content, "/F2", 42, template.NameCenter, template.NameY, name, 0.18, 0.15, 0.41);
        AddText(content, "/F2", 12, template.ProgramX, template.ProgramY, program, 0.18, 0.15, 0.41);
        AddText(content, "/F2", 12, template.DateX, template.DateY, ToPdfText($"{from}  to  {to}"), 0.18, 0.15, 0.41);
        AddText(content, "/F3", 14, template.CertificateIdX, template.CertificateIdY, id, 0.23, 0.21, 0.45);

        if (qrId > 0)
        {
            AddImage(content, "/Qr", template.QrX, template.QrY, template.QrSize, template.QrSize);
        }

        if (signatureId > 0)
        {
            AddImage(content, "/Sig", template.SignatureX, template.SignatureY, template.SignatureWidth, template.SignatureHeight);
        }

        var signatory = certificate.AuthorizedSignatory?.Trim();
        var signatureText = certificate.SignatureText?.Trim();
        if (!string.IsNullOrWhiteSpace(signatory) &&
            (!signatory.Equals(DefaultSignatory, StringComparison.OrdinalIgnoreCase) ||
             !string.Equals(signatureText, DefaultSignatureText, StringComparison.OrdinalIgnoreCase)))
        {
            AddCover(content, template.SignatoryCover);
            AddCenteredText(content, "/F3", 12, template.SignatoryCenter, template.SignatoryTitleY, ToPdfText(signatureText ?? DefaultSignatureText), 0.23, 0.21, 0.45);
            AddCenteredText(content, "/F3", 12, template.SignatoryCenter, template.SignatoryNameY, ToPdfText(signatory.ToUpperInvariant()), 0.23, 0.21, 0.45);
        }

        return content.ToString();
    }

    private static void AddImage(StringBuilder content, string name, double x, double y, double width, double height)
    {
        var pdfX = x / ArtworkWidth * PageWidth;
        var pdfY = PageHeight - (y + height) / ArtworkHeight * PageHeight;
        var pdfWidth = width / ArtworkWidth * PageWidth;
        var pdfHeight = height / ArtworkHeight * PageHeight;
        content.AppendLine($"q {Number(pdfWidth)} 0 0 {Number(pdfHeight)} {Number(pdfX)} {Number(pdfY)} cm {name} Do Q");
    }

    private static void AddCover(StringBuilder content, int[] cover)
    {
        var x = cover[0] / ArtworkWidth * PageWidth;
        var y = PageHeight - cover[3] / ArtworkHeight * PageHeight;
        var width = (cover[2] - cover[0]) / ArtworkWidth * PageWidth;
        var height = (cover[3] - cover[1]) / ArtworkHeight * PageHeight;
        content.AppendLine($"q 1 1 1 rg {Number(x)} {Number(y)} {Number(width)} {Number(height)} re f Q");
    }

    private static void AddCenteredText(StringBuilder content, string font, double size, double centerX, double topY, string value, double r, double g, double b)
    {
        var estimatedWidth = Math.Min(centerX * 1.7, value.Length * size * 0.48);
        AddText(content, font, size, centerX - estimatedWidth / 2 / PageWidth * ArtworkWidth, topY, value, r, g, b);
    }

    private static void AddText(StringBuilder content, string font, double size, double artworkX, double artworkY, string value, double r, double g, double b)
    {
        var x = artworkX / ArtworkWidth * PageWidth;
        var y = PageHeight - artworkY / ArtworkHeight * PageHeight;
        content.AppendLine($"BT {font} {Number(size)} Tf {Number(r)} {Number(g)} {Number(b)} rg 1 0 0 1 {Number(x)} {Number(y)} Tm {value} Tj ET");
    }

    private static byte[] ImageObject(byte[] bytes, int width, int height)
    {
        var header = Ascii($"<< /Type /XObject /Subtype /Image /Width {width} /Height {height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length {bytes.Length} >>\nstream\n");
        using var stream = new MemoryStream(header.Length + bytes.Length + 16);
        stream.Write(header);
        stream.Write(bytes);
        stream.Write(Ascii("\nendstream"));
        return stream.ToArray();
    }

    private static byte[] FlateImageObject(byte[] bytes, int width, int height, int colors, int? softMaskId)
    {
        var softMask = softMaskId is > 0 ? $" /SMask {softMaskId} 0 R" : string.Empty;
        var header = Ascii($"<< /Type /XObject /Subtype /Image /Width {width} /Height {height} /ColorSpace /{(colors == 1 ? "DeviceGray" : "DeviceRGB")} /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors {colors} /BitsPerComponent 8 /Columns {width} >>{softMask} /Length {bytes.Length} >>\nstream\n");
        using var stream = new MemoryStream(header.Length + bytes.Length + 16);
        stream.Write(header);
        stream.Write(bytes);
        stream.Write(Ascii("\nendstream"));
        return stream.ToArray();
    }

    private static byte[] ContentStreamObject(string content)
    {
        var contentBytes = Ascii(content);
        var header = Ascii($"<< /Length {contentBytes.Length} >>\nstream\n");
        using var stream = new MemoryStream(header.Length + contentBytes.Length + 16);
        stream.Write(header);
        stream.Write(contentBytes);
        stream.Write(Ascii("\nendstream"));
        return stream.ToArray();
    }

    private static (int Width, int Height) ReadJpegDimensions(byte[] bytes)
    {
        for (var index = 2; index + 9 < bytes.Length; index++)
        {
            if (bytes[index] != 0xFF || bytes[index + 1] is 0x00 or 0xFF)
            {
                continue;
            }

            var marker = bytes[index + 1];
            var length = (bytes[index + 2] << 8) | bytes[index + 3];
            if (length < 7 || index + length + 2 > bytes.Length)
            {
                break;
            }

            if (marker is >= 0xC0 and <= 0xC3 or >= 0xC5 and <= 0xC7 or >= 0xC9 and <= 0xCB or >= 0xCD and <= 0xCF)
            {
                var height = (bytes[index + 5] << 8) | bytes[index + 6];
                var width = (bytes[index + 7] << 8) | bytes[index + 8];
                return (width, height);
            }

            index += length + 1;
        }

        return (180, 180);
    }

    private static RgbaPngData? TryReadRgbaPng(byte[] bytes)
    {
        try
        {
            if (bytes.Length < 33 || !bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }))
            {
                return null;
            }

            var offset = 8;
            var width = 0;
            var height = 0;
            var idat = new MemoryStream();
            while (offset + 12 <= bytes.Length)
            {
                var length = ReadUInt32BigEndian(bytes, offset);
                var dataOffset = offset + 8;
                if (length > int.MaxValue || dataOffset + (long)length + 4 > bytes.Length)
                {
                    return null;
                }

                var chunkType = Encoding.ASCII.GetString(bytes, offset + 4, 4);
                var chunkLength = (int)length;
                switch (chunkType)
                {
                    case "IHDR" when chunkLength >= 13:
                        width = (int)ReadUInt32BigEndian(bytes, dataOffset);
                        height = (int)ReadUInt32BigEndian(bytes, dataOffset + 4);
                        if (bytes[dataOffset + 8] != 8 || bytes[dataOffset + 9] != 6 || bytes[dataOffset + 12] != 0)
                        {
                            return null;
                        }

                        break;
                    case "IDAT":
                        idat.Write(bytes, dataOffset, chunkLength);
                        break;
                    case "IEND":
                        offset = bytes.Length;
                        continue;
                }

                offset = dataOffset + chunkLength + 4;
            }

            if (width <= 0 || height <= 0 || width > 10000 || height > 10000 || idat.Length == 0)
            {
                return null;
            }

            var rowBytes = checked(width * 4);
            var expectedLength = checked((rowBytes + 1) * height);
            byte[] decoded;
            idat.Position = 0;
            using (var zlib = new ZLibStream(idat, CompressionMode.Decompress, leaveOpen: true))
            using (var decodedStream = new MemoryStream(expectedLength))
            {
                zlib.CopyTo(decodedStream);
                decoded = decodedStream.ToArray();
            }

            if (decoded.Length < expectedLength)
            {
                return null;
            }

            var rgbRowBytes = checked(width * 3 + 1);
            var alphaRowBytes = checked(width + 1);
            var rgb = new byte[checked(rgbRowBytes * height)];
            var alpha = new byte[checked(alphaRowBytes * height)];
            var previous = new byte[rowBytes];
            var current = new byte[rowBytes];

            for (var row = 0; row < height; row++)
            {
                var sourceOffset = row * (rowBytes + 1);
                var filter = decoded[sourceOffset];
                for (var index = 0; index < rowBytes; index++)
                {
                    var raw = decoded[sourceOffset + index + 1];
                    var left = index >= 4 ? current[index - 4] : 0;
                    var up = previous[index];
                    var upLeft = index >= 4 ? previous[index - 4] : 0;
                    current[index] = filter switch
                    {
                        0 => raw,
                        1 => unchecked((byte)(raw + left)),
                        2 => unchecked((byte)(raw + up)),
                        3 => unchecked((byte)(raw + ((left + up) / 2))),
                        4 => unchecked((byte)(raw + PaethPredictor(left, up, upLeft))),
                        _ => throw new InvalidDataException("Unsupported PNG filter.")
                    };
                }

                var rgbOffset = row * rgbRowBytes;
                var alphaOffset = row * alphaRowBytes;
                rgb[rgbOffset] = 0;
                alpha[alphaOffset] = 0;
                for (var pixel = 0; pixel < width; pixel++)
                {
                    var sourcePixel = pixel * 4;
                    var rgbPixel = rgbOffset + 1 + pixel * 3;
                    rgb[rgbPixel] = current[sourcePixel];
                    rgb[rgbPixel + 1] = current[sourcePixel + 1];
                    rgb[rgbPixel + 2] = current[sourcePixel + 2];
                    alpha[alphaOffset + 1 + pixel] = current[sourcePixel + 3];
                }

                (previous, current) = (current, previous);
            }

            return new RgbaPngData(Compress(rgb), Compress(alpha), width, height);
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static int PaethPredictor(int left, int up, int upLeft)
    {
        var estimate = left + up - upLeft;
        var leftDistance = Math.Abs(estimate - left);
        var upDistance = Math.Abs(estimate - up);
        var upLeftDistance = Math.Abs(estimate - upLeft);
        return leftDistance <= upDistance && leftDistance <= upLeftDistance
            ? left
            : upDistance <= upLeftDistance ? up : upLeft;
    }

    private static byte[] Compress(byte[] bytes)
    {
        using var compressed = new MemoryStream();
        using (var zlib = new ZLibStream(compressed, CompressionLevel.SmallestSize, leaveOpen: true))
        {
            zlib.Write(bytes);
        }

        return compressed.ToArray();
    }

    private static uint ReadUInt32BigEndian(byte[] bytes, int offset)
        => ((uint)bytes[offset] << 24) |
           ((uint)bytes[offset + 1] << 16) |
           ((uint)bytes[offset + 2] << 8) |
           bytes[offset + 3];

    private static bool UsesDefaultSignature(Certificate certificate)
    {
        var signatory = certificate.AuthorizedSignatory?.Trim();
        var signatureText = certificate.SignatureText?.Trim();
        return (string.IsNullOrWhiteSpace(signatory) || signatory.Equals(DefaultSignatory, StringComparison.OrdinalIgnoreCase)) &&
               (string.IsNullOrWhiteSpace(signatureText) || signatureText.Equals(DefaultSignatureText, StringComparison.OrdinalIgnoreCase));
    }

    private static byte[] RenderDocument(IReadOnlyList<byte[]> objects)
    {
        using var stream = new MemoryStream();
        stream.Write(Ascii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
        var offsets = new List<long> { 0 };
        for (var index = 0; index < objects.Count; index++)
        {
            offsets.Add(stream.Position);
            stream.Write(Ascii($"{index + 1} 0 obj\n"));
            stream.Write(objects[index]);
            stream.Write(Ascii("\nendobj\n"));
        }

        var xrefOffset = stream.Position;
        stream.Write(Ascii($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n"));
        foreach (var offset in offsets.Skip(1))
        {
            stream.Write(Ascii($"{offset:0000000000} 00000 n \n"));
        }
        stream.Write(Ascii($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xrefOffset}\n%%EOF"));
        return stream.ToArray();
    }

    private static string ToPdfText(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var ascii = new string(normalized
            .Where(character => character < 128 && !char.GetUnicodeCategory(character).Equals(System.Globalization.UnicodeCategory.NonSpacingMark))
            .ToArray());
        return $"({ascii.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)")})";
    }

    private static string GetFrontendOrigin(string? verificationUrl)
        => Uri.TryCreate(verificationUrl, UriKind.Absolute, out var uri)
            ? uri.GetLeftPart(UriPartial.Authority).TrimEnd('/')
            : "https://joviqtechnologies.com";

    private static string AddJpegFormat(string url)
        => $"{url}{(url.Contains('?') ? '&' : '?')}format=jpg";

    private static string SanitizeFileName(string value)
        => string.IsNullOrWhiteSpace(value)
            ? "joviq-certificate"
            : string.Concat(value.Select(character => char.IsLetterOrDigit(character) || character is '-' or '_' ? character : '-'));

    private static byte[] Ascii(string value) => Encoding.ASCII.GetBytes(value);

    private static string Number(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);

    private sealed record CertificateLayout(
        double NameCenter,
        double NameY,
        double ProgramX,
        double ProgramY,
        double DateX,
        double DateY,
        double CertificateIdX,
        double CertificateIdY,
        double QrX,
        double QrY,
        double QrSize,
        double SignatoryCenter,
        double SignatoryTitleY,
        double SignatoryNameY,
        int[] SignatoryCover,
        double SignatureX,
        double SignatureY,
        double SignatureWidth,
        double SignatureHeight);

    private sealed record RgbaPngData(byte[] RgbBytes, byte[] AlphaBytes, int Width, int Height);
}
