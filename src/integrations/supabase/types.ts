export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          config: Json;
          plan: 'standard' | 'premium';
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug?: string;
          name: string;
          config?: Json;
          plan?: 'standard' | 'premium';
          active?: boolean;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          tenant_id: string;
          display_name: string;
          role: 'owner' | 'manager' | 'employee' | 'viewer';
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          display_name: string;
          role?: 'owner' | 'manager' | 'employee' | 'viewer';
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          tenant_id: string;
          type: 'person' | 'company';
          name: string;
          company_name: string | null;
          cui: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          tags: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          type?: 'person' | 'company';
          name: string;
          company_name?: string | null;
          cui?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      work_items: {
        Row: {
          id: string;
          tenant_id: string;
          contact_id: string | null;
          team_id: string | null;
          title: string;
          description: string | null;
          type: string;
          status: string;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          estimated_value: number | null;
          actual_value: number | null;
          scheduled_start: string | null;
          scheduled_end: string | null;
          started_at: string | null;
          completed_at: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          contact_id?: string | null;
          team_id?: string | null;
          title: string;
          description?: string | null;
          type: string;
          status: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          estimated_value?: number | null;
          actual_value?: number | null;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          tenant_id: string;
          work_item_id: string | null;
          contact_id: string | null;
          invoice_number: string;
          external_id: string | null;
          issue_date: string;
          due_date: string;
          subtotal: number;
          tax_pct: number;
          tax_amount: number;
          total: number;
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          external_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          work_item_id?: string | null;
          contact_id?: string | null;
          invoice_number: string;
          external_id?: string | null;
          issue_date?: string;
          due_date: string;
          subtotal?: number;
          tax_pct?: number;
          tax_amount?: number;
          total: number;
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          external_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          invoice_id: string;
          amount: number;
          method: 'cash' | 'bank_transfer' | 'card' | 'other';
          reference: string | null;
          paid_at: string;
          recorded_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          invoice_id: string;
          amount: number;
          method?: 'cash' | 'bank_transfer' | 'card' | 'other';
          reference?: string | null;
          paid_at?: string;
          recorded_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Enums: {
      user_role: 'owner' | 'manager' | 'employee' | 'viewer';
      work_item_priority: 'low' | 'medium' | 'high' | 'urgent';
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
      payment_method: 'cash' | 'bank_transfer' | 'card' | 'other';
    };
  };
};
