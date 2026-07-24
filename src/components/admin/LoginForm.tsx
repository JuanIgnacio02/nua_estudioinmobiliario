"use client";

import { useActionState } from "react";
import Logo from "@/components/Logo";
import { login } from "@/app/admin/auth-actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);

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
            <input
              type="password"
              name="password"
              required
              autoFocus
              placeholder="••••••••"
              className="mt-3 w-full rounded-xl border border-mint-100/15 bg-moss-900/40 px-4 py-3 text-mint-50 outline-none transition-colors placeholder:text-mint-100/30 focus:border-celadon-300"
            />
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
