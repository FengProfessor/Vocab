import { InAppBrowserInfo } from '@/types/auth/InAppBrowserInfo';

/**
 * Detects embedded in-app browsers and WebViews (e.g., Zalo, Facebook, Instagram, TikTok)
 * where Google OAuth returns 403 disallowed_useragent, and builds external browser launch URLs.
 */
export class InAppBrowserDetector {
  private static readonly RULES: ReadonlyArray<{ pattern: RegExp; name: string }> = [
    { pattern: /Zalo/i, name: 'Zalo' },
    { pattern: /FBAN|FBAV|FB_IAB|FBIOS/i, name: 'Facebook' },
    { pattern: /Instagram/i, name: 'Instagram' },
    { pattern: /Line\//i, name: 'LINE' },
    { pattern: /MicroMessenger/i, name: 'WeChat' },
    { pattern: /TikTok|BytedanceWebview|musical_ly/i, name: 'TikTok' },
    { pattern: /Snapchat/i, name: 'Snapchat' },
    { pattern: /Twitter|X\/|X-Client/i, name: 'X (Twitter)' },
    { pattern: /LinkedInApp/i, name: 'LinkedIn' },
    { pattern: /Messenger/i, name: 'Messenger' },
    { pattern: /; wv\)/i, name: 'WebView' },
    { pattern: /iPhone|iPad|iPod/i, name: 'WebView' },
  ];

  /**
   * Inspects the User-Agent string to determine if the page is running inside an in-app browser.
   */
  public static detect(
    userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : '',
  ): InAppBrowserInfo {
    const ua = userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    let appName: string | null = null;
    for (const { pattern, name } of InAppBrowserDetector.RULES) {
      if (!pattern.test(ua)) {
        continue;
      }

      if (name === 'WebView' && isIOS) {
        const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
        const isChromeIOS = /CriOS/i.test(ua);
        if (isSafari || isChromeIOS) {
          continue;
        }
        if (/AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) {
          appName = 'trình duyệt trong app';
          break;
        }
        continue;
      }

      if (name === 'WebView' && isAndroid) {
        if (/Chrome\//i.test(ua) && !/; wv\)/i.test(ua)) {
          continue;
        }
        appName = 'WebView';
        break;
      }

      appName = name;
      break;
    }

    return {
      isInApp: Boolean(appName),
      appName,
      isAndroid,
      isIOS,
    };
  }

  /**
   * Builds an Android Chrome intent URL and plain HTTPS fallback URL to break out of an in-app WebView.
   */
  public static buildExternalBrowserUrl(pageUrl: string): { chromeIntent: string | null; plain: string } {
    try {
      const parsed = new URL(pageUrl);
      const chromeIntent = `intent://${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}#Intent;scheme=https;package=com.android.chrome;end`;
      return { chromeIntent, plain: pageUrl };
    } catch {
      return { chromeIntent: null, plain: pageUrl };
    }
  }
}
