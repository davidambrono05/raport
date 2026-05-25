export interface Material {
  id: string;
  name: string;
  unit: string;
  price_per_unit: number;
  category: string;
}

export interface Operation {
  id: string;
  name: string;
  description: string;
  default_price: number;
  category: string;
}

export interface WorkItemMaterial {
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
}

export interface WorkItemOperation {
  operation_id: string;
  operation_name: string;
  quantity: number;
  price: number;
}

export interface WorkItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_value?: number | null;
  actual_value?: number | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  team_lead_id?: string | null;
  team_lead_name?: string | null;
  team_member_ids?: string[];
  materials?: WorkItemMaterial[];
  operations?: WorkItemOperation[];
  notes?: string | null;
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
