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
        <div className="float-slow absolute -left-28 top-12 h-96 w-96 rounded-full bg-sky-400/18 blur-3xl" />
        <div className="glow-breathe absolute -right-24 top-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-400/14 blur-3xl" />
        <div className="float-slow absolute -bottom-16 left-1/3 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen w-full flex-col gap-3 p-2 sm:p-3 md:flex-row md:items-start md:gap-3 md:p-4">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="glass theme-shell page-enter flex min-h-[calc(100vh-0.5rem)] flex-1 flex-col rounded-[30px] md:min-h-[calc(100vh-2rem)]">
            <Topbar onOpenMenu={() => setMobileMenuOpen(true)} />
            <main className="flex-1 p-4 md:p-6 xl:p-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}
