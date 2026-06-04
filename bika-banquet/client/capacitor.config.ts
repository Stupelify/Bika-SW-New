import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

// CAPACITOR_BUILD=1 → ship the static bundle (client/out) inside the binary and
// load it locally: instant cold start + offline shell. Otherwise (default) the
// app loads the live site over the network, exactly as before.
const isBundled = process.env.CAPACITOR_BUILD === '1';
const serverUrl =
  process.env.CAPACITOR_SERVER_URL || 'https://banquet.bikafood.com';

const config: CapacitorConfig = {
  appId: 'com.bika.banquet',
  appName: 'Bika Banquet',
  webDir: isBundled ? 'out' : 'public',
  // Remote-load only in the non-bundled mode; the bundled build serves local assets.
  ...(isBundled
    ? {}
    : {
        server: {
          url: serverUrl,
          cleartext: true, // required for http local network test
        },
      }),
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
