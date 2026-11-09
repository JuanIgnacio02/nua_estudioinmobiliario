/**
 * Acceso al panel de administración: una contraseña única (ADMIN_PASSWORD).
 *
 * Al ingresar se guarda una cookie httpOnly con un token derivado por HMAC de
 * un secreto del servidor. NO es un valor fijo: el repo es público, y antes el
 * token por defecto estaba escrito acá, así que cualquiera podía fabricarse la
 * cookie y entrar al admin.
 *
 * Fail closed: sin ADMIN_PASSWORD configurada, nadie puede entrar. No hay
 * contraseña por defecto.
 *
 * Usa Web Crypto para funcionar igual en el proxy y en las Server Actions.
 */

export const ADMIN_COOKIE = "nua_admin";

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function sha256(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

/** Comparación en tiempo constante (no filtra cuántos caracteres coinciden). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Clave para firmar la sesión. ADMIN_SECRET si existe; si no, la contraseña. */
function signingKey(): string | null {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || null;
}

/** Token que debe tener la cookie. null si el admin no está configurado. */
export async function adminToken(): Promise<string | null> {
  const key = signingKey();
  if (!key) return null;
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(await crypto.subtle.sign("HMAC", k, enc.encode("nua-admin-v1")));
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await adminToken();
  return expected !== null && safeEqual(token, expected);
}

export async function checkPassword(pw: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !pw) return false;
  // Se comparan hashes para que ambos lados tengan siempre el mismo largo.
  const [a, b] = await Promise.all([sha256(pw), sha256(expected)]);
  return safeEqual(a, b);
}
