import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import FeaturedProperties from "@/components/sections/FeaturedProperties";
import MapExplorer from "@/components/MapExplorer";
import CtaBand from "@/components/sections/CtaBand";
import { getStore } from "@/lib/store";
import JsonLd from "@/components/JsonLd";
import { agencyJsonLd } from "@/lib/seo";
import { pickFeatured, publishedProperties } from "@/lib/properties";

// Cacheada y revalidada cada 5 min. Al guardar en el admin, revalidateAll()
// purga la caché, así que los cambios se ven al instante igual.
export const revalidate = 300;

export default async function Home() {
  const { properties: all, settings } = await getStore();
  const properties = publishedProperties(all);
  const featured = pickFeatured(properties);

  return (
    <>
      <JsonLd data={agencyJsonLd(settings.contact)} />
      <Navbar tone="light" contact={settings.contact} />
      <main>
        <Hero />
        <Manifesto />
        <FeaturedProperties properties={featured} />
        <MapExplorer properties={properties} />
        <CtaBand />
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
