/**
 * Types TypeScript du schéma Supabase (cible post-migration P2-PR-19 Drizzle).
 *
 * Pour l'instant, ce fichier contient uniquement le contrat minimal pour PR-09 (NextAuth).
 * Il sera étendu en PR-19 (Drizzle migrations) avec les tables complète :
 * - profiles, modules, evaluations, attendance, supervision_events, syllabus_chapters
 *
 * Convention de nommage : snake_case côté DB, camelCase côté TypeScript.
 */

export interface DatabaseProfile {
  id: string;               // UUID, correspond à auth.users.id
  email: string;            // TEXT NOT NULL UNIQUE
  full_name: string;        // TEXT NOT NULL
  department: string | null;
  role: "teacher" | "admin";
  created_at: string;       // ISO timestamp
  updated_at: string;       // ISO timestamp
}

/**
 * Profil enseignant tel qu'exposé côté application (camelCase).
 * Converti depuis DatabaseProfile par mappers.ts (à créer en PR-10).
 */
export interface TeacherProfile {
  id: string;
  email: string;
  fullName: string;
  department: string | null;
  role: "teacher" | "admin";
  loggedAt: string;  // ISO timestamp de dernière connexion
}

/**
 * Schéma Supabase complet (étendu en PR-19).
 * Actuellement, seule la table `profiles` est utilisée.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DatabaseProfile;
        Insert: Omit<DatabaseProfile, "created_at" | "updated_at">;
        Update: Partial<Omit<DatabaseProfile, "id">>;
      };
      // Tables ajoutées en PR-19 (Drizzle migration)
      // evaluation_modules, evaluation_data, attendance, supervision_events, syllabus_chapters
    };
  };
}
