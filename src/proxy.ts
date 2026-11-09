import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";

/**
 * Chequeo optimista para las páginas del admin: si no hay sesión válida,
 * redirige al login. Las Server Actions se protegen aparte (requireAdmin),
 * porque el proxy no las cubre.
 */
export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();

  if (await isValidToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
