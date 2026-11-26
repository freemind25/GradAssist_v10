/**
 * Version de l'application, injectée au build depuis package.json
 * (voir next.config.ts). Une seule source : ce module.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';
