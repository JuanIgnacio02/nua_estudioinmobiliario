/* Esqueletos de carga del admin: la navegación responde al instante y el
   contenido aparece en su lugar, sin saltos. */

function Bone({ className = "" }: { className?: string }) {
  return <div className={`admin-skeleton ${className}`} />;
}

function Header({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Bone className="h-3 w-24" />
        <Bone className="mt-4 h-9 w-56" />
        <Bone className="mt-3 h-4 w-40" />
      </div>
      {action && <Bone className="h-11 w-40 rounded-full" />}
    </div>
  );
}

export function ListSkeleton({ rows = 5, filters = true }: { rows?: number; filters?: boolean }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14" aria-busy="true" aria-label="Cargando">
      <Header />
      {filters && <div className="glass-panel mt-8 h-[7.5rem]" />}
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="glass-panel flex items-center gap-4 p-3">
            <Bone className="h-[4.25rem] w-24 shrink-0" />
            <div className="flex-1">
              <Bone className="h-4 w-3/5" />
              <Bone className="mt-2.5 h-3 w-2/5" />
            </div>
            <Bone className="hidden h-5 w-24 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

const WIDTHS = {
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
} as const;

export function FormSkeleton({
  aside = false,
  width = "5xl",
}: {
  aside?: boolean;
  width?: keyof typeof WIDTHS;
}) {
  return (
    <div
      className={`mx-auto px-5 py-10 md:px-10 md:py-12 ${WIDTHS[width]}`}
      aria-busy="true"
      aria-label="Cargando"
    >
      <Bone className="h-3 w-24" />
      <Bone className="mt-4 h-9 w-64" />
      <Bone className="mt-3 h-4 w-80 max-w-full" />
      <div className={`mt-8 grid gap-4 ${aside ? "lg:grid-cols-[minmax(0,1fr)_330px]" : ""}`}>
        <div className="space-y-4">
          {[180, 260, 320].map((h, i) => (
            <div key={i} className="glass-panel p-6" style={{ height: h }}>
              <Bone className="h-4 w-32" />
              <Bone className="mt-6 h-11 w-full" />
              <Bone className="mt-4 h-11 w-2/3" />
            </div>
          ))}
        </div>
        {aside && (
          <div className="order-first space-y-4 lg:order-none">
            <div className="glass-panel h-64 p-6">
              <Bone className="h-4 w-28" />
              <Bone className="mt-6 h-9 w-full rounded-full" />
              <Bone className="mt-6 h-9 w-full rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14" aria-busy="true" aria-label="Cargando">
      <Header />
      <div className="mt-10 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="glass-panel h-[7.5rem] p-5">
            <Bone className="h-3 w-24" />
            <Bone className="mt-4 h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="glass-panel h-48" />
        <div className="glass-panel h-48" />
      </div>
    </div>
  );
}
