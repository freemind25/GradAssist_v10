// ***********************************************
// cypress/support/commands.ts
// Commandes personnalisées GradeAssist
// ***********************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Passe l'écran d'identification en mode invité, puis referme le
       * dialogue de configuration qui s'ouvre sur les modules vides.
       */
      loginAsGuest(): Chainable<void>;

      /**
       * Crée un module via le dialogue « Créer une nouvelle matière ».
       * @param name - Nom de la matière
       * @param type - 'atelier' | 'standard' | 'mooc'
       */
      createModule(
        name: string,
        type?: "atelier" | "standard" | "mooc"
      ): Chainable<void>;
    }
  }
}

const TYPE_LABELS = {
  atelier: "Atelier (Évaluation par critères)",
  standard: "Matière Classique (CC + Examen)",
  mooc: "Cours en ligne MOOC (CC + Examen)",
} as const;

Cypress.Commands.add("loginAsGuest", () => {
  cy.contains("button", "Continuer sans identification").click();
  cy.get("header").should("contain.text", "GradeAssist");

  // Les modules par défaut sont vides : l'application propose de les
  // configurer dès le chargement. On refuse, comme le ferait un enseignant.
  cy.get("body").then(($body) => {
    if ($body.find('[role="dialog"]').length > 0) {
      cy.get('[role="dialog"]').contains("button", "Annuler").click();
      cy.get('[role="dialog"]').should("not.exist");
    }
  });
});

Cypress.Commands.add(
  "createModule",
  (name: string, type: "atelier" | "standard" | "mooc" = "atelier") => {
    // Le libellé « Ajouter » est masqué sous 640 px : on s'appuie sur un
    // repère stable plutôt que sur le texte visible.
    cy.get('[data-testid="add-module"]').click();
    cy.get('[role="dialog"]').should(
      "contain.text",
      "Créer une nouvelle matière"
    );
    cy.get("#module-name").clear().type(name);
    cy.contains("label", TYPE_LABELS[type]).click();
    cy.contains("button", "Créer").click();
    cy.get('[role="dialog"]').should("not.exist");
    cy.contains("button", name).should("be.visible");
  }
);

export {};
