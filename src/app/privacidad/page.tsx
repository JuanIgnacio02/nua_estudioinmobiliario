import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getStore } from "@/lib/store";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo trata NÚA Estudio Inmobiliario los datos personales de quienes nos contactan, según la Ley 25.326.",
  alternates: { canonical: "/privacidad" },
};

/*
 * Redactada a partir de lo que el sitio hace realmente (verificado en el
 * código): los formularios abren WhatsApp y además guardan la consulta en la
 * base (lib/leads.ts, tabla site_leads); no hay cookies para los
 * visitantes; los mapas se piden a Esri desde el navegador. Las estadísticas
 * son contadores anónimos (lib/stats.ts) y las favoritas viven en localStorage.
 * Conviene que la revise un profesional y sumar la razón social y el CUIT.
 */
export default async function PrivacidadPage() {
  const { settings } = await getStore();
  const { contact } = settings;

  const sections: { title: string; body: React.ReactNode }[] = [
    {
      title: "Quiénes somos",
      body: (
        <>
          NÚA Estudio Inmobiliario, con domicilio en San Rafael, Mendoza,
          Argentina, es responsable de los datos personales que nos hacés
          llegar a través de este sitio. Para cualquier consulta sobre tus
          datos podés escribirnos a{" "}
          <a href={`mailto:${contact.email}`} className="text-moss-600 underline underline-offset-4">
            {contact.email}
          </a>
          .
        </>
      ),
    },
    {
      title: "Qué datos recibimos",
      body: "Los formularios del sitio (consulta por una propiedad, contacto y pedido de tasación) piden datos como nombre, email, teléfono, la dirección de tu propiedad y un mensaje. Al enviarlos, se abre WhatsApp con el mensaje ya escrito y además guardamos esos mismos datos en nuestra base, para poder responderte y hacer el seguimiento de tu consulta. Si nos escribís directamente por email o WhatsApp, recibimos los datos que vos elijas incluir.",
    },
    {
      title: "Dónde y cuánto tiempo se guardan",
      body: "Las consultas se guardan en una base de datos (Supabase) a la que solo accede el equipo de NÚA desde su panel interno. Las conservamos mientras dure la consulta o la operación y como máximo dos años; después las borramos. Podés pedirnos en cualquier momento que borremos las tuyas.",
    },
    {
      title: "Para qué los usamos",
      body: "Solo para responder tu consulta, asesorarte sobre propiedades y, si nos lo pedís, avisarte de propiedades que coincidan con lo que buscás. No vendemos ni cedemos tus datos a terceros.",
    },
    {
      title: "Cookies y medición",
      body: "Este sitio no usa cookies para los visitantes ni herramientas de seguimiento o publicidad. Para saber qué propiedades interesan más, contamos de forma anónima cuántas veces se abre cada ficha y cuántas veces se toca un botón de WhatsApp: solo se guarda un número por día y por propiedad, sin datos personales ni identificadores. Las propiedades que guardás como favoritas quedan en tu propio navegador (almacenamiento local) y nunca se nos envían, salvo que vos decidas mandárnoslas por WhatsApp. La única cookie existe en el panel de administración interno, para mantener la sesión del personal de NÚA.",
    },
    {
      title: "Servicios de terceros",
      body: "El sitio está alojado en Vercel, que registra datos técnicos de las visitas (como la dirección IP) para su funcionamiento y seguridad. Los mapas se cargan desde los servidores de Esri, que reciben esa misma información técnica al mostrarlos. Al usar WhatsApp aplican las políticas de privacidad de WhatsApp.",
    },
    {
      title: "Tus derechos",
      body: (
        <>
          Podés pedirnos en cualquier momento acceder a tus datos, corregirlos,
          actualizarlos o eliminarlos, escribiéndonos a{" "}
          <a href={`mailto:${contact.email}`} className="text-moss-600 underline underline-offset-4">
            {contact.email}
          </a>
          . El titular de los datos personales tiene la facultad de ejercer el
          derecho de acceso a los mismos en forma gratuita a intervalos no
          inferiores a seis meses, salvo que se acredite un interés legítimo al
          efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley
          N° 25.326. La Agencia de Acceso a la Información Pública, en su
          carácter de Órgano de Control de la Ley N° 25.326, tiene la
          atribución de atender las denuncias y reclamos que interpongan
          quienes resulten afectados en sus derechos por incumplimiento de las
          normas vigentes en materia de protección de datos personales.
        </>
      ),
    },
  ];

  return (
    <>
      <Navbar contact={contact} />
      <main className="bg-bone px-5 pb-24 pt-32 md:px-10 md:pt-40">
        <article className="mx-auto max-w-3xl">
          <p className="text-eyebrow text-sage-500">Legales</p>
          <h1 className="mt-5 font-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.98] text-ink">
            Política de privacidad
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft/75">
            Cuidamos tus datos con la misma confianza con la que te acompañamos
            en cada operación. Acá te contamos qué recibimos, para qué y cómo
            ejercer tus derechos según la Ley 25.326 de Protección de Datos
            Personales.
          </p>
          <div className="mt-14 space-y-12">
            {sections.map((s, i) => (
              <section key={s.title} className="border-t border-moss-600/15 pt-8">
                <h2 className="flex items-baseline gap-4 font-display text-2xl text-ink">
                  <span className="font-sans text-sm text-sage-400">0{i + 1}</span>
                  {s.title}
                </h2>
                <p className="mt-4 leading-relaxed text-ink-soft/85">{s.body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer contact={contact} />
    </>
  );
}
