import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import SiteTracker from "@/components/SiteTracker";
import SmoothScroll from "@/components/SmoothScroll";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NÚA · Estudio Inmobiliario — Confianza que construye futuro",
    template: "%s · NÚA Estudio Inmobiliario",
  },
  description:
    "Inmobiliaria en San Rafael, Mendoza: compra, venta, alquileres y tasaciones con asesoramiento personalizado, transparencia y acompañamiento real.",
  keywords: [
    "inmobiliaria San Rafael",
    "propiedades Mendoza",
    "venta de casas San Rafael",
    "terrenos Mendoza",
    "tasaciones",
    "NÚA Estudio Inmobiliario",
  ],
  openGraph: {
    title: "NÚA · Estudio Inmobiliario",
    description: "Confianza que construye futuro. Propiedades en San Rafael y toda Mendoza.",
    locale: "es_AR",
    type: "website",
  },
  // Google Search Console: el código de verificación se pega en Vercel como
  // variable de entorno GOOGLE_SITE_VERIFICATION (no hace falta tocar código).
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} antialiased`}
    >
      <body className="min-h-screen">
        <noscript>
          <style>{`[data-anim-immediate] [data-word]{transform:none!important;animation:none!important}`}</style>
        </noscript>
        <SmoothScroll>{children}</SmoothScroll>
        <SiteTracker />
      </body>
    </html>
  );
}
