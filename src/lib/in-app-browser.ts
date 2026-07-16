/**
 * Phát hiện in-app browser / WebView — Google OAuth chặn (403 disallowed_useragent).
 */

export type InAppBrowserInfo = {
  isInApp: boolean;
  /** Zalo, FB, Line, Instagram, TikTok, … */
  appName: string | null;
  isAndroid: boolean;
  isIOS: boolean;
};

export function detectInAppBrowser(ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''): InAppBrowserInfo {
  const u = ua || '';
  const isAndroid = /Android/i.test(u);
  const isIOS = /iPhone|iPad|iPod/i.test(u);

  const rules: Array<{ re: RegExp; name: string }> = [
    { re: /Zalo/i, name: 'Zalo' },
    { re: /FBAN|FBAV|FB_IAB|FBIOS/i, name: 'Facebook' },
    { re: /Instagram/i, name: 'Instagram' },
    { re: /Line\//i, name: 'LINE' },
    { re: /MicroMessenger/i, name: 'WeChat' },
    { re: /TikTok|BytedanceWebview|musical_ly/i, name: 'TikTok' },
    { re: /Snapchat/i, name: 'Snapchat' },
    { re: /Twitter|X\/|X-Client/i, name: 'X (Twitter)' },
    { re: /LinkedInApp/i, name: 'LinkedIn' },
    { re: /Messenger/i, name: 'Messenger' },
    // Android WebView generic
    { re: /; wv\)/i, name: 'WebView' },
    // iOS WebView (không có Safari token đầy đủ)
    { re: /iPhone|iPad|iPod/i, name: 'WebView' },
  ];

  let appName: string | null = null;
  for (const { re, name } of rules) {
    if (!re.test(u)) continue;
    // iOS: chỉ coi WebView nếu KHÔNG có Safari (in-app hay thiếu Version/Safari)
    if (name === 'WebView' && /iPhone|iPad|iPod/i.test(u)) {
      const isSafari = /Safari/i.test(u) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(u);
      // Chrome iOS = CriOS — OK cho OAuth
      const isChromeIOS = /CriOS/i.test(u);
      if (isSafari || isChromeIOS) continue;
      // Có AppleWebKit nhưng không Safari → thường là WKWebView in-app
      if (/AppleWebKit/i.test(u) && !/Safari/i.test(u)) {
        appName = 'trình duyệt trong app';
        break;
      }
      continue;
    }
    if (name === 'WebView' && isAndroid) {
      // Android Chrome thật: Chrome/ + không "; wv)"
      if (/Chrome\//i.test(u) && !/; wv\)/i.test(u)) continue;
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

/** URL mở Chrome Android (intent). Fallback: https gốc. */
export function externalBrowserUrl(pageUrl: string): { chromeIntent: string | null; plain: string } {
  const plain = pageUrl;
  try {
    const u = new URL(pageUrl);
    // Android Chrome intent — mở ngoài WebView
    const chromeIntent = `intent://${u.host}${u.pathname}${u.search}${u.hash}#Intent;scheme=https;package=com.android.chrome;end`;
    return { chromeIntent, plain };
  } catch {
    return { chromeIntent: null, plain };
  }
}
