import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/modules/dashboard/Dashboard";
import type { DashboardData } from "@/modules/dashboard/types";
import { getDashboardStats } from "@/integrations/supabase/queries/invoices";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const stats = await getDashboardStats(supabase);
      return stats;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-destructive">Eroare la încărcarea datelor</p>
      </div>
    );
  }

  const dashboardData: DashboardData = {
    kpis: [
      { label: "Lucrări active", value: data.active_work_items ?? 0, unit: "buc" },
      {
        label: "Venituri luna asta",
        value: `${(data.revenue_this_month ?? 0).toFixed(2)} RON`,
      },
      {
        label: "Neîncasat",
        value: `${(data.outstanding_amount ?? 0).toFixed(2)} RON`,
        trend: {
          direction:
            (data.outstanding_amount ?? 0) > 0 ? "up" : "stable",
          value: 0,
        },
      },
      { label: "Clienți", value: data.contacts_total ?? 0, unit: "buc" },
    ],
    alerts: [
      ...(data.overdue_invoices ?? 0) > 0
        ? [
            {
              id: "overdue",
              type: "error" as const,
              message: `${data.overdue_invoices} facturi restante!`,
            },
          ]
        : [],
      ...(data.urgent_work_items ?? 0) > 0
        ? [
            {
              id: "urgent",
              type: "warning" as const,
              message: `${data.urgent_work_items} lucrări urgente în desfășurare!`,
            },
          ]
        : [],
    ],
    recentActivity: [],
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Dashboard
      </h1>
      <Dashboard data={dashboardData} />
    </div>
  );
}
