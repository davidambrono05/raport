import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { WorkItem } from "@/modules/workItems/types";
import { listWorkItems } from "@/integrations/supabase/queries/workItems";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CreateJobDialog } from "@/components/CreateJobDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  component: JobsPage,
});

function JobsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: jobs = [], refetch } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const result = await listWorkItems(supabase);
      return (result || []) as WorkItem[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Lucrări</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Lucrare nouă
        </Button>
      </div>

      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-lg border p-4"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {job.contact?.name} · {job.status}
                </p>
              </div>
              <div className="text-right">
                {job.estimated_value && (
                  <p className="font-medium">{job.estimated_value.toFixed(2)} RON</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {job.scheduled_start
                    ? new Date(job.scheduled_start).toLocaleDateString("ro-RO")
                    : "Neprogramat"}
                </p>
              </div>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nicio lucrare înregistrată.
          </p>
        )}
      </div>

      {showCreate && (
        <CreateJobDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
