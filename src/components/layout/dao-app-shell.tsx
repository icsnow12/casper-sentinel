import Link from "next/link";
import { Bell, CircuitBoard, Wallet } from "lucide-react";

import { navItems } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type DaoAppShellProps = {
  active: "Dashboard" | "New proposal" | "Marketplace" | "Governance";
  children: React.ReactNode;
};

export function DaoAppShell({ active, children }: DaoAppShellProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/10 bg-black/25 px-4 py-5 backdrop-blur-xl lg:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-300/10 text-emerald-200">
            <CircuitBoard className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Casper Sentinel</span>
            <span className="block text-xs text-muted-foreground">
              Autonomous VC DAO
            </span>
          </span>
        </Link>

        <Separator className="my-5 bg-white/10" />

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.label;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground",
                  isActive &&
                    "bg-emerald-300/10 text-emerald-100 ring-1 ring-emerald-300/20"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-muted-foreground">Casper Testnet</p>
          <p className="mt-1 text-sm font-medium text-emerald-100">
            Governance adapter ready
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <CircuitBoard className="size-5 text-emerald-200" />
              <span className="text-sm font-semibold">Casper Sentinel</span>
            </Link>
            <div className="hidden text-sm text-muted-foreground lg:block">
              DAO terminal / Agent-weighted governance
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Wallet className="size-4" />
                Connect wallet
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
