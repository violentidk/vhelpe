"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: FileText },
  { href: "/competency", label: "Competency", icon: Target },
  { href: "/planner", label: "Planner", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-atmosphere">
      <div className="mx-auto flex max-w-7xl gap-5 p-4 md:p-8">
        <aside className="glass hidden w-70 rounded-2xl p-4 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-primary/20 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                VIKK
              </p>
              <p className="text-sm font-semibold">Thesis Assistant</p>
            </div>
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-card-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            className="mt-8 w-full justify-start text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </aside>

        <main className="min-h-[calc(100vh-2rem)] flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-mono text-xl font-semibold">VIKK Exam Thesis Assistant</h1>
            <ThemeToggle />
          </div>
          <nav className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm whitespace-nowrap",
                    active
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
