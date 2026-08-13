import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import FeaturedProperties from "@/components/sections/FeaturedProperties";
import LoteosSection from "@/components/sections/LoteosSection";
import MapExplorer from "@/components/MapExplorer";
import CtaBand from "@/components/sections/CtaBand";
import { getStore } from "@/lib/store";
import { pickFeatured, publishedProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { properties: all, loteos, settings } = await getStore();
  const properties = publishedProperties(all);
  const featured = pickFeatured(properties);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Manifesto />
        <LoteosSection
          loteos={loteos}
          phoneHref={settings.contact.phoneHref}
        />
        <FeaturedProperties properties={featured} />
        <MapExplorer properties={properties} />
        <CtaBand />
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
