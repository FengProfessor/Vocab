import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lingopro.app',
  appName: 'LingoPro',
  webDir: 'out',
  server: {
    url: 'https://lingopro.online',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
};

export default config;
