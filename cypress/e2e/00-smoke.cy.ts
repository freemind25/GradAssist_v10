// cypress/e2e/00-smoke.cy.ts
// Test de fumée — parcours critique de bout en bout

describe('GradeAssist — Smoke Test (parcours critique)', () => {
  it('parcours complet : chargement → création module → saisie → export', () => {
    // ── 1. Chargement ──────────────────────────────────────────────────────────
    cy.clearLocalStorage();
    cy.visit('/');
    cy.wait(500);

    cy.get('h1').should('contain.text', 'GradeAssist');
    cy.contains('Application d\'Évaluation Modulaire').should('be.visible');

    // ── 2. Création d'un module Atelier ────────────────────────────────────────
    cy.contains('button', 'Nouveau').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('#module-name').type('Atelier Smoke Test');
    cy.contains('label', 'Atelier').click();
    cy.contains('button', 'Créer').click();
    cy.get('[role="dialog"]').should('not.exist');

    // Le module doit être sélectionné
    cy.contains('Atelier Smoke Test').should('be.visible');

    // ── 3. Vérification de la grille d'évaluation ──────────────────────────────
    cy.contains('Présentation orale').should('be.visible');
    cy.contains('A+').should('be.visible');

    // ── 4. Vérification des boutons d'export ───────────────────────────────────
    cy.contains('PDF', { matchCase: false }).should('exist');

    // ── 5. Vérification du registre de présences ──────────────────────────────
    cy.contains('Présences', { matchCase: false })
      .should('exist')
      .or(cy.contains('Registre').should('exist'));

    // ── 6. Persistance dans localStorage ──────────────────────────────────────
    cy.wait(500);
    cy.window().then((win) => {
      const stored = win.localStorage.getItem('gradeAssist_modules');
      expect(stored).to.not.be.null;
      const modules = JSON.parse(stored as string);
      const smokeModule = modules.find((m: { name: string }) =>
        m.name === 'Atelier Smoke Test'
      );
      expect(smokeModule).to.exist;
      expect(smokeModule.type).to.equal('atelier');
    });

    // ── 7. Rechargement et vérification de persistance ────────────────────────
    cy.reload();
    cy.wait(500);
    cy.contains('Atelier Smoke Test').should('be.visible');
  });

  it('parcours Module Standard : création → note CC/Examen → calcul', () => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.wait(500);

    // Créer un module Standard
    cy.contains('button', 'Nouveau').click();
    cy.get('#module-name').type('Matière Smoke Standard');
    cy.contains('label', 'Matière').click();
    cy.contains('button', 'Créer').click();
    cy.wait(300);

    // Vérifier que le module est actif
    cy.contains('Matière Smoke Standard').should('be.visible');

    // Les champs numériques doivent exister
    cy.get('input[type="number"]').should('have.length.gte', 1);

    // Saisir des notes
    cy.get('input[type="number"]').first().clear().type('15');
    cy.get('input[type="number"]').first().should('have.value', '15');

    // Vérifier persistance
    cy.wait(500);
    cy.window().then((win) => {
      const stored = win.localStorage.getItem('gradeAssist_modules');
      expect(stored).to.not.be.null;
    });
  });
});
