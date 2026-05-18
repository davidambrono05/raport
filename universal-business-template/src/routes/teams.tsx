import { createFileRoute } from "@tanstack/react-router";
import { TeamList } from "@/modules/teams/TeamList";
import type { TeamMember } from "@/modules/teams/types";
import { listTeams } from "@/integrations/supabase/queries/teams";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
});

function TeamsPage() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const result = await listTeams(supabase);
      return (result || []).map((t) => ({
        id: t.id,
        name: t.name,
        role: t.description || "member",
        avatarUrl: undefined,
        activeWorkItems: (t.work_items?.[0]?.count ?? 0) as number,
        completedWorkItems: 0,
      })) as TeamMember[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <TeamList members={teams} />
    </div>
  );
}
