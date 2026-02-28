import { Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EmailManager } from "@/components/EmailManager";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
    const { data } = await supabase
        .from("configuracion_alertas")
        .select("emails_destinatarios")
        .eq("id", 1)
        .single();

    const recipientEmails = data?.emails_destinatarios || [];

    return (
        <div className="flex-1 p-8 pt-6 space-y-8 overflow-y-auto w-full max-w-5xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white flex items-center">
                    <Settings className="mr-3 h-8 w-8 text-primary" />
                    Configuración
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Ajustes generales, gestión de notificaciones e integración con servicios de terceros.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Configuracion de Correos */}
                <EmailManager initialEmails={recipientEmails} />

                <div className="glass-card p-6 border-l-4 border-l-orange-500">
                    <h3 className="text-lg font-medium text-white mb-2">Otros Ajustes (Próximamente)</h3>
                    <p className="text-sm text-muted-foreground">
                        En futuras implementaciones, desde este panel podrás:
                    </p>
                    <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-muted-foreground ml-2">
                        <li>Ajustar el modelo LLM y temperatura de la IA de extracciones.</li>
                        <li>Consultar el estado de salud de la conexión de Supabase en tiempo real.</li>
                        <li>Ejecutar el Scraper de la AEMPS de manera manual usando Server Actions.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
