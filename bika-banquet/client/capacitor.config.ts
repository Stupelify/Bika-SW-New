import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const serverUrl =
  process.env.CAPACITOR_SERVER_URL || 'https://banquet.bikafood.com';

const config: CapacitorConfig = {
  appId: 'com.bika.banquet',
  appName: 'Bika Banquet',
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: true, // required for http local network test
  },
  ios: {
    // WebView edge-to-edge; safe areas applied in CSS via env(safe-area-inset-*)
    contentInset: 'never',
    scrollEnabled: true,
  },
  android: {},
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000',
    },
  },
};

export default config;
