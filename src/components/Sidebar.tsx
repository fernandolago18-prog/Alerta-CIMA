"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, Settings, AlertTriangle, Package2, LogOut } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

export function Sidebar() {
    const pathname = usePathname();

    const routes = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/alertas", label: "Auditoría de Alertas", icon: AlertTriangle },
        { href: "/inventario", label: "Inventario Local", icon: Package2 },
        { href: "/configuracion", label: "Configuración", icon: Settings },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 glass-nav flex flex-col hidden md:flex">
            <div className="flex h-16 items-center flex-shrink-0 px-6 border-b border-white/5">
                <Activity className="h-6 w-6 text-primary mr-3" />
                <span className="text-lg font-bold tracking-tight text-white">Vigilancia CIMA</span>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {routes.map((route) => {
                    const isActive = pathname === route.href;
                    const Icon = route.icon;
                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                            {route.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-white/5 space-y-4">
                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 text-sm">
                    <p className="font-semibold text-primary mb-1">Sistema Activo</p>
                    <p className="text-muted-foreground text-xs">Monitoreo de AEMPS en tiempo real.</p>
                </div>
                <form action={logoutAction}>
                    <button type="submit" className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors border border-destructive/20 hover:border-destructive/40 duration-200">
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </button>
                </form>
            </div>
        </aside>
    );
}
