// ***********************************************
// cypress/support/commands.ts
// Commandes personnalisées GradeAssist
// ***********************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Crée un nouveau module via le dialog de création.
       * @param name - Nom du module
       * @param type - 'atelier' | 'standard'
       */
      createModule(name: string, type?: 'atelier' | 'standard'): Chainable<void>;

      /**
       * Attend que l'application soit hydratée (localStorage chargé).
       */
      waitForApp(): Chainable<void>;

      /**
       * Sélectionne un module actif via le Select.
       * @param partialName - Partie du nom du module à sélectionner
       */
      selectModule(partialName: string): Chainable<void>;

      /**
       * Remplit un champ d'information étudiant.
       */
      fillStudentInfo(field: string, value: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('waitForApp', () => {
  // Attendre que la sélection de module soit visible
  cy.get('[placeholder="Sélectionner une matière..."], [data-placeholder="Sélectionner une matière..."]', { timeout: 10000 })
    .should('exist');
});

Cypress.Commands.add('createModule', (name: string, type: 'atelier' | 'standard' = 'atelier') => {
  // Clic sur le bouton "Nouveau" (trigger du dialog)
  cy.contains('button', 'Nouveau').click();

  // Attendre le dialog
  cy.get('[role="dialog"]').should('be.visible');

  // Saisir le nom
  cy.get('#module-name').clear().type(name);

  // Sélectionner le type
  if (type === 'standard') {
    cy.contains('label', 'Matière').click();
  } else {
    cy.contains('label', 'Atelier').click();
  }

  // Confirmer
  cy.contains('button', 'Créer').click();

  // Vérifier que le dialog se ferme
  cy.get('[role="dialog"]').should('not.exist');
});

Cypress.Commands.add('selectModule', (partialName: string) => {
  cy.get('[placeholder="Sélectionner une matière..."]')
    .closest('[data-radix-select-trigger]')
    .click();
  cy.contains('[role="option"]', partialName).click();
});

Cypress.Commands.add('fillStudentInfo', (field: string, value: string) => {
  cy.contains('label', field)
    .siblings('input')
    .first()
    .clear()
    .type(value);
});

export {};
