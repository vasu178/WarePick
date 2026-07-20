/**
 * WarePick Supabase Client Factory
 * Creates a Supabase client using the service_role key (bypasses RLS).
 * Used by all backend microservices.
 */

const { createClient } = require('@supabase/supabase-js');

// Node.js < 22 does not have native WebSocket support.
// The 'ws' package provides a compatible implementation.
let WebSocket;
try {
  WebSocket = require('ws');
} catch (e) {
  // If ws is not installed, fall back to globalThis.WebSocket (Node 22+)
  WebSocket = globalThis.WebSocket;
}

let client = null;

/**
 * Returns a singleton Supabase client configured with the service_role key.
 * Environment variables:
 *   SUPABASE_URL - Supabase project URL (e.g. https://xxxx.supabase.co)
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
    realtime: {
      transport: WebSocket,
    },
  });

  return client;
}

module.exports = { createServiceClient };
