import Link from "next/link";

/**
 * Campo trampa para robots: no se ve ni se puede tabular. Una persona nunca
 * lo completa; si viene con algo, la consulta se descarta.
 */
export function Honeypot({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Empresa
        <input ref={inputRef} type="text" name="empresa" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

/** Aviso de uso de datos (Ley 25.326), debajo del botón de envío. */
export function PrivacyNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-ink-soft/50 ${className}`}>
      Se abre WhatsApp con tu mensaje listo para enviar. Guardamos estos datos
      solo para responderte —{" "}
      <Link href="/privacidad" className="underline underline-offset-2 hover:text-moss-600">
        política de privacidad
      </Link>
      .
    </p>
  );
}
