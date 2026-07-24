import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

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
  metadataBase: new URL("https://nuaestudioinmobiliario.com.ar"),
  title: {
    default: "NÚA · Estudio Inmobiliario — Confianza que construye futuro",
    template: "%s · NÚA Estudio Inmobiliario",
  },
  description:
    "Asesoramiento inmobiliario profesional y personalizado en San Rafael y toda Mendoza. Compra, venta, tasaciones y alquileres con confianza, transparencia y acompañamiento real.",
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
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
