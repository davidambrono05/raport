import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createContact } from "@/integrations/supabase/queries/contacts";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateClientDialog({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: "",
    company_name: "",
    cui: "",
    phone: "",
    email: "",
    address: "",
    type: "person" as "person" | "company",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    setError("");

    try {
      await createContact(supabase, form);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la salvare");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Client nou</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="type"
                checked={form.type === "person"}
                onChange={() => setForm((f) => ({ ...f, type: "person" }))}
              />
              Persoană fizică
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="type"
                checked={form.type === "company"}
                onChange={() => setForm((f) => ({ ...f, type: "company" }))}
              />
              Firmă
            </label>
          </div>

          <div>
            <label className="text-sm font-medium">Nume {form.type === "company" ? "firmă" : ""} *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder={form.type === "company" ? "Denumire firmă" : "Nume complet"}
            />
          </div>

          {form.type === "company" && (
            <div>
              <label className="text-sm font-medium">CUI</label>
              <input
                value={form.cui}
                onChange={(e) => setForm((f) => ({ ...f, cui: e.target.value }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="RO12345678"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="07__"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="email@exemplu.ro"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Adresă</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              placeholder="Adresa completă"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Anulează
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Se salvează..." : "Salvează"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
