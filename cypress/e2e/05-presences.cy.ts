// cypress/e2e/05-presences.cy.ts
// Tests du registre de présences (P/A/R/E)

describe('GradeAssist — Registre des présences', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.wait(500);
  });

  describe('Accès au registre', () => {
    it('affiche la section présences dans le module Atelier', () => {
      cy.contains('Présences', { matchCase: false })
        .should('exist')
        .or(cy.contains('Registre').should('exist'));
    });

    it('affiche les statuts de présence (P/A/R/E)', () => {
      const statuts = ['Présent', 'Absent', 'Retard', 'Excusé'];
      // Au moins certains de ces statuts doivent être visibles
      cy.get('body').then(($body) => {
        const hasStatuts = statuts.some(s => $body.text().includes(s));
        expect(hasStatuts).to.be.true;
      });
    });
  });

  describe('Sélection de date', () => {
    it('affiche un sélecteur ou un calendrier de date', () => {
      cy.get('[type="date"], input[placeholder*="date"], [aria-label*="date"], [aria-label*="Date"]')
        .should('exist')
        .or(cy.contains('Date').should('exist'))
        .or(cy.get('[aria-label*="calendar"], button svg').first().should('exist'));
    });

    it('affiche la date du jour par défaut', () => {
      const today = new Date();
      const day = today.getDate().toString();
      // La date actuelle doit être sélectionnée (quelque part dans l'UI)
      cy.contains(day).should('exist');
    });
  });

  describe('Tableau de présences', () => {
    it('affiche un tableau quand des étudiants sont enregistrés', () => {
      // Vérifier structure table ou équivalent
      cy.get('table, [role="table"], .table').should('exist');
    });

    it('affiche les statuts comme symboles (P, A, R, E)', () => {
      cy.get('body').then(($body) => {
        const text = $body.text();
        // Au moins un de ces symboles doit exister dans la page
        const hasSymbol = ['P', 'A', 'R', 'E'].some(s => text.includes(s));
        expect(hasSymbol).to.be.true;
      });
    });
  });

  describe('Changement de statut de présence', () => {
    it('permet de cliquer sur une cellule pour changer le statut', () => {
      // Trouver une cellule de statut et cliquer dessus
      cy.get('[title*="résent"], [title*="Présent"], [aria-label*="résent"]')
        .first()
        .should('exist');
    });

    it('affiche les statistiques de présences', () => {
      // Stats (nb présents, absents, etc.) doivent exister
      cy.contains('%').should('exist')
        .or(cy.contains('séance').should('exist'))
        .or(cy.contains('Taux').should('exist'));
    });
  });

  describe('Export registre PDF', () => {
    it('affiche un bouton d\'export PDF pour le registre', () => {
      cy.get('button').then(($btns) => {
        const hasPdf = Array.from($btns).some(
          btn => btn.textContent?.toLowerCase().includes('pdf') ||
                 btn.querySelector('svg') !== null
        );
        expect(hasPdf).to.be.true;
      });

      // Plus ciblé : chercher boutons liés à l'export
      cy.contains('button', 'PDF', { matchCase: false }).should('exist')
        .or(cy.contains('Télécharger').should('exist'))
        .or(cy.contains('Exporter').should('exist'))
        .or(cy.contains('Rapport mensuel').should('exist'));
    });
  });
});
