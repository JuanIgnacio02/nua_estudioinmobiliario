"use client";

import dynamic from "next/dynamic";
import type { Property } from "@/lib/properties";

const PropertiesMap = dynamic(() => import("./PropertiesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
      Cargando mapa…
    </div>
  ),
});

export default function PropertyMapEmbed({
  slug,
  properties,
}: {
  slug: string;
  properties: Property[];
}) {
  return <PropertiesMap properties={properties} focusSlug={slug} />;
}
