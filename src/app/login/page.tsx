"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Lock, LogIn } from "lucide-react";

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(loginAction, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
            <div className="w-full max-w-md glass-card p-8">
                <div className="flex flex-col items-center justify-center space-y-4 mb-8">
                    <div className="bg-primary/20 p-4 rounded-full">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Acceso Restringido</h1>
                    <p className="text-muted-foreground text-center text-sm">
                        Introduce la contraseña maestra para acceder al panel de control de Alertas CIMA.
                    </p>
                </div>

                <form action={formAction} className="space-y-6">
                    <div className="space-y-2">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            placeholder="••••••••"
                            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                        />
                    </div>

                    {state?.error && (
                        <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md border border-destructive/20 text-center animate-in fade-in zoom-in duration-300">
                            {state.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-all duration-200"
                    >
                        {isPending ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                        ) : (
                            <>
                                <LogIn className="w-4 h-4 mr-2" />
                                Acceder
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
