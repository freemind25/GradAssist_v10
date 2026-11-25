#!/usr/bin/env node
/**
 * Lance `next build`.
 *
 * Deux cibles de production coexistent :
 *
 *  - **Vercel / Electron** : build serveur classique (`output: "standalone"`).
 *    Les routes `/api/*` (auth, IA, health) font partie du build.
 *
 *  - **Capacitor / export statique** (`NEXT_STATIC_EXPORT=1`) : `output:
 *    "export"` produit un dossier `out/` de fichiers statiques. Next refuse
 *    alors toute route handler : `export const dynamic = "force-static"` est
 *    exigé, et le build échoue sur `/api/auth`. Or ces routes n'ont aucun sens
 *    dans un bundle embarqué (pas de serveur) : elles sont mises de côté le
 *    temps du build, puis restaurées, quel que soit le résultat.
 *
 * Le code source n'est donc jamais modifié durablement : `src/app/api` est
 * déplacé dans `.api-export-stash` (hors de `src/`), puis remis en place.
 * Un reliquat d'une exécution interrompue est réparé au démarrage.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const apiDir = path.join(root, "src", "app", "api");
const stashDir = path.join(root, ".api-export-stash");
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

function runNextBuild() {
  const result = spawnSync(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "build"],
    { cwd: root, stdio: "inherit", env: process.env }
  );
  return result.status === null ? 1 : result.status;
}

/** Remet `src/app/api` en place si une exécution précédente l'a laissé de côté. */
function repairInterruptedRun() {
  if (fs.existsSync(stashDir) && !fs.existsSync(apiDir)) {
    fs.renameSync(stashDir, apiDir);
    console.warn("[build] src/app/api restauré (exécution précédente interrompue).");
  }
}

repairInterruptedRun();

if (!isStaticExport) {
  process.exitCode = runNextBuild();
} else {
  let stashed = false;
  try {
    if (fs.existsSync(apiDir)) {
      fs.renameSync(apiDir, stashDir);
      stashed = true;
      console.log("[build] Export statique : routes /api/* exclues du bundle (sans serveur).");
    }
    process.exitCode = runNextBuild();
  } finally {
    if (stashed && fs.existsSync(stashDir)) {
      fs.renameSync(stashDir, apiDir);
    }
  }
}
