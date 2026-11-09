import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FavoritesList from "@/components/FavoritesList";
import { publishedProperties } from "@/lib/properties";
import { getStore } from "@/lib/store";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Mis favoritas",
  description: "Las propiedades que guardaste en NÚA Estudio Inmobiliario.",
  // Es distinta para cada visitante: no tiene sentido en Google.
  robots: { index: false, follow: true },
};

export default async function FavoritasPage() {
  const { properties: all, settings } = await getStore();
  const properties = publishedProperties(all);

  return (
    <>
      <Navbar contact={settings.contact} />
      <main className="min-h-[70vh] bg-bone px-6 pb-28 pt-36 md:px-10 md:pt-44">
        <div className="mx-auto max-w-7xl">
          <p className="text-eyebrow mb-5 text-sage-500">Tu selección</p>
          <h1 className="font-display text-5xl text-ink md:text-7xl">Mis favoritas</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft/70">
            Las propiedades que guardaste con el corazón. Quedan en este
            navegador, sin necesidad de crear una cuenta.
          </p>
          <FavoritesList properties={properties} phoneHref={settings.contact.phoneHref} />
        </div>
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
