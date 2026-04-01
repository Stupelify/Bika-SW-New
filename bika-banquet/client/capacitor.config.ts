import type { CapacitorConfig } from '@capacitor/cli';

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
    // Setting this to 'never' ensures the WebView extends all the way 
    // to the edges of the device past the safe areas, removing black bars.
    contentInset: 'never',
    scrollEnabled: true,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000', // transparent
    },
  },
};

export default config;
