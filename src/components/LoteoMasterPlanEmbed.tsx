"use client";

import dynamic from "next/dynamic";
import type { Loteo } from "@/lib/loteos";

const LoteoMasterPlan = dynamic(() => import("./LoteoMasterPlan"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mint-100/40 text-sm text-sage-500">
      Cargando master plan…
    </div>
  ),
});

export default function LoteoMasterPlanEmbed(props: {
  loteo: Loteo;
  phoneHref: string;
}) {
  return <LoteoMasterPlan {...props} />;
}
