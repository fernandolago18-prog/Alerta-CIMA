"use client";

import { useState, useTransition, useEffect } from "react";
import { updateIncidenciaAction } from "@/app/actions";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function IncidenciasManager({ initialIncidencias }: { initialIncidencias: any[] }) {
    const [incidencias, setIncidencias] = useState(initialIncidencias);
    const [isPending, startTransition] = useTransition();

    // Sync if initialIncidencias prop changes from Server Action revalidation
    useEffect(() => {
        setIncidencias(initialIncidencias);
    }, [initialIncidencias]);

    const handleExportPDF = async () => {
        const element = document.getElementById("dashboard-export-area");
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#09090b',
                ignoreElements: (el) => el.id === "ignore-pdf-export" || el.tagName === "BUTTON"
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.text("Informe Analítico de Farmacovigilancia", 40, 40);
            pdf.addImage(imgData, 'PNG', 40, 60, pdfWidth - 80, pdfHeight);
            pdf.save("informe_incidencias.pdf");
        } catch (error) {
            console.error("Error generating PDF", error);
        }
    };

    const handleUpdate = (id: string, field: "estado" | "accion_tomada", value: string) => {
        const current = incidencias.find((i) => i.id === id);
        if (!current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newEstado = field === "estado" ? (value as any) : current.estado;
        const newAccion = field === "accion_tomada" ? value : (current.accion_tomada || "");

        // Actualización optimista del UI
        setIncidencias((prev) =>
            prev.map((inc) => (inc.id === id ? { ...inc, [field]: value } : inc))
        );

        // Call server action to update database (runs in background)
        startTransition(() => {
            updateIncidenciaAction(id, newEstado, newAccion).catch((err) => {
                console.error("Failed to update status on server:", err);
                // Fallback: reload state from props if it fails
                setIncidencias(initialIncidencias);
            });
        });
    };

    return (
        <div className="glass-card p-6 mt-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-medium text-white mb-1">Gestión de Incidencias</h3>
                    <p className="text-xs text-muted-foreground">
                        {isPending ? "Sincronizando..." : "Audita e interviene todos los lotes críticos."}
                    </p>
                </div>
                <button
                    id="ignore-pdf-export"
                    onClick={handleExportPDF}
                    className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Informe PDF
                </button>
            </div>

            {incidencias && incidencias.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">CN Afectado</th>
                                <th scope="col" className="px-4 py-3 font-medium">Lote</th>
                                <th scope="col" className="px-4 py-3 font-medium w-1/3">Alerta Detectada</th>
                                <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                                <th scope="col" className="px-4 py-3 font-medium">Acción Tomada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidencias.map((incidencia) => (
                                <tr key={incidencia.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-4 font-bold text-white whitespace-nowrap">{incidencia.cn}</td>
                                    <td className="px-4 py-4 font-mono text-muted-foreground">{incidencia.lote_afectado}</td>
                                    <td className="px-4 py-4 text-xs font-medium text-zinc-300">
                                        <span
                                            className="line-clamp-2"
                                            title={incidencia.alertas_historico?.titulo || "Alerta sin título"}
                                        >
                                            {incidencia.alertas_historico?.titulo || "Alerta Desconocida"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <select
                                            value={incidencia.estado}
                                            onChange={(e) => handleUpdate(incidencia.id, "estado", e.target.value)}
                                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer appearance-none ${incidencia.estado === "Pendiente"
                                                ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                                : incidencia.estado === "Resuelta"
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                                                }`}
                                        >
                                            <option value="Pendiente" className="bg-zinc-900 text-white">Pendiente</option>
                                            <option value="Resuelta" className="bg-zinc-900 text-white">Resuelta</option>
                                            <option value="Falsa Alarma" className="bg-zinc-900 text-white">Falsa Alarma</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4">
                                        <input
                                            type="text"
                                            defaultValue={incidencia.accion_tomada || ""}
                                            onBlur={(e) => {
                                                if (e.target.value !== (incidencia.accion_tomada || "")) {
                                                    handleUpdate(incidencia.id, "accion_tomada", e.target.value);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") e.currentTarget.blur()
                                            }}
                                            placeholder="Ej: Cuarentena 20uds"
                                            className="w-full bg-black/40 border-b border-white/5 px-2 py-1 text-sm text-white focus:outline-none focus:border-primary placeholder:text-zinc-600 transition-colors rounded-t-sm"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                    No se han detectado incidencias críticas recientes en el inventario.
                </div>
            )}
        </div>
    );
}
