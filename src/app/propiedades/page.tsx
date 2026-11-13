import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyExplorer from "@/components/PropertyExplorer";
import MapExplorer from "@/components/MapExplorer";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import Logo from "@/components/Logo";
import { getZones, publishedProperties } from "@/lib/properties";
import { getStore } from "@/lib/store";

// Cacheada y revalidada cada 5 min. Al guardar en el admin, revalidateAll()
// purga la caché, así que los cambios se ven al instante igual.
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/propiedades" },
  title: "Propiedades",
  description:
    "Explorá casas, departamentos, terrenos y fincas en venta y alquiler en San Rafael y toda Mendoza. Filtrá por operación, tipo, zona y precio.",
};

export default async function PropiedadesPage() {
  const { properties: all, settings } = await getStore();
  const properties = publishedProperties(all);
  const zones = getZones(properties);

  return (
    <>
      <Navbar contact={settings.contact} />
      <main className="pb-28">
        {/* Page header */}
        <header className="relative overflow-hidden bg-celadon-400 px-6 pb-16 pt-36 text-moss-900 md:px-10 md:pb-24 md:pt-44">
          {/* Decorative NÚA wordmark backdrop */}
          {/* Entero (antes quedaba cortado abajo y a la derecha) y "respira". */}
          <div aria-hidden className="pointer-events-none absolute right-[4%] top-1/2 w-[92%] -translate-y-[46%] text-moss-900 md:right-[3%] md:w-[64%]">
            <Logo className="nua-breathe h-auto w-full" />
          </div>
          <div className="relative mx-auto max-w-7xl">
            <p className="text-eyebrow mb-6 text-moss-700">
              Catálogo · San Rafael y Mendoza
            </p>
            <AnimatedHeading
              as="h1"
              immediate
              text="Encontrá tu propiedad"
              className="text-display font-display text-moss-900"
            />
            <p className="mt-8 max-w-xl text-lg text-moss-900/85">
              Búsqueda inteligente con filtros por operación, tipo, zona y
              precio. Ordená por destacadas, precio o superficie.
            </p>
          </div>
        </header>

        <div className="-mt-8">
          <PropertyExplorer
            properties={properties}
            zones={zones}
            phoneHref={settings.contact.phoneHref}
          />
        </div>

        <MapExplorer properties={properties} showAllLink={false} />
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
