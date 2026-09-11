import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour utilisation côté navigateur (Client Components).
 *
 * Utilisé pour :
 * - Authentification (signInWithPassword, signUp, signOut)
 * - Lecture des données utilisateur (RLS applique automatiquement le filtrage)
 * - Synchronisation Realtime (optionnel)
 *
 * Les variables NEXT_PUBLIC_* sont exposées au navigateur — c'est NORMAL et SÉCURISÉ
 * car Supabase applique Row Level Security (RLS) côté serveur PostgreSQL.
 * Un client ne peut lire que les lignes où user_id = auth.uid().
 */

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[SEC-04a] Supabase non configuré. Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
