/**
 * Minimal password gate for the admin panel. Not high-security auth — a shared
 * password (default "nua2026", override with ADMIN_PASSWORD) sets an httpOnly
 * cookie that middleware checks. For production, override both env vars.
 */

export const ADMIN_COOKIE = "nua_admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "nua2026";
}

/** Opaque token stored in the cookie once authenticated. */
export function adminToken() {
  return process.env.ADMIN_SECRET ?? "nua-authenticated-2026";
}

export function checkPassword(pw: string) {
  return pw === adminPassword();
}
