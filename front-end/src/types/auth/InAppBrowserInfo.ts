/**
 * Represents the detected in-app browser or WebView context where Google OAuth is restricted.
 */
export interface InAppBrowserInfo {
  /** True when the current User-Agent matches an embedded WebView or social in-app browser. */
  isInApp: boolean;

  /** Display name of the host application (e.g., Zalo, Facebook, Instagram, LINE, TikTok, WebView). */
  appName: string | null;

  /** True when the device runs Android. */
  isAndroid: boolean;

  /** True when the device runs iOS (iPhone, iPad, iPod). */
  isIOS: boolean;
}
