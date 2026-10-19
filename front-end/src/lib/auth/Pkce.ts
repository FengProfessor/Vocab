/** Storage keys for the in-flight Google OAuth (PKCE) handshake; cleared as soon as the callback finishes. */
const VERIFIER_KEY = 'lp:oauth:verifier';
const ROLE_KEY = 'lp:oauth:role';
const NEXT_KEY = 'lp:oauth:next';

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  view.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** RFC 7636 PKCE helper plus the tiny session state needed to finish a Google sign-in. */
export class Pkce {
  /** Creates a random 43-character verifier and its S256 challenge. */
  public static async create(): Promise<{ verifier: string; challenge: string }> {
    const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return { verifier, challenge: base64Url(digest) };
  }

  public static begin(verifier: string, role: string, next: string): void {
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(ROLE_KEY, role);
    sessionStorage.setItem(NEXT_KEY, next);
  }

  /** Reads and removes the handshake state so an authorization code can never be replayed. */
  public static consume(): { verifier: string; role: string; next: string } | null {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    const role = sessionStorage.getItem(ROLE_KEY) ?? 'Student';
    const next = sessionStorage.getItem(NEXT_KEY) ?? '/app';
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return verifier ? { verifier, role, next } : null;
  }
}
