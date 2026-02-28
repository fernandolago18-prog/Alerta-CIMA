import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:pl-64 min-h-screen overflow-hidden flex flex-col">
                {children}
            </main>
        </div>
    );
}
