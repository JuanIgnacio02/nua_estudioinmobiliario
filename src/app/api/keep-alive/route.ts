import { NextResponse } from "next/server";
import { supabase, STORE_TABLE, STORE_ID } from "@/lib/supabase";

/**
 * Mantiene despierto el proyecto de Supabase.
 *
 * El plan gratuito pausa los proyectos tras 7 días de baja actividad, y una
 * consulta por día alcanza para evitarlo. Un cron de GitHub Actions pega acá
 * (ver .github/workflows/keep-alive.yml).
 *
 * Importante que sea dinámica: si se cacheara, dejaría de tocar la base y no
 * serviría para nada. Devuelve 503 si la consulta falla, así el cron queda en
 * rojo y nos enteramos de que algo pasa.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabase();
  if (!sb) {
    return NextResponse.json({ ok: false, motivo: "supabase-sin-configurar" });
  }

  try {
    const { error } = await sb
      .from(STORE_TABLE)
      .select("id")
      .eq("id", STORE_ID)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ ok: true, consultadoEn: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error desconocido" },
      { status: 503 }
    );
  }
}
