import { Suspense } from "react";
import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Toaster from "@/components/admin/Toaster";

export const metadata: Metadata = {
  title: "Admin · NÚA",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell min-h-screen text-ink lg:flex">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
      {/* useSearchParams necesita Suspense para no forzar todo a dinámico. */}
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </div>
  );
}
