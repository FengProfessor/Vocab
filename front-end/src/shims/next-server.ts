/**
 * Compatibility shim for `next/server` (`NextRequest`, `NextResponse`, `userAgent`).
 * Allows all `/src/app/api/*` route handlers, `src/proxy.ts`, and `tests/*` suites
 * to execute seamlessly in Vite/Node without requiring a Next.js runtime.
 */

export interface ResponseCookie {
  name: string;
  value: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none' | boolean;
  maxAge?: number;
  expires?: Date | number;
  domain?: string;
}

class CookieStore {
  private map = new Map<string, ResponseCookie>();

  constructor(cookieHeader?: string | null) {
    if (cookieHeader) {
      for (const part of cookieHeader.split(';')) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const name = trimmed.slice(0, eqIdx).trim();
          const value = trimmed.slice(eqIdx + 1).trim();
          this.map.set(name, { name, value });
        }
      }
    }
  }

  get(name: string): { name: string; value: string } | undefined {
    const entry = this.map.get(name);
    return entry ? { name: entry.name, value: entry.value } : undefined;
  }

  getAll(): ResponseCookie[] {
    return Array.from(this.map.values());
  }

  has(name: string): boolean {
    return this.map.has(name);
  }

  set(
    nameOrOptions: string | ResponseCookie,
    value?: string,
    options?: Partial<ResponseCookie>
  ): this {
    if (typeof nameOrOptions === 'string') {
      this.map.set(nameOrOptions, {
        ...options,
        name: nameOrOptions,
        value: value ?? '',
      });
    } else {
      this.map.set(nameOrOptions.name, nameOrOptions);
    }
    return this;
  }

  delete(name: string): boolean {
    return this.map.delete(name);
  }
}

export class NextURL extends URL {
  clone(): NextURL {
    return new NextURL(this.href);
  }
}

export class NextRequest extends Request {
  public readonly nextUrl: NextURL;
  public readonly cookies: CookieStore;
  public readonly ip?: string;

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const urlStr =
      typeof input === 'string'
        ? input.startsWith('/')
          ? `http://localhost:3000${input}`
          : input
        : input instanceof URL
          ? input.href
          : input.url;
    super(urlStr, init);
    this.nextUrl = new NextURL(urlStr);
    this.cookies = new CookieStore(this.headers.get('cookie'));
  }
}

export class NextResponse<Body = unknown> extends Response {
  public readonly cookies: CookieStore;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
    this.cookies = new CookieStore(this.headers.get('set-cookie'));
  }

  static json<JsonBody>(body: JsonBody, init?: ResponseInit): NextResponse<JsonBody> {
    const headers = new Headers(init?.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json; charset=utf-8');
    }
    return new NextResponse<JsonBody>(JSON.stringify(body), {
      ...init,
      headers,
    });
  }

  static redirect(url: string | URL, init?: number | ResponseInit): NextResponse {
    const status = typeof init === 'number' ? init : init?.status ?? 307;
    const headers = new Headers(typeof init === 'object' ? init?.headers : undefined);
    headers.set('location', String(url));
    return new NextResponse(null, {
      ...(typeof init === 'object' ? init : {}),
      status,
      headers,
    });
  }

  static next(init?: ResponseInit & { request?: { headers?: Headers } }): NextResponse {
    return new NextResponse(null, {
      status: init?.status ?? 200,
      headers: init?.headers,
    });
  }

  static rewrite(destination: string | URL, init?: ResponseInit): NextResponse {
    const headers = new Headers(init?.headers);
    headers.set('x-middleware-rewrite', String(destination));
    return new NextResponse(null, {
      ...init,
      status: init?.status ?? 200,
      headers,
    });
  }
}

export function userAgent(request: { headers: Headers }) {
  const ua = request.headers.get('user-agent') || '';
  return {
    ua,
    isBot: /bot|crawler|spider|crawling/i.test(ua),
    browser: { name: undefined, version: undefined },
    device: { model: undefined, type: undefined, vendor: undefined },
    engine: { name: undefined, version: undefined },
    os: { name: undefined, version: undefined },
    cpu: { architecture: undefined },
  };
}
