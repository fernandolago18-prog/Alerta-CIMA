import { supabase } from "@/lib/supabase";
import { Search, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AlertasPage() {
    const { data: alertas } = await supabase
        .from("alertas_historico")
        .select("*")
        .order("fecha_publicacion", { ascending: false })
        .limit(50);

    return (
        <div className="flex-1 p-8 pt-6 space-y-8 overflow-y-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Auditoría de Alertas</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Registro histórico de las alertas de la AEMPS analizadas.
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por Título..."
                        className="w-full bg-black/40 border border-white/10 rounded-md pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-medium">Fecha</th>
                                <th scope="col" className="px-6 py-4 font-medium">Alerta ID</th>
                                <th scope="col" className="px-6 py-4 font-medium">Título Resumido</th>
                                <th scope="col" className="px-6 py-4 font-medium">Extracción Gemini</th>
                                <th scope="col" className="px-6 py-4 font-medium text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {alertas?.map((alerta) => (
                                <tr key={alerta.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                        {new Date(alerta.fecha_publicacion).toLocaleDateString("es-ES")}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-primary/80">
                                        {alerta.alerta_id}
                                    </td>
                                    <td className="px-6 py-4 text-white line-clamp-2 max-w-md">
                                        {alerta.titulo}
                                    </td>
                                    <td className="px-6 py-4">
                                        {alerta.cns_afectados && alerta.cns_afectados.length > 0 ? (
                                            <span className="inline-flex whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                {alerta.cns_afectados.length} CNs Detectados
                                            </span>
                                        ) : (
                                            <span className="inline-flex whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                Sin hallazgos
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a
                                            href={alerta.raw_texto}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                        >
                                            Ver Fuente <ExternalLink className="ml-1 h-3 w-3" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {!alertas || alertas.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground border-dashed border-white/10">
                                        No hay alertas en el histórico (el motor de escaneo no ha encontrado datos nuevos o aún no ha finalizado).
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
