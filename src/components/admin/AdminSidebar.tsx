"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { logout } from "@/app/admin/auth-actions";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: "grid" },
  { label: "Propiedades", href: "/admin/propiedades", icon: "home" },
  { label: "Contacto", href: "/admin/contacto", icon: "phone" },
  { label: "Sobre nosotras", href: "/admin/nosotras", icon: "users" },
];

const ICONS: Record<string, React.ReactNode> = {
  grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  home: <path d="M3 10.5 12 3l9 7.5M5 9v11h14V9" />,
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  ),
  users: (
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
  ),
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-moss-600/10 bg-bone/90 px-5 py-3 backdrop-blur-xl lg:hidden">
        <Logo className="h-5 w-auto text-moss-600" />
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-full border border-moss-600/15 px-4 py-1.5 text-sm text-moss-600"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>

      <aside
        className={`${
          open ? "block" : "hidden"
        } border-b border-moss-600/10 bg-mint-50/40 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r`}
      >
        <div className="flex h-full flex-col p-5">
          <Link href="/admin" className="mb-10 hidden items-center gap-3 px-2 lg:flex">
            <Logo className="h-6 w-auto text-moss-600" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-sage-500">
              Admin
            </span>
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-moss-600 text-mint-50"
                    : "text-ink-soft hover:bg-mint-100"
                }`}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[item.icon]}
                </svg>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-mint-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
              </svg>
              Ver sitio
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-red-500/10 hover:text-red-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
