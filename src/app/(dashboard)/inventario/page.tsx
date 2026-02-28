import { supabase } from "@/lib/supabase";
import { Search, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
    const { data: inventario } = await supabase
        .from("inventario_local")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(100);

    return (
        <div className="flex-1 p-8 pt-6 space-y-8 overflow-y-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center">
                        <Package className="mr-3 h-8 w-8 text-primary" />
                        Inventario Local
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Visualización del stock de medicamentos sincronizados con el sistema hospitalario.
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar CN o Nombre..."
                        className="w-full bg-black/40 border border-white/10 rounded-md pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="glass-card overflow-hidden mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-medium">Código Nac. (CN)</th>
                                <th scope="col" className="px-6 py-4 font-medium">Nombre / Descripción</th>
                                <th scope="col" className="px-6 py-4 font-medium">Lote</th>
                                <th scope="col" className="px-6 py-4 font-medium">Cantidad</th>
                                <th scope="col" className="px-6 py-4 font-medium">Últ. Sincronización</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {inventario?.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium text-white">
                                        {item.cn}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground max-w-sm truncate" title={item.nombre}>
                                        {item.nombre || "Sin descripción"}
                                    </td>
                                    <td className="px-6 py-4 text-white font-mono text-sm">
                                        {item.lote}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold">
                                            {item.cantidad} uds
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground text-xs">
                                        {new Date(item.updated_at).toLocaleString("es-ES")}
                                    </td>
                                </tr>
                            ))}
                            {!inventario || inventario.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground border-dashed border-white/10">
                                        No hay inventario sincronizado. Verifica que el script en Python esté procesando el Excel.
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
