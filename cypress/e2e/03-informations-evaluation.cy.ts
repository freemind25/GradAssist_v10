// cypress/e2e/03-informations-evaluation.cy.ts
// Tests du formulaire d'informations étudiant/projet

describe('GradeAssist — Informations du projet et étudiants', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.wait(500);
  });

  describe('Formulaire Atelier — informations générales', () => {
    it('affiche le formulaire d\'informations dans le module actif', () => {
      // Le module par défaut est un Atelier
      cy.contains('Informations').should('exist');
    });

    it('permet de saisir les noms des étudiants', () => {
      cy.get('input[placeholder*="tudiant"], input[placeholder*="étudiant"], input[placeholder*="Étudiant"]')
        .first()
        .should('exist')
        .clear()
        .type('BENALI Karim');

      cy.get('input[placeholder*="tudiant"], input[placeholder*="étudiant"], input[placeholder*="Étudiant"]')
        .first()
        .should('have.value', 'BENALI Karim');
    });

    it('permet de saisir le nom du projet', () => {
      cy.get('input[placeholder*="rojet"], input[placeholder*="Projet"]')
        .first()
        .clear()
        .type('Requalification du centre historique');
      
      cy.get('input[placeholder*="rojet"], input[placeholder*="Projet"]')
        .first()
        .should('have.value', 'Requalification du centre historique');
    });

    it('permet de saisir le nom de l\'université', () => {
      cy.get('input[placeholder*="niversit"], input[placeholder*="Université"]')
        .first()
        .clear()
        .type('Université Mouloud Mammeri');

      cy.get('input[placeholder*="niversit"], input[placeholder*="Université"]')
        .first()
        .should('have.value', 'Université Mouloud Mammeri');
    });

    it('permet de saisir l\'année académique', () => {
      cy.get('input[placeholder*="Année"], input[placeholder*="nnée"], input[placeholder*="cadémique"]')
        .first()
        .clear()
        .type('2024-2025');

      cy.get('input[placeholder*="Année"], input[placeholder*="nnée"], input[placeholder*="cadémique"]')
        .first()
        .should('have.value', '2024-2025');
    });

    it('permet d\'ajouter plusieurs enseignants', () => {
      // Chercher le champ pour les enseignants
      cy.get('input[placeholder*="nseignant"], input[placeholder*="Enseignant"], input[placeholder*="Prof"]')
        .first()
        .clear()
        .type('Dr. SADI M.');

      cy.get('input[placeholder*="nseignant"], input[placeholder*="Enseignant"], input[placeholder*="Prof"]')
        .first()
        .should('have.value', 'Dr. SADI M.');
    });
  });

  describe('Formulaire Standard (Matière) — notes CC et Examen', () => {
    beforeEach(() => {
      // Créer un module standard
      cy.contains('button', 'Nouveau').click();
      cy.get('#module-name').type('Histoire Architecture S3');
      cy.contains('label', 'Matière').click();
      cy.contains('button', 'Créer').click();
      cy.wait(500);
    });

    it('affiche les champs de note CC et Examen', () => {
      cy.contains('Contrôle Continu', { matchCase: false }).should('exist')
        .or(cy.contains('CC').should('exist'))
        .or(cy.get('input[type="number"]').should('exist'));
    });

    it('accepte des valeurs numériques pour les notes', () => {
      cy.get('input[type="number"]').first().clear().type('13.5');
      cy.get('input[type="number"]').first().should('have.value', '13.5');
    });
  });

  describe('Upload du logo', () => {
    it('affiche un bouton ou zone d\'upload pour le logo', () => {
      cy.get('input[type="file"], [aria-label*="logo"], [aria-label*="Logo"]')
        .should('exist')
        .or(cy.contains('Logo').should('exist'));
    });
  });

  describe('Persistance des informations', () => {
    it('conserve les données saisies après rechargement', () => {
      // Remplir un champ identifiable
      cy.get('input[placeholder*="rojet"], input[placeholder*="Projet"]')
        .first()
        .clear()
        .type('Projet Test Persistance');

      cy.wait(1000); // Attendre sauvegarde localStorage

      cy.reload();
      cy.wait(500);

      cy.get('input[placeholder*="rojet"], input[placeholder*="Projet"]')
        .first()
        .should('have.value', 'Projet Test Persistance');
    });
  });
});
