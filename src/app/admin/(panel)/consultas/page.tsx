import { listLeads } from "@/lib/leads";
import LeadsInbox from "@/components/admin/LeadsInbox";

export const dynamic = "force-dynamic";

export default async function AdminConsultas() {
  let leads: Awaited<ReturnType<typeof listLeads>> = [];
  let failed = false;
  try {
    leads = await listLeads();
  } catch (e) {
    console.error("[consultas]", e);
    failed = true;
  }

  return (
    <div className="admin-page mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-sage-600">Clientes</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Consultas</h1>
          <p className="mt-2 max-w-xl text-ink-soft/70">
            Todo lo que llega por los formularios de la web: consultas por
            propiedades, contacto y pedidos de tasación.
          </p>
        </div>
        {leads.length > 0 && (
          <a href="/admin/consultas-csv" className="glass-btn text-xs">
            Descargar planilla (Excel)
          </a>
        )}
      </header>

      {failed ? (
        <div className="glass-panel mt-8 px-6 py-14 text-center text-ink-soft/70">
          No se pudieron cargar las consultas. Probá recargar en un momento.
        </div>
      ) : (
        <LeadsInbox leads={leads} />
      )}
    </div>
  );
}
