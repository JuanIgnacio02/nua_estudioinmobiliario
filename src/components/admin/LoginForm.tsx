"use client";

import { useActionState, useState } from "react";
import Logo from "@/components/Logo";
import { login } from "@/app/admin/auth-actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-moss-900 px-5 text-mint-100">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo className="h-9 w-auto text-mint-50" />
          <p className="text-eyebrow mt-6 text-celadon-300">Panel de administración</p>
          <h1 className="mt-3 font-display text-3xl text-mint-50">
            Bienvenida a NÚA
          </h1>
        </div>

        <form
          action={formAction}
          className="rounded-3xl border border-mint-100/10 bg-moss-700/40 p-7 backdrop-blur-sm"
        >
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="text-eyebrow text-celadon-300">Contraseña</span>
            <span className="relative mt-3 block">
              <input
                type={show ? "text" : "password"}
                name="password"
                required
                autoFocus
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-mint-100/15 bg-moss-900/40 py-3 pl-4 pr-12 text-mint-50 outline-none transition-colors placeholder:text-mint-100/30 focus:border-celadon-300"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={show}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-mint-100/50 transition-colors hover:text-mint-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {show ? (
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7a12 12 0 0 1-3 4.2M6.6 6.6A12.4 12.4 0 0 0 2 12c1 2.5 5 7 10 7a9.6 9.6 0 0 0 4.4-1" />
                  ) : (
                    <>
                      <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </span>
          </label>

          {state?.error && (
            <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-mint-50 px-6 py-3.5 text-sm font-medium text-moss-700 transition-colors hover:bg-white disabled:opacity-60"
          >
            {pending && <span aria-hidden className="admin-spinner" />}
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-mint-100/40">
          Acceso exclusivo del equipo de NÚA Estudio Inmobiliario.
        </p>
      </div>
    </div>
  );
}
