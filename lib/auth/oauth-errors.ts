export function oauthErrorMessage(error: string | null | undefined): string | null {
  if (!error) return null;

  switch (error) {
    case "oauth_email":
    case "OAuthAccountNotLinked":
      return "We need a verified email from that provider. Make the email public or use another sign-in method.";
    case "oauth_denied":
    case "AccessDenied":
      return "That sign-in method isn’t available for this account.";
    case "account_locked":
      return "This account is locked. Contact Good Code if you need it reopened.";
    case "Configuration":
      return "Social sign-in is not configured correctly.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "Callback":
      return "That sign-in didn’t complete. Try again.";
    default:
      return null;
  }
}
