import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase Server Client
 * 
 * Type Checking Status: PENDING - requires regenerated types
 * 
 * The Database types in @/types/database.ts are manually maintained and not
 * fully compatible with @supabase/ssr v0.8.0+ type inference. This causes
 * insert/update operations to infer 'never' types.
 * 
 * To enable full client typing:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login: supabase login
 * 3. Generate types: supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 * 4. Update this file to use: createServerClient<Database>(...)
 * 
 * For now, use type assertions at the application level:
 *   import type { Brand } from "@/types/database";
 *   const { data } = await supabase.from("brands").select("*");
 *   const brands = data as Brand[];
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Admin client with service role key for server-side operations.
 * Bypasses Row Level Security (RLS) - use with caution.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin client doesn't need cookies
        },
      },
    }
  );
}
