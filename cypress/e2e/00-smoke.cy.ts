// cypress/e2e/00-smoke.cy.ts
// Test de fumée — parcours critique de bout en bout.
//
// Ce spec remplace l'ancienne suite (`01-` à `07-`), écrite pour une version
// qui n'existe plus : elle attendait un sélecteur « Module Actif », un bouton
// « Nouveau » et des modules « Atelier Projet de Ville 1 ». Une suite rouge en
// permanence ne protège rien ; celle-ci suit l'interface réelle et tourne en CI.

describe("GradeAssist — parcours critique", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("/");
  });

  it("identifie l'enseignant en mode invité, crée une matière et la retrouve après rechargement", () => {
    // ── 1. Écran d'identification, puis application chargée ───────────────
    cy.contains("Identification de l'enseignant").should("be.visible");
    cy.loginAsGuest();
    cy.contains("button", "Fichier").should("be.visible");

    // ── 2. Création d'une matière classique ───────────────────────────────
    cy.createModule("Matière Smoke CC", "standard");

    // L'onglet du nouveau module affiche son type.
    cy.contains("button", "Matière Smoke CC").should("contain.text", "MATIÈRE");

    // ── 3. L'écran du module expose bien ses sections ─────────────────────
    ["Informations", "Évaluation", "Présences", "Rapports"].forEach((section) => {
      cy.contains("button", section).should("be.visible");
    });

    // ── 4. Persistance locale ─────────────────────────────────────────────
    // L'écriture est différée d'une seconde : on laisse le délai s'écouler.
    cy.wait(1200);
    cy.window().then((win) => {
      const stored = win.localStorage.getItem("gradeAssist_modules");
      expect(stored, "modules écrits dans le localStorage").to.not.be.null;
      const modules = JSON.parse(stored as string) as {
        name: string;
        type: string;
      }[];
      const created = modules.find((m) => m.name === "Matière Smoke CC");
      expect(created, "le module créé est enregistré").to.not.be.undefined;
      expect(created?.type).to.equal("standard");
    });

    // ── 5. Rechargement : le module est toujours là ───────────────────────
    cy.reload();
    cy.contains("button", "Matière Smoke CC").should("be.visible");
  });

  it("rappelle la sauvegarde puis la considère à jour après export", () => {
    cy.loginAsGuest();

    // Aucune sauvegarde n'a jamais été téléchargée : le rappel s'affiche.
    cy.contains("Vos données n'existent que dans ce navigateur").should(
      "be.visible"
    );
    cy.get("footer").should("contain.text", "Sauvegarde : aucune");

    // Télécharger la sauvegarde repart de zéro.
    cy.contains("button", "Télécharger une sauvegarde").click();
    cy.contains("Vos données n'existent que dans ce navigateur").should(
      "not.exist"
    );
    cy.get("footer").should("contain.text", "Sauvegarde : aujourd'hui");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("gradeAssist_lastBackupAt")).to.not.be
        .null;
    });
  });
});
