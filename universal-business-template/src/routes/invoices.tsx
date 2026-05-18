import { createFileRoute } from "@tanstack/react-router";
import { PaymentList } from "@/modules/payments/PaymentList";
import type { Payment } from "@/modules/payments/types";
import { listInvoices } from "@/integrations/supabase/queries/invoices";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const result = await listInvoices(supabase);
      return (result || []).map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        clientName: inv.contact?.name || "Necunoscut",
        amount: inv.total,
        status: (inv.status === "paid"
          ? "paid"
          : inv.status === "overdue" || new Date(inv.due_date) < new Date()
            ? "overdue"
            : "pending") as "paid" | "pending" | "overdue",
        dueDate: new Date(inv.due_date),
      })) as Payment[];
    },
  });

  const summary = {
    totalInvoiced: invoices.reduce((s, i) => s + i.amount, 0),
    totalPaid: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0),
    totalOverdue: invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    overdueCount: invoices.filter((i) => i.status === "overdue").length,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Facturi</h1>
      <PaymentList payments={invoices} summary={summary} />
    </div>
  );
}
