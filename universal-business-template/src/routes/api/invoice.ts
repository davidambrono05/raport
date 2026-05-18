import { createServerFunction } from "@tanstack/react-start/server";
import { supabase } from "@/integrations/supabase/client";
import { createSupabaseServerClient } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export const serverCreateInvoice = createServerFunction(
  async ({ request }) => {
    const body = await request.json() as { workItemId: string };
    const { workItemId } = body;

    if (!workItemId) {
      return new Response(JSON.stringify({ error: "workItemId este obligatoriu" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const serverSupabase = createSupabaseServerClient();
    if (!serverSupabase) {
      return new Response(JSON.stringify({ error: "Server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // 1. Get work item + contact
      const { data: workItem, error: workError } = await serverSupabase
        .from("work_items")
        .select(`
          *,
          contact:contacts(*),
          team:teams(*)
        `)
        .eq("id", workItemId)
        .single();

      if (workError || !workItem) {
        return new Response(JSON.stringify({ error: "Lucrare negăsită" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Get tenant config for SmartBill
      const { data: tenant } = await serverSupabase
        .from("tenants")
        .select("*")
        .eq("id", workItem.tenant_id)
        .single();

      if (!tenant) throw new Error("Tenant negăsit");

      // 3. Create invoice in our DB first
      const { data: invoice, error: invError } = await serverSupabase
        .from("invoices")
        .insert({
          tenant_id: workItem.tenant_id,
          work_item_id: workItem.id,
          contact_id: workItem.contact_id,
          invoice_number: `${tenant.config?.invoicing?.invoice_series || "FACT"}-${Date.now()}`,
          issue_date: new Date().toISOString().split("T")[0]!,
          due_date: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]!,
          subtotal: workItem.estimated_value || 0,
          tax_pct: (tenant.config as Record<string, unknown>)?.invoicing as number ?? 19,
          tax_amount: ((workItem.estimated_value || 0) * 0.19),
          total: (workItem.estimated_value || 0) * 1.19,
          status: "draft" as const,
        })
        .select()
        .single();

      if (invError || !invoice) throw invError;

      // 4. Add invoice items
      await serverSupabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        description: (workItem as { title: string }).title,
        quantity: 1,
        unit_price: workItem.estimated_value || 0,
        total: workItem.estimated_value || 0,
      });

      return new Response(JSON.stringify({ success: true, invoiceId: invoice.id }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Eroare necunoscută" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
);
