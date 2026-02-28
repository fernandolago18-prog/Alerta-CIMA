"use client";

import { useState, useTransition } from "react";
import { saveEmailsAction } from "@/app/configuracion/actions";
import { Plus, Trash2, Mail, Save } from "lucide-react";

export function EmailManager({ initialEmails }: { initialEmails: string[] }) {
    const [emails, setEmails] = useState<string[]>(initialEmails || []);
    const [newEmail, setNewEmail] = useState("");
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);

    const handleAdd = () => {
        if (!newEmail || !newEmail.includes("@")) return;
        if (emails.includes(newEmail)) return;
        setEmails([...emails, newEmail.trim()]);
        setNewEmail("");
        setSaved(false);
    };

    const handleRemove = (emailToRemove: string) => {
        setEmails(emails.filter(e => e !== emailToRemove));
        setSaved(false);
    };

    const handleSave = () => {
        startTransition(() => {
            saveEmailsAction(emails).then(() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            });
        });
    };

    return (
        <div className="glass-card p-6 border-l-4 border-l-blue-500">
            <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-400" /> Destinatarios de Alertas
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
                Añade los correos del personal de farmacia o directivos técnicos que deben recibir las notificaciones críticas cuando se detecte un lote defectuoso.
            </p>

            <div className="space-y-3 mb-4">
                {emails.map((em, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-md px-3 py-2">
                        <span className="text-sm text-zinc-300 font-medium">{em}</span>
                        <button onClick={() => handleRemove(em)} className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-sm hover:bg-red-900/20">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {emails.length === 0 && (
                    <div className="text-sm text-zinc-500 italic py-2">No hay destinatarios configurados.</div>
                )}
            </div>

            <div className="flex space-x-2 mb-4">
                <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                    placeholder="nuevo@hospital.com"
                    className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                    onClick={handleAdd}
                    disabled={!newEmail}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors disabled:opacity-50"
                    title="Añadir Correo"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <button
                onClick={handleSave}
                disabled={isPending}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-md transition-colors text-sm font-medium ${saved ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
                <Save className="w-4 h-4 mr-2" />
                {isPending ? "Guardando..." : saved ? "¡Configuración Guardada!" : "Guardar Cambios"}
            </button>
        </div>
    );
}
