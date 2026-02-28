"use client";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    LineChart, Line
} from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DashboardCharts({ incidencias }: { incidencias: any[] }) {
    if (!incidencias || incidencias.length === 0) return null;

    // Pie Chart: Estados
    const estadoCounts = incidencias.reduce((acc, curr) => {
        acc[curr.estado] = (acc[curr.estado] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.keys(estadoCounts).map(key => ({
        name: key,
        value: estadoCounts[key]
    }));

    const ESTADO_COLORS: Record<string, string> = {
        'Pendiente': '#f59e0b', // Orange
        'Resuelta': '#10b981',  // Emerald
        'Falsa Alarma': '#6b7280' // Gray
    };

    // Bar Chart: Tipo de Intervención (Acción Tomada)
    const accionesCounts = incidencias.reduce((acc, curr) => {
        const action = curr.accion_tomada?.trim() || "Sin Especificar";
        acc[action] = (acc[action] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const barData = Object.keys(accionesCounts)
        .filter(key => key !== "Sin Especificar") // Filter out empty actions 
        .map(key => ({
            name: key.length > 15 ? key.substring(0, 15) + "..." : key,
            cantidad: accionesCounts[key]
        }))
        .sort((a, b) => b.cantidad - a.cantidad); // Sort descendant by quantity

    // Line Chart: Tiempo de Respuesta Medio (Meses)
    const responseTimesByMonth = incidencias.reduce((acc, curr) => {
        if (curr.estado === 'Resuelta' && curr.fecha_resolucion && curr.fecha_deteccion) {
            const resolveDate = new Date(curr.fecha_resolucion);
            const detectDate = new Date(curr.fecha_deteccion);
            const monthYear = resolveDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

            // Difference in hours
            const hours = (resolveDate.getTime() - detectDate.getTime()) / (1000 * 60 * 60);

            if (!acc[monthYear]) {
                acc[monthYear] = { totalHours: 0, count: 0 };
            }
            acc[monthYear].totalHours += hours;
            acc[monthYear].count += 1;
        }
        return acc;
    }, {} as Record<string, { totalHours: number, count: number }>);

    const responseTimeData = Object.keys(responseTimesByMonth).map(key => ({
        mes: key.charAt(0).toUpperCase() + key.slice(1),
        horas_promedio: Math.round(responseTimesByMonth[key].totalHours / responseTimesByMonth[key].count)
    })).sort((a, b) => {
        return a.mes.localeCompare(b.mes);
    });

    return (
        <div className="grid gap-6 md:grid-cols-3 mt-8">
            {/* Gráfico de Estados */}
            <div className="glass-card p-6 flex flex-col items-center">
                <h3 className="text-lg font-medium text-white mb-4 self-start">Distribución por Estado</h3>
                <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="rgba(255,255,255,0.1)"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={ESTADO_COLORS[entry.name] || '#3b82f6'} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfico de Intervenciones */}
            <div className="glass-card p-6 flex flex-col items-center">
                <h3 className="text-lg font-medium text-white mb-4 self-start">Tipos de Intervención</h3>
                {barData.length > 0 ? (
                    <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                />
                                <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="w-full h-[250px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-white/10 rounded-lg">
                        No hay acciones registradas aún.
                    </div>
                )}
            </div>

            {/* Gráfico de Tiempo de Respuesta */}
            <div className="glass-card p-6 flex flex-col items-center">
                <h3 className="text-lg font-medium text-white mb-4 self-start">Tiempo de Respuesta Medio</h3>
                {responseTimeData.length > 0 ? (
                    <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={responseTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="mes" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="horas_promedio" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} name="Horas" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="w-full h-[250px] flex items-center justify-center text-center text-muted-foreground text-sm border-2 border-dashed border-white/10 rounded-lg">
                        Faltan datos de resolución<br />para calcular promedios.
                    </div>
                )}
            </div>
        </div >
    );
}
