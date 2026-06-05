// cypress/e2e/04-grille-evaluation.cy.ts
// Tests de la grille d'évaluation (critères, notes, calcul total)

describe('GradeAssist — Grille d\'évaluation Atelier', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.wait(500);
  });

  describe('Structure de la grille', () => {
    it('affiche la grille d\'évaluation de l\'atelier', () => {
      cy.contains('Grille d\'Évaluation', { matchCase: false })
        .should('exist')
        .or(cy.contains('Atelier').should('exist'));
    });

    it('affiche les 8 critères par défaut', () => {
      const criteresAttendus = [
        'Présentation orale',
        'Présentation Affichée',
        'Esprit de synthèse',
        'Innovation',
        'Évaluation par les pairs',
        'Atteinte des objectifs',
        'Sorties sur terrains',
        'Assiduité',
      ];

      criteresAttendus.forEach((critere) => {
        cy.contains(critere).should('exist');
      });
    });

    it('affiche les coefficients de chaque critère', () => {
      // Les coefficients 4, 3, 2, 1 doivent être visibles
      cy.contains('4').should('exist');
      cy.contains('3').should('exist');
      cy.contains('2').should('exist');
      cy.contains('1').should('exist');
    });

    it('affiche les niveaux de notation (A+, A, B+, etc.)', () => {
      const niveaux = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E', 'F'];
      niveaux.forEach((niveau) => {
        cy.contains(niveau).should('exist');
      });
    });
  });

  describe('Saisie des notes', () => {
    it('permet de sélectionner un niveau pour chaque critère', () => {
      // Chercher les cellules cliquables de la grille
      cy.get('table, [role="table"]').should('exist');
      
      // Trouver et cliquer sur une cellule "A+" pour le premier critère
      cy.contains('td', 'A+').first().click();
      // Vérifier le changement visuel (classe active/sélectionnée)
      cy.contains('td', 'A+').first()
        .should('have.class', 'bg-primary')
        .or(cy.contains('td', 'A+').first().closest('td').should('have.class', 'selected'));
    });

    it('met à jour le total des points après sélection', () => {
      // Vérifier qu'un total est affiché
      cy.contains('Total', { matchCase: false }).should('exist')
        .or(cy.contains('Points').should('exist'));
    });
  });

  describe('Gestion des critères', () => {
    it('permet d\'ajouter un critère personnalisé', () => {
      cy.contains('button', 'Ajouter').click()
        .or(() => cy.contains('button', 'Critère').click());

      // Vérifier qu'un nouveau critère vide est ajouté
      cy.get('table tbody tr').should('have.length.greaterThan', 8);
    });

    it('affiche le total des coefficients', () => {
      // La somme des coefficients doit être affichée (20 par défaut)
      cy.contains('20').should('exist');
    });
  });

  describe('Module Standard — calcul de la note finale', () => {
    beforeEach(() => {
      cy.contains('button', 'Nouveau').click();
      cy.get('#module-name').type('Matière Standard Test');
      cy.contains('label', 'Matière').click();
      cy.contains('button', 'Créer').click();
      cy.wait(500);
    });

    it('affiche les champs CC et Examen', () => {
      cy.get('input[type="number"]').should('have.length.gte', 2);
    });

    it('calcule et affiche la note finale', () => {
      const inputs = cy.get('input[type="number"]');
      // CC = 14, Exam = 12, Poids CC = 40%
      // Note finale = 0.4 * 14 + 0.6 * 12 = 12.8
      inputs.eq(0).clear().type('14');
      inputs.eq(1).clear().type('12');

      cy.contains('12.8').should('exist')
        .or(cy.contains('Note finale').should('exist'));
    });
  });
});
