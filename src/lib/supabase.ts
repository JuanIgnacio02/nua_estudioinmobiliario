import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// supabase-js instantiates a realtime client (needs WebSocket) at construct
// time. Node < 22 has no native WebSocket, so polyfill it. On Vercel (Node 22+)
// the native one is used and this is a no-op. We never use realtime.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (globalThis as { WebSocket?: unknown }).WebSocket = require("ws");
  } catch {
    /* ignore — realtime unused */
  }
}

/**
 * Server-side Supabase client using the service_role key (bypasses RLS).
 * Only imported from server code — the key must never reach the browser.
 * Returns null when env vars aren't configured (falls back to file driver).
 */
let cached: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return cached;
}

export const STORE_TABLE = "site_store";
export const STORE_ID = 1;
