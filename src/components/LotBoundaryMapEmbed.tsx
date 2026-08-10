"use client";

import dynamic from "next/dynamic";
import type { Property } from "@/lib/properties";

const LotBoundaryMap = dynamic(() => import("./LotBoundaryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
      Cargando vista satelital…
    </div>
  ),
});

export default function LotBoundaryMapEmbed(props: {
  property: Property;
  boundary?: [number, number][];
  showInfoCard?: boolean;
}) {
  return <LotBoundaryMap {...props} />;
}
