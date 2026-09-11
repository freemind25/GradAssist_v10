import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gradeassist.app',
  appName: 'GradeAssist',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://grad-assist-v10.vercel.app/',
    cleartext: false,
    allowNavigation: ['grad-assist-v10.vercel.app', 'accounts.google.com', 'www.googleapis.com'],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
