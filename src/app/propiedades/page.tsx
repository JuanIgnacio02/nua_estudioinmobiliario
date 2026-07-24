import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyExplorer from "@/components/PropertyExplorer";
import MapExplorer from "@/components/MapExplorer";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import { TYPE_LABELS, getZones, type PropertyType } from "@/lib/properties";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Propiedades",
  description:
    "Explorá casas, departamentos, terrenos y fincas en venta y alquiler en San Rafael y toda Mendoza. Filtrá por operación, tipo, zona y precio.",
};

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialType =
    type && type in TYPE_LABELS ? (type as PropertyType) : undefined;

  const { properties, settings } = await getStore();
  const zones = getZones(properties);

  return (
    <>
      <Navbar />
      <main className="pb-28">
        {/* Page header */}
        <header className="bg-moss-900 px-6 pb-16 pt-36 text-mint-100 md:px-10 md:pb-24 md:pt-44">
          <div className="mx-auto max-w-7xl">
            <p className="text-eyebrow mb-6 text-celadon-300">
              Catálogo · San Rafael y Mendoza
            </p>
            <AnimatedHeading
              as="h1"
              immediate
              text="Encontrá tu propiedad"
              className="text-display font-display text-mint-50"
            />
            <p className="mt-8 max-w-xl text-lg text-mint-100/75">
              Búsqueda inteligente con filtros por operación, tipo, zona y
              precio. Ordená por destacadas, precio o superficie.
            </p>
          </div>
        </header>

        <div className="-mt-8">
          <PropertyExplorer
            properties={properties}
            zones={zones}
            initialType={initialType}
          />
        </div>

        <MapExplorer properties={properties} />
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
