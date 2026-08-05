import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ClientAuthWrapper } from "@/components/ClientAuthWrapper";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientAuthWrapper>
      <div className="flex w-full min-h-screen">
        <Sidebar />
        <div className="ml-64 flex-1 flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ClientAuthWrapper>
  );
}
