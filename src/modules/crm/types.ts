export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  vatCode?: string;
  notes?: string;
  createdAt: Date;
  totalWorkItems?: number;
  totalInvoiced?: number;
}

export interface ClientFilters {
  search: string;
}
