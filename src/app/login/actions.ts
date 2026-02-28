"use server";

import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
    const password = formData.get("password") as string;

    if (!password) {
        return { error: "Por favor, introduce la contraseña." };
    }

    if (password !== process.env.APP_PASSWORD) {
        return { error: "Contraseña incorrecta." };
    }

    await createSession();
    redirect("/");
}

export async function logoutAction() {
    await deleteSession();
    redirect("/login");
}
