"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

import { verifySession } from "@/lib/session";

export async function saveEmailsAction(emails: string[]) {
    const isAuth = await verifySession();
    if (!isAuth) {
        throw new Error("No autorizado");
    }

    const { error } = await supabase
        .from("configuracion_alertas")
        .upsert({ id: 1, emails_destinatarios: emails }, { onConflict: "id" });

    if (error) {
        console.error("Error saving emails:", error);
        throw new Error(error.message);
    }

    revalidatePath("/configuracion");
}
