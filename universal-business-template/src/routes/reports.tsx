import { createFileRoute } from "@tanstack/react-router";
import { ReportList } from "@/modules/reports/ReportList";
import type { ReportEntry } from "@/modules/reports/types";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

const REPORTS: ReportEntry[] = [
  {
    id: "1",
    name: "Raport Lunar — Lucrări",
    frequency: "monthly",
    format: "pdf",
    status: "idle",
    lastGeneratedAt: undefined,
  },
  {
    id: "2",
    name: "Raport Lunar — Facturare",
    frequency: "monthly",
    format: "excel",
    status: "idle",
    lastGeneratedAt: undefined,
  },
  {
    id: "3",
    name: "Stoc Client Restanțieri",
    frequency: "manual",
    format: "pdf",
    status: "idle",
    lastGeneratedAt: undefined,
  },
];

function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Rapoarte</h1>
      <ReportList
        reports={REPORTS}
        onGenerate={(report) => {
          console.log("Generate report:", report.name);
          alert(`Raportul "${report.name}" va fi generat în curând.`);
        }}
        onDownload={(report) => {
          console.log("Download report:", report.name);
        }}
      />
    </div>
  );
}
