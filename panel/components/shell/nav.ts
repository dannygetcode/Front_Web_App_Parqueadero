import { DoorOpen, CreditCard, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/pagos", label: "Pagos", icon: CreditCard },
  { href: "/puerta", label: "Puerta", icon: DoorOpen },
];
