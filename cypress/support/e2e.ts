// ***********************************************************
// cypress/support/e2e.ts
// Chargé automatiquement avant chaque fichier de spec.
// ***********************************************************

import './commands';

// Désactiver les erreurs uncaught non critiques (ex: ResizeObserver)
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('ResizeObserver') ||
    err.message.includes('Non-Error promise rejection') ||
    err.message.includes('hydration')
  ) {
    return false;
  }
  return true;
});
