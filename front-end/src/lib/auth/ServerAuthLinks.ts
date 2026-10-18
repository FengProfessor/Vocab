const SERVER_ORIGIN = (import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:5000').replace(/\/$/, '');

/**
 * The only bridge between the SPA and the authentication server.
 * The SPA performs no sign-in, sign-up, OAuth or password operation itself: whenever the user must
 * authenticate or end the session, the browser is simply sent to the .NET server, which owns every
 * auth page and cookie. The SPA's sole auth-related API call is renewing an expired access cookie.
 */
export class ServerAuthLinks {
  /**
   * Absolute URL of the server login page that returns the user to `returnUrl` inside the SPA.
   */
  public static loginUrl(returnUrl: string): string {
    return `${SERVER_ORIGIN}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  /**
   * Hands the browser to the server's logout endpoint (a plain top-level form POST, not an AJAX call).
   * The server clears the HttpOnly cookies and redirects to its own login page.
   */
  public static logout(): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${SERVER_ORIGIN}/auth/logout`;
    document.body.appendChild(form);
    form.submit();
  }
}
