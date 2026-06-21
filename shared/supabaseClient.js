/**
 * WarePick Supabase Client Factory
 * Creates a Supabase client using the service_role key (bypasses RLS).
 * Used by all backend microservices.
 */

const { createClient } = require('@supabase/supabase-js');

let client = null;

/**
 * Returns a singleton Supabase client configured with the service_role key.
 * Environment variables:
 *   SUPABASE_URL - Supabase project URL (local: http://127.0.0.1:54321)
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 */
function createServiceClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

module.exports = { createServiceClient };
