import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour utilisation côté serveur (Server Components, Route Handlers).
 *
 * Différences avec le client browser :
 * - Lit les cookies HTTP depuis la requête (pour récupérer la session)
 * - Peut effectuer des opérations avec特权 si SERVICE_ROLE_KEY est fourni
 *   (à utiliser avec prudence — jamais exposer au client)
 *
 * Utilisé pour :
 * - Vérifier la session côté serveur (Server Components)
 * - Effectuer des opérations admin (ex: créer comptes utilisateurs en batch)
 * - Récupérer des données avec RLS (lecture seule user_id filtré)
 */

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[SEC-04a] Supabase non configuré côté serveur"
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // La méthode set peut échouer dans Server Components
          // (elle ne peut être appelée que depuis Server Actions ou Route Handlers)
        }
      },
    },
  });
}
