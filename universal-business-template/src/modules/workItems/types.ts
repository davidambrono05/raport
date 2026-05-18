export interface WorkItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimated_value?: number | null;
  actual_value?: number | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  contact?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  };
  team?: {
    id: string;
    name: string;
  };
}

export interface WorkItemStatus {
  id: string;
  label: string;
  color: string;
  isFinal?: boolean;
}
