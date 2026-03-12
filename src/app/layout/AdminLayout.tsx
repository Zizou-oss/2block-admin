import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { MobileDrawer, Sidebar } from "@/app/layout/Sidebar";
import { Topbar } from "@/app/layout/Topbar";

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  return (
    <div className="relative min-h-screen text-[color:var(--text-main)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="float-slow absolute -left-24 top-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="glow-breathe absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/16 blur-3xl" />
        <div className="float-slow absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-4 p-3 sm:p-4 md:flex-row md:items-start md:gap-6 md:p-6">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="glass theme-shell page-enter flex min-h-[calc(100vh-1.5rem)] flex-1 flex-col rounded-[30px] md:min-h-[calc(100vh-3rem)]">
            <Topbar onOpenMenu={() => setMobileMenuOpen(true)} />
            <main className="flex-1 p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}
