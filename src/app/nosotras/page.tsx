import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/sections/About";
import Philosophy from "@/components/sections/Philosophy";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sobre nosotras",
  description:
    "Conocé a NÚA Estudio Inmobiliario: socias de confianza en San Rafael y toda Mendoza. Cercanía, transparencia, compromiso y acompañamiento real en cada decisión.",
};

export default async function NosotrasPage() {
  const { settings } = await getStore();
  return (
    <>
      <Navbar />
      <main>
        <About about={settings.about} />
        <Philosophy about={settings.about} />
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
