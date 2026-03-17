import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.CAPACITOR_SERVER_URL || 'https://banquet.bikafood.com';

const config: CapacitorConfig = {
  appId: 'com.bika.banquet',
  appName: 'Bika Banquet',
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: false,
  },
  ios: {
    // Let the web view extend under the status bar / Dynamic Island.
    // Safe-area insets are then correctly exposed via env(safe-area-inset-*).
    contentInset: 'always',
    scrollEnabled: true,
  },
  plugins: {
    StatusBar: {
      // Overlay = true means the webview extends under the iOS status bar.
      // Our header already pads by var(--safe-top) = env(safe-area-inset-top).
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#ffffff00', // transparent — header background shows through
    },
  },
};

export default config;
