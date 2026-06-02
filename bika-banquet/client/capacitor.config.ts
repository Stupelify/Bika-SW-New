import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const serverUrl =
  process.env.CAPACITOR_SERVER_URL || 'https://banquet.bikafood.com';

// Only the app's own origin may be navigated to at the top level; anything else
// (outbound links etc.) is handed off to the system browser.
const serverHost = (() => {
  try {
    return new URL(serverUrl).host;
  } catch {
    return 'banquet.bikafood.com';
  }
})();

const config: CapacitorConfig = {
  appId: 'com.bika.banquet',
  appName: 'Bika Banquet',
  webDir: 'public',
  server: {
    url: serverUrl,
    androidScheme: 'https',
    // Plaintext HTTP is only needed when pointing at a local dev box over the
    // LAN; it is never enabled for the production https build.
    cleartext: serverUrl.startsWith('http://'),
    allowNavigation: [serverHost],
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
    SplashScreen: {
      // Hidden as soon as the web app mounts (see CapacitorNativeShell). The
      // duration is only a safety net so a failed network load can't leave the
      // splash up forever.
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#0d9488',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
    },
  },
};

export default config;
