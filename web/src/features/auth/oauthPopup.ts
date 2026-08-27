export function normalizeOAuthReturnUrl(returnUrl: string | null | undefined) {
  if (!returnUrl || !returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
    return "/dashboard";
  }

  return returnUrl;
}
