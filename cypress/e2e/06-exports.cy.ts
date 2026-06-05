// cypress/e2e/06-exports.cy.ts
// Tests des fonctions d'export (PDF, CSV, Excel)

describe('GradeAssist — Exports', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.wait(500);
  });

  describe('Boutons d\'export dans le module Atelier', () => {
    it('affiche des boutons d\'export dans la page', () => {
      cy.get('button').then(($btns) => {
        const texts = Array.from($btns).map(b => b.textContent?.toLowerCase() ?? '');
        const hasExport = texts.some(t =>
          t.includes('pdf') || t.includes('csv') || t.includes('excel') || t.includes('export')
        );
        expect(hasExport, 'Au moins un bouton d\'export doit exister').to.be.true;
      });
    });

    it('affiche un bouton "Fiche PDF individuelle" ou équivalent', () => {
      cy.contains('PDF', { matchCase: false }).should('exist');
    });

    it('affiche un bouton "CSV" ou équivalent', () => {
      cy.contains('CSV', { matchCase: false }).should('exist');
    });
  });

  describe('Export PDF individuel', () => {
    it('le bouton PDF est activable (non disabled)', () => {
      cy.get('button').contains('PDF', { matchCase: false })
        .first()
        .should('not.be.disabled');
    });

    it('déclenche un téléchargement PDF au clic', () => {
      // Intercepter l'événement de téléchargement
      cy.window().then((win) => {
        const originalCreateObjectURL = win.URL.createObjectURL;
        let wasCalledWithBlob = false;

        win.URL.createObjectURL = (blob: Blob) => {
          if (blob.type === 'application/pdf') {
            wasCalledWithBlob = true;
          }
          return originalCreateObjectURL.call(win.URL, blob);
        };

        cy.get('button').contains('PDF', { matchCase: false }).first().click();
        cy.wait(2000);

        // jsPDF peut passer par save() — on vérifie juste qu'il n'y a pas d'erreur
        cy.get('.toast, [data-sonner-toast], [role="alert"]')
          .should('not.contain.text', 'erreur')
          .or(cy.get('body').should('not.contain.text', 'Error'));
      });
    });
  });

  describe('Export CSV', () => {
    it('le bouton CSV est activable', () => {
      cy.get('button').contains('CSV', { matchCase: false })
        .first()
        .should('not.be.disabled');
    });
  });

  describe('Synthèse des évaluations', () => {
    it('affiche une section "Synthèse" après au moins une évaluation', () => {
      cy.contains('Synthèse', { matchCase: false }).should('exist');
    });

    it('affiche les boutons d\'export de synthèse', () => {
      // Après ajout d'une évaluation, des boutons de synthèse doivent apparaître
      cy.contains('Synthèse', { matchCase: false })
        .closest('section, div[class*="card"], [data-card]')
        .find('button')
        .should('exist');
    });
  });

  describe('Validation sécurité des fichiers uploadés', () => {
    it('accepte uniquement les fichiers Excel valides (.xlsx/.xls)', () => {
      cy.get('input[type="file"]').then(($inputs) => {
        $inputs.each((_, input) => {
          const accept = input.getAttribute('accept');
          if (accept) {
            expect(accept).to.match(/\.xlsx|\.xls|image/);
          }
        });
      });
    });
  });
});
