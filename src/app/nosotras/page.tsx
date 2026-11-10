import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/sections/About";
import Philosophy from "@/components/sections/Philosophy";
import { getStore } from "@/lib/store";

// Cacheada y revalidada cada 5 min. Al guardar en el admin, revalidateAll()
// purga la caché, así que los cambios se ven al instante igual.
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/nosotras" },
  title: "Sobre nosotras",
  description:
    "Conocé a NÚA Estudio Inmobiliario: socias de confianza en San Rafael y toda Mendoza. Cercanía, transparencia, compromiso y acompañamiento real en cada decisión.",
};

export default async function NosotrasPage() {
  const { settings } = await getStore();
  return (
    <>
      <Navbar contact={settings.contact} />
      <main>
        <About about={settings.about} />
        <Philosophy about={settings.about} />
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
