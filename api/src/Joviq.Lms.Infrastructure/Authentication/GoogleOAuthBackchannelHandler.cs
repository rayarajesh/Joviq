using System.Net;

namespace Joviq.Lms.Infrastructure.Authentication;

internal sealed class GoogleOAuthBackchannelHandler(HttpMessageHandler innerHandler)
    : DelegatingHandler(innerHandler)
{
    private const int MaxAttempts = 3;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        if (request.Method != HttpMethod.Get)
        {
            return await base.SendAsync(request, cancellationToken);
        }

        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            var retryRequest = CloneRequest(request);

            try
            {
                var response = await base.SendAsync(retryRequest, cancellationToken);
                if (!IsTransient(response.StatusCode) || attempt == MaxAttempts)
                {
                    return response;
                }

                response.Dispose();
                retryRequest.Dispose();
            }
            catch (HttpRequestException) when (attempt < MaxAttempts && !cancellationToken.IsCancellationRequested)
            {
                retryRequest.Dispose();
            }

            await Task.Delay(TimeSpan.FromMilliseconds(150 * attempt), cancellationToken);
        }

        throw new InvalidOperationException("The Google OAuth backchannel retry loop completed unexpectedly.");
    }

    private static HttpRequestMessage CloneRequest(HttpRequestMessage request)
    {
        var clone = new HttpRequestMessage(request.Method, request.RequestUri)
        {
            Version = request.Version,
            VersionPolicy = request.VersionPolicy
        };

        foreach (var header in request.Headers)
        {
            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        return clone;
    }

    private static bool IsTransient(HttpStatusCode statusCode)
    {
        return statusCode is HttpStatusCode.RequestTimeout or
            HttpStatusCode.TooManyRequests or
            HttpStatusCode.BadGateway or
            HttpStatusCode.ServiceUnavailable or
            HttpStatusCode.GatewayTimeout;
    }
}
