import { theme, type ThemeConfig } from '@/components/ui/Primitives';

/**
 * Ant Design design tokens mirrored into CSS custom properties so plain *.css / *.module.css files
 * follow the active Light/Dark theme without importing JS tokens.
 */
const MIRRORED_TOKENS: readonly string[] = [
  'colorPrimary',
  'colorPrimaryBg',
  'colorSuccess',
  'colorSuccessBg',
  'colorSuccessBorder',
  'colorWarning',
  'colorWarningBg',
  'colorWarningBorder',
  'colorError',
  'colorErrorBg',
  'colorErrorBorder',
  'colorInfo',
  'colorBgContainer',
  'colorBgElevated',
  'colorBgLayout',
  'colorFillAlter',
  'colorBorder',
  'colorBorderSecondary',
  'colorText',
  'colorTextSecondary',
  'colorTextTertiary',
  'borderRadius',
  'borderRadiusLG',
  'fontFamily',
];

const CSS_VAR_PREFIX = '--lp-';

/**
 * Converts a camelCase token name into a kebab-case CSS custom property name (colorBgContainer -> --lp-color-bg-container).
 */
function toCssVariableName(tokenName: string): string {
  return CSS_VAR_PREFIX + tokenName.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Writes the mirrored design tokens of the given Ant Design theme onto the document root element.
 */
export function applyThemeCssVariables(themeConfig: ThemeConfig): void {
  const resolved = theme.getDesignToken(themeConfig) as unknown as Record<string, string | number>;
  const root = document.documentElement;

  MIRRORED_TOKENS.forEach((tokenName) => {
    const value = resolved[tokenName];
    const cssValue = typeof value === 'number' ? `${value}px` : String(value);
    root.style.setProperty(toCssVariableName(tokenName), cssValue);
  });
}
