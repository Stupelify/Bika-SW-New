import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bika.banquet',
  appName: 'Bika Banquet',
  webDir: 'public',
  server: {
    url: 'https://banquet.bikafood.com',
    cleartext: false,
  },
};

export default config;
