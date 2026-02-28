"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updateIncidenciaAction(
    id: string,
    estado: "Pendiente" | "Resuelta" | "Falsa Alarma",
    accion_tomada: string
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {
        estado,
        accion_tomada,
    };

    if (estado === "Resuelta" || estado === "Falsa Alarma") {
        updatePayload.fecha_resolucion = new Date().toISOString();
    } else {
        updatePayload.fecha_resolucion = null;
    }

    const { error } = await supabase
        .from("incidencias_hospital")
        .update(updatePayload)
        .eq("id", id);

    if (error) {
        console.error("Error updating incidencia:", error);
        throw new Error(error.message);
    }

    revalidatePath("/");
}
