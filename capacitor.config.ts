import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gradeassist.app',
  appName: 'GradeAssist',
  webDir: 'out',
  // version: '2.9.0',  // Note: Capacitor n'a pas de champ version dans CapacitorConfig — géré dans build.gradle
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
