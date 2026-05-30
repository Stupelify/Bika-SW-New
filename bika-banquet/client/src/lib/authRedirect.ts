export function shouldRedirectToLogin(
  isAuthenticated: boolean,
  isAuthReady: boolean,
  hasStoredToken: boolean
): boolean {
  return isAuthReady && !isAuthenticated && !hasStoredToken;
}
