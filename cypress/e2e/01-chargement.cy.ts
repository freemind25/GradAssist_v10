// cypress/e2e/01-chargement.cy.ts
// Tests de chargement initial et structure de l'application

describe('GradeAssist — Chargement initial', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('affiche le titre et le logo de l\'application', () => {
    cy.get('h1').should('contain.text', 'Grade');
    cy.get('h1').should('contain.text', 'Assist');
    cy.contains('Application d\'Évaluation Modulaire').should('be.visible');
  });

  it('affiche la mention "Designed by M.SADI"', () => {
    cy.contains('Designed by M.SADI').should('be.visible');
  });

  it('crée un module Atelier par défaut au premier chargement', () => {
    // Un module par défaut doit être présent
    cy.contains('Atelier Projet de Ville 1').should('exist');
  });

  it('affiche la barre de menu "Fichier"', () => {
    cy.contains('Fichier').should('be.visible');
  });

  it('affiche le sélecteur de module actif', () => {
    cy.contains('Module Actif').should('be.visible');
    cy.get('[role="combobox"]').should('exist');
  });

  it('affiche le bouton "Nouveau"', () => {
    cy.contains('button', 'Nouveau').should('be.visible');
  });

  it('affiche le footer avec l\'année courante', () => {
    const year = new Date().getFullYear().toString();
    cy.get('footer').should('contain.text', year);
    cy.get('footer').should('contain.text', 'GradeAssist');
  });

  it('persiste l\'état dans le localStorage', () => {
    cy.wait(500);
    cy.window().then((win) => {
      const stored = win.localStorage.getItem('gradeAssist_modules');
      expect(stored).to.not.be.null;
      const modules = JSON.parse(stored as string);
      expect(modules).to.be.an('array');
      expect(modules.length).to.be.greaterThan(0);
    });
  });
});
