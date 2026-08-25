export type OAuthPopupMessage = {
  type: "joviq:oauth-complete";
  provider: "google";
  status: "success" | "error";
  returnUrl?: string;
  error?: string;
};

export function normalizeOAuthReturnUrl(returnUrl: string | null | undefined) {
  if (!returnUrl || !returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
    return "/dashboard";
  }

  return returnUrl;
}

export function openOAuthPopup(url: string) {
  const width = 520;
  const height = 680;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  return window.open(
    url,
    "joviq-google-oauth",
    [
      "popup=yes",
      `width=${width}`,
      `height=${height}`,
      `left=${Math.round(left)}`,
      `top=${Math.round(top)}`,
      "resizable=yes",
      "scrollbars=yes"
    ].join(",")
  );
}

export function isOAuthPopupMessage(event: MessageEvent): event is MessageEvent<OAuthPopupMessage> {
  return (
    event.origin === window.location.origin &&
    typeof event.data === "object" &&
    event.data !== null &&
    (event.data as OAuthPopupMessage).type === "joviq:oauth-complete" &&
    (event.data as OAuthPopupMessage).provider === "google"
  );
}

export function notifyOAuthPopupOpener(message: Omit<OAuthPopupMessage, "type" | "provider">) {
  if (!window.opener || window.opener.closed) {
    return false;
  }

  try {
    window.opener.postMessage(
      {
        type: "joviq:oauth-complete",
        provider: "google",
        ...message
      } satisfies OAuthPopupMessage,
      window.location.origin
    );
  } catch {
    return false;
  }

  return true;
}
