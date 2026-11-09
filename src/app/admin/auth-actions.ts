"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken, checkPassword } from "@/lib/auth";

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const pw = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const token = await adminToken();
  if (!token) {
    return { error: "El acceso al panel no está configurado en el servidor." };
  }

  if (!(await checkPassword(pw))) {
    // Demora fija ante un error: vuelve impráctico probar contraseñas en masa.
    await new Promise((r) => setTimeout(r, 900));
    return { error: "Contraseña incorrecta. Intentá de nuevo." };
  }

  const c = await cookies();
  c.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  // Solo rutas internas del admin: evita usar el login como redirección abierta.
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
