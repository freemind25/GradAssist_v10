/**
 * Extraction des noms d'étudiants depuis les lignes d'un tableau Excel
 * (résultat de XLSX.utils.sheet_to_json(worksheet, { header: 1 })).
 *
 * Le format visé ici est un tableau avec en-tête explicite, typiquement :
 *   N° | Nom | Prénom
 *
 * Règle : on ne garde que les lignes contenant à la fois un Nom et un Prénom.
 * La colonne « N° » est ignorée. Les lignes où Nom/Prénom sont vides sont sautées
 * (elles correspondent à des lignes vierges sous les en-têtes).
 *
 * Formats acceptés supplémentaires (en cas d'anciens exports) :
 *  - « Nom » et « Prénom » dans deux colonnes séparées → fusion automatique ;
 *  - une colonne unique « Nom et Prénom » / « Nom complet » (cellules déjà fusionnées) ;
 *  - un tableau sans en-tête reconnu → repli historique (voir fin de fonction).
 * Une colonne « numéro » / « N° » éventuelle est simplement ignorée.
 */

const normalizeHeader = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

// Détection des colonnes via la ligne d'en-tête (1ʳᵉ ligne).
const detectColumns = (headerCells: string[]) => {
  // /\bnom\b/ évite de confondre « prénom » (qui contient « nom ») avec une colonne Nom.
  // Colonne unique déjà fusionnée : « Nom et Prénom », « Nom & Prénom », « Nom complet »…
  const fullNameColIdx = headerCells.findIndex(
    (cell) => /\bnom\b/.test(cell) && /prenom/.test(cell),
  );
  const nomColIdx = headerCells.findIndex((cell) => /\bnom\b/.test(cell));
  // Détection robuste du prénom : « Prénom », « Prenom », « Prénom » sans accents…
  const prenomOnlyColIdx = headerCells.findIndex(
    (cell) => /prenom/.test(cell) && !/\bnom\b/.test(cell),
  );
  return { fullNameColIdx, nomColIdx, prenomOnlyColIdx };
};

export function extractStudentNames(rows: unknown[]): string[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const headerCells: string[] = Array.isArray(rows[0])
    ? (rows[0] as unknown[]).map(normalizeHeader)
    : [];
  const { fullNameColIdx, nomColIdx, prenomOnlyColIdx } = detectColumns(headerCells);

  return rows
    .slice(1) // On ignore la ligne d'en-tête.
    .map((row) => {
      if (!Array.isArray(row)) return null;
      const cells = row.map((cell) => String(cell ?? '').trim());

      // Colonne « Nom et Prénom » unique (déjà fusionnée dans le fichier).
      if (fullNameColIdx >= 0) {
        return cells[fullNameColIdx] || null;
      }

      // Colonnes « Nom » et « Prénom » séparées → fusion en nom complet.
      // Comportement principal visé par ce chantier (N° | Nom | Prénom).
      // Variante robuste : colonnes « Nom » / « Prénom » dans n'importe quel ordre,
      // y compris « Prenom » sans accent.
      const hasNom = nomColIdx >= 0;
      const hasPrenom = prenomOnlyColIdx >= 0;
      if (hasNom || hasPrenom) {
        const nom = hasNom ? (cells[nomColIdx] ?? '') : '';
        const prenom = hasPrenom ? (cells[prenomOnlyColIdx] ?? '') : '';
        if (nom && prenom) return `${nom} ${prenom}`;
        if (nom) return nom;
        if (prenom) return prenom;
        return null;
      }

      // Repli historique : deux premières colonnes utiles, en ignorant une 1ʳᵉ
      // colonne purement numérique (ex. un numéro) lorsque l'en-tête est absent.
      let startIdx = 0;
      if (cells.length > 1 && cells[0] !== '' && /^[\\d.,:;/-]+$/.test(cells[0])) {
        startIdx = 1;
      }
      const col0 = cells[startIdx] ?? '';
      const col1 = cells[startIdx + 1] ?? '';
      if (col0 && col1) return `${col0} ${col1}`;
      if (col0) return col0;
      if (col1) return col1;
      return null;
    })
    .filter((name): name is string => name !== null && name.length > 0);
}
