"use client";

import { useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { SessionMenu } from "@/components/shell/session-menu";
import { ThemeMenu } from "@/components/shell/theme-menu";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="min-h-dvh">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col gap-6 border-r border-sidebar-border bg-sidebar p-3 transition-[width] md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className={cn("flex h-12 items-center px-1", collapsed && "justify-center")}>
          <Logo compact={collapsed} />
        </div>
        <SidebarNav collapsed={collapsed} />
        <Button
          variant="ghost"
          size="sm"
          className={cn("mt-auto", collapsed ? "justify-center" : "justify-start")}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-5" aria-hidden /> Contraer
            </>
          )}
        </Button>
      </aside>

      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="left" className="w-72 bg-sidebar p-3">
          <SheetHeader className="p-1">
            <SheetTitle>
              <Logo />
            </SheetTitle>
            <SheetDescription className="sr-only">Navegación principal</SheetDescription>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMenuAbierto(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("transition-[padding]", collapsed ? "md:pl-16" : "md:pl-60")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <Menu className="size-5" aria-hidden />
          </Button>
          <div className="relative max-w-sm flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              disabled
              type="search"
              placeholder="Buscar (próximamente)"
              aria-label="Buscar, no disponible todavía"
              className="pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeMenu />
            <SessionMenu />
          </div>
        </header>
        <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
