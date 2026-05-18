import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Users,
  Wrench,
  UsersRound,
  FileText,
  BarChart3,
  LogOut,
  UserCircle,
} from "lucide-react";
import type { Tenant } from "@/lib/config/types";

function getBranding(tenant: Tenant | null) {
  try {
    return tenant?.config as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export function Header() {
  const { session, profile, tenant, signOut } = useAuth();
  const location = useLocation();
  const branding = getBranding(tenant);

  const companyName =
    (branding?.["branding"] as Record<string, string>)?.["company_name"] ??
    tenant?.name ??
    "Business Automation";

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/clients", label: "Clienți", icon: Users },
    { to: "/jobs", label: "Lucrări", icon: Wrench },
    { to: "/teams", label: "Echipe", icon: UsersRound },
    { to: "/invoices", label: "Facturi", icon: FileText },
    { to: "/reports", label: "Rapoarte", icon: BarChart3 },
  ];

  if (!session) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-lg font-bold text-primary">
            {companyName}
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground md:block">
            {profile?.display_name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Ieșire</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
