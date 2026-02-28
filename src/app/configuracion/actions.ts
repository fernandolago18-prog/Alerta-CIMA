"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function saveEmailsAction(emails: string[]) {
    const { error } = await supabase
        .from("configuracion_alertas")
        .upsert({ id: 1, emails_destinatarios: emails }, { onConflict: "id" });

    if (error) {
        console.error("Error saving emails:", error);
        throw new Error(error.message);
    }

    revalidatePath("/configuracion");
}
