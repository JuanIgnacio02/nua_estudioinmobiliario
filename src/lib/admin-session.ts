import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidToken } from "./auth";

/**
 * Corta la ejecución si quien llama no tiene sesión de admin.
 *
 * Las Server Actions son alcanzables por POST directo, no solo desde la UI: el
 * proxy protege las páginas de /admin, pero NO las acciones. Por eso cada
 * acción del admin tiene que llamar a esto primero.
 */
export async function requireAdmin(): Promise<void> {
  const c = await cookies();
  if (!(await isValidToken(c.get(ADMIN_COOKIE)?.value))) {
    throw new Error("No autorizado");
  }
}
