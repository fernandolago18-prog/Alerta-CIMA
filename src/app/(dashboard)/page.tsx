import { supabase } from "@/lib/supabase";
import { AlertCircle, FileText, CheckCircle2, Clock } from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { IncidenciasManager } from "@/components/IncidenciasManager";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch Metrics Server-Side
  const { count: totalAlerts } = await supabase
    .from("alertas_historico")
    .select("*", { count: "exact", head: true });

  const { count: totalIncidencias } = await supabase
    .from("incidencias_hospital")
    .select("*", { count: "exact", head: true });

  const { count: pendingIncidencias } = await supabase
    .from("incidencias_hospital")
    .select("*", { count: "exact", head: true })
    .eq("estado", "Pendiente");

  const { data: estadoAemps } = await supabase
    .from("estado_aemps")
    .select("fecha_ultimo_escaneo")
    .eq("id", 1)
    .single();

  const { data: allIncidencias } = await supabase
    .from("incidencias_hospital")
    .select("*, alertas_historico(titulo)")
    .order("fecha_deteccion", { ascending: false });

  const lastScan = estadoAemps?.fecha_ultimo_escaneo
    ? new Date(estadoAemps.fecha_ultimo_escaneo).toLocaleString("es-ES")
    : "Desconocido";

  return (
    <div id="dashboard-export-area" className="flex-1 p-8 pt-6 space-y-8 overflow-y-auto w-full">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard Analítico</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Último escaneo AEMPS: <span className="text-white font-medium">{lastScan}</span>
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-6">
          <div className="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Alertas AEMPS Totales</h3>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{totalAlerts || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Procesadas por IA</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Incidencias Hospital</h3>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{totalIncidencias || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Matches detectados en stock</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Acciones Pendientes</h3>
            <Clock className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{pendingIncidencias || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Requieren atención urgente</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Incidencias Resueltas</h3>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">
            {(totalIncidencias || 0) - (pendingIncidencias || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Lotes retirados o auditados</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <DashboardCharts incidencias={allIncidencias || []} />

      {/* Interactive Activity Table */}
      <IncidenciasManager initialIncidencias={allIncidencias || []} />
    </div>
  );
}
