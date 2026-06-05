// cypress/e2e/02-gestion-modules.cy.ts
// Tests de gestion des modules (création, sélection, suppression)

describe('GradeAssist — Gestion des modules', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.wait(500); // Attendre hydratation localStorage
  });

  // ─── Création ────────────────────────────────────────────────────────────────

  describe('Création d\'un module Atelier', () => {
    it('ouvre le dialog de création via le bouton "Nouveau"', () => {
      cy.contains('button', 'Nouveau').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Créer un Nouveau Module').should('be.visible');
    });

    it('ferme le dialog via "Annuler"', () => {
      cy.contains('button', 'Nouveau').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('button', 'Annuler').click();
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('crée un module de type Atelier avec un nom personnalisé', () => {
      cy.contains('button', 'Nouveau').click();
      cy.get('#module-name').type('Atelier Design Urbain S6');
      cy.contains('label', 'Atelier').click();
      cy.contains('button', 'Créer').click();

      // Le module doit apparaître dans le sélecteur
      cy.contains('Atelier Design Urbain S6').should('be.visible');
    });

    it('crée un module de type Standard (Matière)', () => {
      cy.contains('button', 'Nouveau').click();
      cy.get('#module-name').type('Histoire Architecture S3');
      cy.contains('label', 'Matière').click();
      cy.contains('button', 'Créer').click();

      cy.contains('Histoire Architecture S3').should('be.visible');
    });

    it('n\'accepte pas un module sans nom', () => {
      cy.contains('button', 'Nouveau').click();
      cy.get('#module-name').clear();
      cy.contains('button', 'Créer').click();
      // Le dialog doit rester ouvert (validation)
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('crée un module via le menu "Fichier"', () => {
      cy.contains('Fichier').click();
      cy.contains('Nouveau Module').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.get('#module-name').type('Module Via Menu');
      cy.contains('button', 'Créer').click();
      cy.contains('Module Via Menu').should('be.visible');
    });
  });

  // ─── Sélection ───────────────────────────────────────────────────────────────

  describe('Sélection du module actif', () => {
    beforeEach(() => {
      // Créer 2 modules supplémentaires pour les tests de sélection
      cy.contains('button', 'Nouveau').click();
      cy.get('#module-name').type('Module Alpha');
      cy.contains('button', 'Créer').click();
      cy.wait(300);

      cy.contains('button', 'Nouveau').click();
      cy.get('#module-name').type('Module Beta');
      cy.contains('button', 'Créer').click();
      cy.wait(300);
    });

    it('le dernier module créé devient le module actif', () => {
      cy.get('[role="combobox"]').should('contain.text', 'Module Beta');
    });

    it('peut basculer entre modules via le sélecteur', () => {
      cy.get('[role="combobox"]').click();
      cy.contains('[role="option"]', 'Module Alpha').click();
      cy.get('[role="combobox"]').should('contain.text', 'Module Alpha');
    });

    it('le compteur de modules dans le footer est correct', () => {
      // 1 (défaut) + 2 créés = 3 modules
      cy.get('footer').should('contain.text', '3 module(s)');
    });
  });

  // ─── Suppression ─────────────────────────────────────────────────────────────

  describe('Suppression d\'un module', () => {
    beforeEach(() => {
      cy.contains('button', 'Nouveau').click();
      cy.get('#module-name').type('Module À Supprimer');
      cy.contains('button', 'Créer').click();
      cy.wait(300);
    });

    it('affiche le bouton "Supprimer" quand plusieurs modules existent', () => {
      cy.contains('button', 'Supprimer').should('be.visible');
    });

    it('affiche une alerte de confirmation avant suppression', () => {
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="alertdialog"]').should('be.visible');
      cy.contains('Êtes-vous absolument sûr').should('be.visible');
    });

    it('annule la suppression via "Annuler"', () => {
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="alertdialog"]').should('be.visible');
      cy.contains('button', 'Annuler').click();
      cy.get('[role="alertdialog"]').should('not.exist');
      // Le module est toujours présent
      cy.contains('Module À Supprimer').should('be.visible');
    });

    it('supprime le module actif après confirmation', () => {
      cy.get('[role="combobox"]').click();
      cy.contains('[role="option"]', 'Module À Supprimer').click();
      cy.wait(200);

      cy.contains('button', 'Supprimer').click();
      cy.get('[role="alertdialog"]').should('be.visible');
      cy.get('[role="alertdialog"]').contains('button', 'Supprimer').click();

      cy.contains('Module À Supprimer').should('not.exist');
    });

    it('cache le bouton "Supprimer" quand un seul module reste', () => {
      // Supprimer jusqu'à n'en avoir qu'un
      const supprimerJusquAUn = () => {
        cy.get('footer').then(($footer) => {
          const text = $footer.text();
          const match = text.match(/(\d+) module/);
          if (match && parseInt(match[1]) > 1) {
            cy.contains('button', 'Supprimer').click();
            cy.get('[role="alertdialog"]').contains('button', 'Supprimer').click();
            cy.wait(300);
            supprimerJusquAUn();
          }
        });
      };
      supprimerJusquAUn();
      cy.contains('button', 'Supprimer').should('not.exist');
    });
  });

  // ─── Persistance ─────────────────────────────────────────────────────────────

  describe('Persistance des modules', () => {
    it('retrouve les modules après rechargement de la page', () => {
      cy.contains('button', 'Nouveau').click();
      cy.get('#module-name').type('Module Persistant');
      cy.contains('button', 'Créer').click();
      cy.wait(500);

      cy.reload();
      cy.wait(500);

      cy.contains('Module Persistant').should('be.visible');
    });
  });
});
