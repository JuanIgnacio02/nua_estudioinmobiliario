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

  if (!checkPassword(pw)) {
    return { error: "Contraseña incorrecta. Intentá de nuevo." };
  }

  const c = await cookies();
  c.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
