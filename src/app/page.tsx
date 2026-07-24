import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import FeaturedProperties from "@/components/sections/FeaturedProperties";
import MapExplorer from "@/components/MapExplorer";
import CtaBand from "@/components/sections/CtaBand";
import { getStore } from "@/lib/store";
import { pickFeatured } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { properties, settings } = await getStore();
  const featured = pickFeatured(properties);

  return (
    <>
      <Navbar />
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
