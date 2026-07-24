import Reveal from "@/components/anim/Reveal";
import { defaultSettings, type SiteSettings } from "@/lib/properties";

export default function Philosophy({
  about = defaultSettings.about,
}: {
  about?: SiteSettings["about"];
}) {
  const ITEMS = [
    { k: "Misión", d: about.mission },
    { k: "Visión", d: about.vision },
    { k: "Valores", d: about.values },
  ];
  return (
    <section className="bg-bone py-24 md:py-36">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <p className="text-eyebrow mb-14 text-sage-500">
          Filosofía corporativa
        </p>
        <div className="grid gap-px border-t border-moss-600/15">
          {ITEMS.map((it, i) => (
            <Reveal
              key={it.k}
              className="grid gap-6 border-t border-moss-600/10 py-10 md:grid-cols-[0.4fr_1fr] md:gap-12 md:py-14"
              delay={i * 0.05}
            >
              <h2 className="font-display text-4xl text-ink md:text-5xl">
                {it.k}
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-ink-soft/80 md:text-xl">
                {it.d}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
