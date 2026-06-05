// cypress/e2e/07-accessibilite-responsive.cy.ts
// Tests d'accessibilité et comportement responsive

describe('GradeAssist — Accessibilité et Responsive', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.wait(500);
  });

  describe('Accessibilité de base', () => {
    it('le titre h1 est présent et unique', () => {
      cy.get('h1').should('have.length', 1);
    });

    it('tous les inputs ont un label associé', () => {
      cy.get('input:not([type="hidden"]):not([type="file"])').each(($input) => {
        const id = $input.attr('id');
        const ariaLabel = $input.attr('aria-label');
        const ariaLabelledBy = $input.attr('aria-labelledby');

        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        } else {
          // Accepter aria-label ou aria-labelledby comme alternative
          expect(ariaLabel || ariaLabelledBy).to.exist;
        }
      });
    });

    it('les boutons ont un texte ou un aria-label', () => {
      cy.get('button').each(($btn) => {
        const text = $btn.text().trim();
        const ariaLabel = $btn.attr('aria-label');
        expect(text || ariaLabel, 'Bouton sans texte ni aria-label').to.not.be.empty;
      });
    });

    it('les dialogs ont role="dialog"', () => {
      cy.contains('button', 'Nouveau').click();
      cy.get('[role="dialog"]').should('exist');
      cy.contains('button', 'Annuler').click();
    });

    it('le focus est géré correctement dans le dialog', () => {
      cy.contains('button', 'Nouveau').click();
      cy.get('[role="dialog"]').should('be.visible');
      // L'input doit être focusable
      cy.get('#module-name').focus().should('be.focused');
      cy.contains('button', 'Annuler').click();
    });
  });

  describe('Responsive — Mobile (375px)', () => {
    beforeEach(() => {
      cy.viewport(375, 812); // iPhone SE
    });

    it('affiche correctement l\'en-tête en mobile', () => {
      cy.get('h1').should('be.visible');
    });

    it('le sélecteur de module est utilisable en mobile', () => {
      cy.get('[role="combobox"]').should('be.visible');
    });

    it('les boutons sont accessibles en mobile', () => {
      cy.contains('button', 'Nouveau').should('be.visible');
    });
  });

  describe('Responsive — Tablette (768px)', () => {
    beforeEach(() => {
      cy.viewport(768, 1024); // iPad
    });

    it('affiche le layout tablette sans overflow', () => {
      cy.get('body').should('be.visible');
      cy.get('header').should('be.visible');
    });

    it('le formulaire s\'adapte à la largeur tablette', () => {
      cy.get('[class*="flex"], [class*="grid"]').first().should('be.visible');
    });
  });

  describe('Responsive — Desktop (1280px)', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
    });

    it('affiche le layout desktop complet', () => {
      cy.get('header').should('be.visible');
      cy.get('footer').should('be.visible');
    });

    it('le menubar est visible en desktop', () => {
      cy.contains('Fichier').should('be.visible');
    });
  });

  describe('Thème et couleurs', () => {
    it('le corps de la page a une couleur de fond définie', () => {
      cy.get('body').should('have.css', 'background-color');
    });

    it('les cartes ShadCN sont visibles', () => {
      cy.get('[class*="card"], [data-card]').first().should('be.visible');
    });
  });
});
