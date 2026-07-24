import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page and the login API are always reachable.
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (token === adminToken()) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
