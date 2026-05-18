import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContact } from "@/integrations/supabase/queries/contacts";
import type { Contact } from "@/modules/crm/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/clients/$id")({
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();

  const { data: contact, isLoading, refetch } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const result = await getContact(supabase, id);
      return result as unknown as Contact & {
        work_items: { id: string; title: string; status: string; estimated_value: number }[];
        invoices: { id: string; invoice_number: string; total: number; status: string }[];
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p className="text-destructive">Clientul nu a fost găsit.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{contact.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">Informații contact</h2>
            <div className="space-y-2 text-sm">
              {contact.company_name && (
                <p>
                  <span className="text-muted-foreground">Firmă:</span>{" "}
                  <span className="text-foreground">{contact.company_name}</span>
                </p>
              )}
              {contact.cui && (
                <p>
                  <span className="text-muted-foreground">CUI:</span>{" "}
                  <span className="text-foreground">{contact.cui}</span>
                </p>
              )}
              {contact.phone && (
                <p>
                  <span className="text-muted-foreground">Telefon:</span>{" "}
                  <span className="text-foreground">{contact.phone}</span>
                </p>
              )}
              {contact.email && (
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="text-foreground">{contact.email}</span>
                </p>
              )}
              {contact.address && (
                <p>
                  <span className="text-muted-foreground">Adresă:</span>{" "}
                  <span className="text-foreground">{contact.address}</span>
                </p>
              )}
            </div>
          </div>

          {contact.work_items && contact.work_items.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-2">Lucrări ({contact.work_items.length})</h2>
              <ul className="space-y-2">
                {contact.work_items.map((job) => (
                  <li key={job.id} className="flex justify-between text-sm">
                    <Link to={`/jobs/${job.id}`} className="text-primary hover:underline">
                      {job.title}
                    </Link>
                    <span className="text-muted-foreground">{job.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {contact.invoices && contact.invoices.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-2">Facturi ({contact.invoices.length})</h2>
              <ul className="space-y-2">
                {contact.invoices.map((inv) => (
                  <li key={inv.id} className="flex justify-between text-sm">
                    <span className="text-foreground">{inv.invoice_number}</span>
                    <span className="text-muted-foreground">
                      {Number(inv.total).toFixed(2)} RON — {inv.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3">Acțiuni</h2>
            <div className="space-y-2">
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Lucrare nouă
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
