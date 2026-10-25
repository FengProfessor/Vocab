export interface NextFontResult {
  className: string;
  variable: string;
  style: {
    fontFamily: string;
    fontWeight?: number;
    fontStyle?: string;
  };
}

function createFontFactory(familyName: string, defaultVariable: string) {
  return (options?: { variable?: string; [key: string]: unknown }): NextFontResult => ({
    className: '',
    variable: (typeof options?.variable === 'string' && options.variable) || defaultVariable,
    style: {
      fontFamily: `'${familyName}', system-ui, -apple-system, sans-serif`,
    },
  });
}

export const Be_Vietnam_Pro = createFontFactory('Be Vietnam Pro', '--font-be-vietnam-pro');
export const Inter = createFontFactory('Inter', '--font-inter');
export const Fraunces = createFontFactory('Fraunces', '--font-fraunces');
export const Plus_Jakarta_Sans = createFontFactory('Plus Jakarta Sans', '--font-plus-jakarta');
export const JetBrains_Mono = createFontFactory('JetBrains Mono', '--font-jetbrains-mono');
export const Playfair_Display = createFontFactory('Playfair Display', '--font-playfair');
export const Space_Grotesk = createFontFactory('Space Grotesk', '--font-space-grotesk');
export const Geist = createFontFactory('Geist', '--font-geist-sans');
export const Geist_Mono = createFontFactory('Geist Mono', '--font-geist-mono');
