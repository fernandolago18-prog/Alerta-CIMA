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

    // Filtros de fecha
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Sync if initialIncidencias prop changes from Server Action revalidation
    useEffect(() => {
        setIncidencias(initialIncidencias);
    }, [initialIncidencias]);

    const filteredIncidencias = incidencias.filter(inc => {
        if (!startDate && !endDate) return true;
        const incDate = new Date(inc.fecha_deteccion);

        const start = startDate ? new Date(startDate) : new Date("2000-01-01");
        const end = endDate ? new Date(endDate) : new Date("2100-01-01");
        // Expand end date to include the whole day
        end.setHours(23, 59, 59, 999);

        return incDate >= start && incDate <= end;
    });

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

    const handleUpdate = (id: string, field: "estado" | "accion_tomada" | "comunicados", value: any) => {
        const current = incidencias.find((i) => i.id === id);
        if (!current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newEstado = field === "estado" ? (value as any) : current.estado;
        const newAccion = field === "accion_tomada" ? value : (current.accion_tomada || "");
        const newComunicados = field === "comunicados" ? value : (current.comunicados || []);

        // Actualización optimista del UI
        setIncidencias((prev) =>
            prev.map((inc) => (inc.id === id ? { ...inc, [field]: value } : inc))
        );

        // Call server action to update database (runs in background)
        startTransition(() => {
            updateIncidenciaAction(id, newEstado, newAccion, newComunicados).catch((err) => {
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

            {/* Filtros de Fecha */}
            <div data-html2canvas-ignore className="flex flex-col sm:flex-row gap-4 mb-6 pt-4 border-t border-white/5">
                <div className="flex flex-col">
                    <label className="text-xs text-muted-foreground mb-1">Fecha Inicio</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary transition-colors color-scheme-dark"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-muted-foreground mb-1">Fecha Fin</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary transition-colors color-scheme-dark"
                    />
                </div>
                {(startDate || endDate) && (
                    <div className="flex items-end">
                        <button
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                            className="text-xs text-primary hover:text-primary/80 mb-2 underline"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                )}
            </div>

            {filteredIncidencias && filteredIncidencias.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">CN Afectado</th>
                                <th scope="col" className="px-4 py-3 font-medium">Lote</th>
                                <th scope="col" className="px-4 py-3 font-medium w-1/4">Alerta Detectada</th>
                                <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                                <th scope="col" className="px-4 py-3 font-medium">Acción Tomada</th>
                                <th scope="col" className="px-4 py-3 font-medium">Comunicados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIncidencias.map((incidencia) => (
                                <tr key={incidencia.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-4 font-bold text-white whitespace-nowrap">{incidencia.cn}</td>
                                    <td className="px-4 py-4 font-mono text-muted-foreground">{incidencia.lote_afectado}</td>
                                    <td className="px-4 py-4 text-xs font-medium text-zinc-300">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground mb-0.5">
                                                {new Date(incidencia.fecha_deteccion).toLocaleDateString("es-ES")}
                                            </span>
                                            <span
                                                className="line-clamp-2"
                                                title={incidencia.alertas_historico?.titulo || "Alerta sin título"}
                                            >
                                                {incidencia.alertas_historico?.titulo || "Alerta Desconocida"}
                                            </span>
                                        </div>
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
                                        <select
                                            value={incidencia.accion_tomada || ""}
                                            onChange={(e) => handleUpdate(incidencia.id, "accion_tomada", e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled className="bg-zinc-900 text-zinc-500">Seleccione acción...</option>
                                            <option value="Ninguna" className="bg-zinc-900 text-white">Ninguna</option>
                                            <option value="Retirada y Devolución al Laboratorio" className="bg-zinc-900 text-white">Retirada y Devolución al Laboratorio</option>
                                            <option value="Retirada y Destrucción in situ" className="bg-zinc-900 text-white">Retirada y Destrucción in situ</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-2">
                                            {[
                                                "Notificación a Jefes de Servicio",
                                                "Aviso a Enfermería de referencia",
                                                "Contacto directo con el Facultativo prescriptor"
                                            ].map((opt) => (
                                                <label key={opt} className="flex items-start space-x-2 text-[10px] sm:text-xs text-zinc-300 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={(incidencia.comunicados || []).includes(opt)}
                                                        onChange={(e) => {
                                                            const current = incidencia.comunicados || [];
                                                            const newValues = e.target.checked
                                                                ? [...current, opt]
                                                                : current.filter((c: string) => c !== opt);
                                                            handleUpdate(incidencia.id, "comunicados", newValues);
                                                        }}
                                                        className="mt-0.5 rounded border-white/20 bg-black/40 text-primary focus:ring-primary/50 cursor-pointer form-checkbox transition-colors group-hover:border-primary"
                                                    />
                                                    <span className="leading-tight group-hover:text-white transition-colors">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
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
