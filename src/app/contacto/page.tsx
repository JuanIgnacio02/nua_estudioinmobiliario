import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/sections/Contact";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contactá a NÚA Estudio Inmobiliario. Escribinos por email o WhatsApp y te asesoramos para comprar, vender o alquilar en San Rafael y toda Mendoza.",
};

export default async function ContactoPage() {
  const { settings } = await getStore();
  return (
    <>
      <Navbar />
      <main>
        <header className="bg-moss-900 px-5 pb-16 pt-36 text-mint-100 md:px-10 md:pb-24 md:pt-48">
          <div className="mx-auto max-w-[1600px]">
            <p className="text-eyebrow mb-6 flex items-center gap-3 text-celadon-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-celadon-300" />
              Contacto
            </p>
            <AnimatedHeading
              as="h1"
              immediate
              text="Estamos aquí para ayudarte"
              className="text-display max-w-[16ch] font-display text-mint-50"
            />
          </div>
        </header>
        <Contact contact={settings.contact} />
      </main>
      <Footer contact={settings.contact} />
    </>
  );
}
