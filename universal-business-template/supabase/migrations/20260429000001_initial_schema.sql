-- =============================================================================
-- UNIVERSAL BUSINESS AUTOMATION TEMPLATE — Initial Schema
-- Version: 1.0.0
-- Created: 2026-04-29
-- Author: HUMANEX Database Agent
--
-- Architecture: Multi-tenant, config-driven, plugin-based
-- Every table (except tenants itself) carries tenant_id for full isolation.
-- RLS enforces tenant isolation at the database layer.
-- Service role (supabaseAdmin) bypasses RLS automatically.
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =============================================================================
-- ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('owner', 'manager', 'employee', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.work_item_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('cash', 'bank_transfer', 'card', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_channel AS ENUM ('whatsapp', 'email', 'in_app', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.integration_provider AS ENUM (
    'smartbill', 'whatsapp_twilio', 'whatsapp_wati', 'resend', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reminder_channel AS ENUM ('whatsapp', 'email', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.contact_type AS ENUM ('person', 'company');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tenant_plan AS ENUM ('standard', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- SECTION 1: TENANTS
-- Core multi-tenant registry. One row per client firm.
--
-- config JSONB structure (documented here, enforced by application layer):
-- {
--   "branding": {
--     "company_name": "Electrician SRL",
--     "logo_url": "https://...",
--     "primary_color": "#1a73e8",
--     "secondary_color": "#fbbc04"
--   },
--   "workflow": {
--     "work_item_statuses": ["NOU", "IN ASTEPTARE", "IN PROGRES", "FINALIZAT", "FACTURAT", "INCASAT"],
--     "work_item_types": ["Instalatie noua", "Revizie", "Urgenta", "Consultanta"],
--     "initial_status": "NOU",
--     "terminal_statuses": ["INCASAT", "ANULAT"],
--     "auto_invoice_on_status": "FINALIZAT"
--   },
--   "notifications": {
--     "payment_reminder_days": [7, 14, 30],
--     "default_channel": "whatsapp",
--     "owner_email": "patron@firma.ro",
--     "owner_phone": "+40712345678"
--   },
--   "invoicing": {
--     "tax_pct": 19,
--     "invoice_series": "FACT",
--     "payment_due_days": 15,
--     "currency": "RON"
--   },
--   "modules": {
--     "crm": true,
--     "work_items": true,
--     "teams": true,
--     "invoicing": true,
--     "payments": true,
--     "notifications": true,
--     "reports": true,
--     "field_access": true
--   }
-- }
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}',
  plan        public.tenant_plan NOT NULL DEFAULT 'standard',
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: tenants table is managed only by service role (no user-level policies needed)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read their own tenant row (matched via profiles)
CREATE POLICY "tenant_select_own" ON public.tenants
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- SECTION 2: PROFILES (Auth & Roles)
-- One row per user per tenant. Linked to auth.users.
-- role hierarchy: owner > manager > employee > viewer
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  role          public.user_role NOT NULL DEFAULT 'employee',
  avatar_url    TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_same_tenant" ON public.profiles
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "profiles_insert_owner_manager" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() IN ('owner', 'manager')
  );

CREATE POLICY "profiles_update_owner_manager" ON public.profiles
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.get_user_role() IN ('owner', 'manager'));

-- =============================================================================
-- HELPER FUNCTIONS (Security Definer — execute as owner, bypasses RLS)
-- Must be created before any policy that references them.
-- We use CREATE OR REPLACE so re-running the migration is safe.
-- =============================================================================

-- Returns the tenant_id of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Returns true if the current user has at least the given role
CREATE OR REPLACE FUNCTION public.has_role(minimum_role public.user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_order INTEGER;
  user_role_order INTEGER;
BEGIN
  role_order := CASE minimum_role
    WHEN 'viewer'   THEN 1
    WHEN 'employee' THEN 2
    WHEN 'manager'  THEN 3
    WHEN 'owner'    THEN 4
  END;
  user_role_order := CASE public.get_user_role()
    WHEN 'viewer'   THEN 1
    WHEN 'employee' THEN 2
    WHEN 'manager'  THEN 3
    WHEN 'owner'    THEN 4
    ELSE 0
  END;
  RETURN user_role_order >= role_order;
END;
$$;

-- =============================================================================
-- SECTION 3: CONTACTS (CRM universal)
-- Industry-agnostic contact registry. Supports both persons and companies.
-- tags and metadata allow per-tenant customization without schema changes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type          public.contact_type NOT NULL DEFAULT 'person',
  name          TEXT NOT NULL,
  company_name  TEXT,
  cui           TEXT,                     -- Romanian company tax ID
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  notes         TEXT,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  metadata      JSONB NOT NULL DEFAULT '{}',  -- per-industry custom fields
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_phone ON public.contacts(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email ON public.contacts(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_cui ON public.contacts(tenant_id, cui);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select_same_tenant" ON public.contacts
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "contacts_insert_manager_up" ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

CREATE POLICY "contacts_update_manager_up" ON public.contacts
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.has_role('manager'));

CREATE POLICY "contacts_delete_owner" ON public.contacts
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'owner'
  );

-- =============================================================================
-- SECTION 4: TEAMS
-- Logical groupings of employees. Teams are assigned to work items.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_tenant ON public.teams(tenant_id);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select_same_tenant" ON public.teams
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "teams_insert_manager_up" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

CREATE POLICY "teams_update_manager_up" ON public.teams
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.has_role('manager'));

CREATE POLICY "teams_delete_owner" ON public.teams
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'owner'
  );

-- Team membership
CREATE TABLE IF NOT EXISTS public.team_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select_same_tenant" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "team_members_insert_manager_up" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('manager')
    AND team_id IN (
      SELECT id FROM public.teams WHERE tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "team_members_delete_manager_up" ON public.team_members
  FOR DELETE TO authenticated
  USING (
    public.has_role('manager')
    AND team_id IN (
      SELECT id FROM public.teams WHERE tenant_id = public.get_user_tenant_id()
    )
  );

-- =============================================================================
-- SECTION 5: WORK ITEMS (Lucrari/Joburi/Proiecte — generic)
-- The central entity of the system. type and status are TEXT (not enum)
-- so they can be configured per-tenant via tenants.config->>'workflow'.
-- Custom fields per industry are stored in metadata JSONB.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.work_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id       UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  team_id          UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL,          -- configured per tenant (e.g. "Instalatie noua")
  status           TEXT NOT NULL,          -- configured per tenant (e.g. "NOU")
  priority         public.work_item_priority NOT NULL DEFAULT 'medium',
  estimated_value  NUMERIC(14,2),
  actual_value     NUMERIC(14,2),
  scheduled_start  TIMESTAMPTZ,
  scheduled_end    TIMESTAMPTZ,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  metadata         JSONB NOT NULL DEFAULT '{}',  -- industry-specific custom fields
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_items_tenant ON public.work_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_items_tenant_status ON public.work_items(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_work_items_tenant_team ON public.work_items(tenant_id, team_id);
CREATE INDEX IF NOT EXISTS idx_work_items_contact ON public.work_items(contact_id);
CREATE INDEX IF NOT EXISTS idx_work_items_created_by ON public.work_items(created_by);

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

-- owner/manager: full access to all work items in tenant
CREATE POLICY "work_items_select_manager_up" ON public.work_items
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

-- employee: sees only work items assigned to their team
CREATE POLICY "work_items_select_employee" ON public.work_items
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'employee'
    AND team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- viewer: full read within tenant
CREATE POLICY "work_items_select_viewer" ON public.work_items
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'viewer'
  );

CREATE POLICY "work_items_insert_manager_up" ON public.work_items
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

-- employee can update status on their own team's work items
CREATE POLICY "work_items_update_manager_up" ON public.work_items
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.has_role('manager')
      OR (
        public.get_user_role() = 'employee'
        AND team_id IN (
          SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "work_items_delete_owner" ON public.work_items
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'owner'
  );

-- Status change history — immutable ledger of all transitions
CREATE TABLE IF NOT EXISTS public.work_item_status_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id   UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  from_status    TEXT,
  to_status      TEXT NOT NULL,
  changed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note           TEXT,
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_work_item ON public.work_item_status_history(work_item_id, changed_at DESC);

ALTER TABLE public.work_item_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "status_history_select_same_tenant" ON public.work_item_status_history
  FOR SELECT TO authenticated
  USING (
    work_item_id IN (
      SELECT id FROM public.work_items WHERE tenant_id = public.get_user_tenant_id()
    )
  );

-- Only functions (SECURITY DEFINER) write to this table; no direct user INSERT
CREATE POLICY "status_history_insert_service" ON public.work_item_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    work_item_id IN (
      SELECT id FROM public.work_items WHERE tenant_id = public.get_user_tenant_id()
    )
    AND public.has_role('employee')
  );

-- File attachments per work item
CREATE TABLE IF NOT EXISTS public.work_item_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id  UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  file_url      TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  uploaded_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_item_files_work_item ON public.work_item_files(work_item_id);
CREATE INDEX IF NOT EXISTS idx_work_item_files_tenant ON public.work_item_files(tenant_id);

ALTER TABLE public.work_item_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_item_files_select_same_tenant" ON public.work_item_files
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "work_item_files_insert_employee_up" ON public.work_item_files
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('employee')
  );

CREATE POLICY "work_item_files_delete_manager_up" ON public.work_item_files
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

-- Generic key-value store for custom fields per work item
-- Keys are defined in tenant config; values are always stored as TEXT
CREATE TABLE IF NOT EXISTS public.work_item_field_values (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id  UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  field_key     TEXT NOT NULL,
  field_value   TEXT,
  UNIQUE(work_item_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_field_values_work_item ON public.work_item_field_values(work_item_id);
CREATE INDEX IF NOT EXISTS idx_field_values_tenant ON public.work_item_field_values(tenant_id);

ALTER TABLE public.work_item_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "field_values_select_same_tenant" ON public.work_item_field_values
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "field_values_insert_employee_up" ON public.work_item_field_values
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('employee')
  );

CREATE POLICY "field_values_update_employee_up" ON public.work_item_field_values
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.has_role('employee'));

CREATE POLICY "field_values_delete_manager_up" ON public.work_item_field_values
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

-- =============================================================================
-- SECTION 6: INVOICES & PAYMENTS
-- Full invoicing lifecycle: draft -> sent -> paid/overdue/cancelled
-- invoice_items are line items; payments are partial or full settlements.
-- payment_reminders are scheduled notification tasks.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  work_item_id    UUID REFERENCES public.work_items(id) ON DELETE SET NULL,
  contact_id      UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL,
  external_id     TEXT,                  -- e.g. SmartBill invoice ID
  issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE NOT NULL,
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_pct         NUMERIC(5,2) NOT NULL DEFAULT 19,
  tax_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          public.invoice_status NOT NULL DEFAULT 'draft',
  external_url    TEXT,                  -- link to PDF in SmartBill
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON public.invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_work_item ON public.invoices(work_item_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact ON public.invoices(contact_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_same_tenant" ON public.invoices
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "invoices_insert_manager_up" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

CREATE POLICY "invoices_update_manager_up" ON public.invoices
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.has_role('manager'));

CREATE POLICY "invoices_delete_owner" ON public.invoices
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'owner'
  );

-- Invoice line items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  quantity     NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price   NUMERIC(12,2) NOT NULL,
  total        NUMERIC(14,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_select_same_tenant" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "invoice_items_insert_manager_up" ON public.invoice_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('manager')
    AND invoice_id IN (
      SELECT id FROM public.invoices WHERE tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "invoice_items_update_manager_up" ON public.invoice_items
  FOR UPDATE TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE tenant_id = public.get_user_tenant_id()
    )
  )
  WITH CHECK (public.has_role('manager'));

CREATE POLICY "invoice_items_delete_manager_up" ON public.invoice_items
  FOR DELETE TO authenticated
  USING (
    public.has_role('manager')
    AND invoice_id IN (
      SELECT id FROM public.invoices WHERE tenant_id = public.get_user_tenant_id()
    )
  );

-- Payments received against invoices
CREATE TABLE IF NOT EXISTS public.payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id   UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount       NUMERIC(14,2) NOT NULL,
  method       public.payment_method NOT NULL DEFAULT 'bank_transfer',
  reference    TEXT,                    -- bank transfer ref, receipt number, etc.
  paid_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_same_tenant" ON public.payments
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "payments_insert_manager_up" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

CREATE POLICY "payments_update_manager_up" ON public.payments
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.has_role('manager'));

-- Scheduled payment reminder tasks (consumed by notification worker)
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id    UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  reminder_day  INTEGER NOT NULL CHECK (reminder_day > 0),   -- days after due_date
  channel       public.reminder_channel NOT NULL DEFAULT 'email',
  status        public.notification_status NOT NULL DEFAULT 'pending',
  scheduled_at  TIMESTAMPTZ NOT NULL,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_tenant ON public.payment_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice ON public.payment_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled ON public.payment_reminders(scheduled_at)
  WHERE status = 'pending';

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_reminders_select_same_tenant" ON public.payment_reminders
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "payment_reminders_insert_manager_up" ON public.payment_reminders
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

CREATE POLICY "payment_reminders_update_manager_up" ON public.payment_reminders
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.has_role('manager'));

-- =============================================================================
-- SECTION 7: NOTIFICATIONS
-- Templates define message structure per channel per event type.
-- notifications_log records every send attempt for auditing.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key           TEXT NOT NULL,           -- e.g. 'invoice_issued', 'payment_reminder_7d'
  channel       public.notification_channel NOT NULL,
  subject       TEXT,                    -- used for email channel
  body          TEXT NOT NULL,           -- supports {{variables}} interpolation
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key, channel)
);

CREATE INDEX IF NOT EXISTS idx_notif_templates_tenant ON public.notification_templates(tenant_id);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_templates_select_same_tenant" ON public.notification_templates
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "notif_templates_insert_owner" ON public.notification_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'owner'
  );

CREATE POLICY "notif_templates_update_owner" ON public.notification_templates
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.get_user_role() = 'owner');

-- Full delivery log — immutable, INSERT only by service role or functions
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_key       TEXT NOT NULL,
  recipient_type     TEXT NOT NULL CHECK (recipient_type IN ('client', 'owner', 'manager', 'employee')),
  recipient_contact  TEXT NOT NULL,        -- phone number or email address
  work_item_id       UUID REFERENCES public.work_items(id) ON DELETE SET NULL,
  invoice_id         UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  status             public.notification_status NOT NULL DEFAULT 'pending',
  sent_at            TIMESTAMPTZ,
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_log_tenant_date ON public.notifications_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_log_status ON public.notifications_log(status) WHERE status = 'pending';

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_log_select_same_tenant" ON public.notifications_log
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "notif_log_insert_manager_up" ON public.notifications_log
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

-- =============================================================================
-- SECTION 8: INTEGRATIONS
-- tenant_integrations stores per-tenant provider config (API keys via JSONB).
-- integration_logs records every API call for debugging.
-- NOTE: Sensitive keys in config should be encrypted at application layer
-- before being stored. pgcrypto is available for server-side encryption.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider      public.integration_provider NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',   -- API keys, endpoints, etc.
  active        BOOLEAN NOT NULL DEFAULT false,
  last_sync_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON public.tenant_integrations(tenant_id);

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_select_owner" ON public.tenant_integrations
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'owner'
  );

CREATE POLICY "integrations_insert_owner" ON public.tenant_integrations
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'owner'
  );

CREATE POLICY "integrations_update_owner" ON public.tenant_integrations
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.get_user_role() = 'owner');

-- API call log for every external integration request
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider          public.integration_provider NOT NULL,
  action            TEXT NOT NULL,            -- e.g. 'create_invoice', 'send_whatsapp'
  request_payload   JSONB,
  response_payload  JSONB,
  status            TEXT NOT NULL CHECK (status IN ('success', 'error')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_tenant ON public.integration_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON public.integration_logs(tenant_id, status);

ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_logs_select_owner" ON public.integration_logs
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'owner'
  );

CREATE POLICY "integration_logs_insert_service" ON public.integration_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

-- =============================================================================
-- SECTION 9: REPORTS
-- Stores snapshots of generated reports (monthly auto, on-demand, custom).
-- data JSONB contains the full report payload for historical replay.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.report_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  report_type    TEXT NOT NULL CHECK (report_type IN ('monthly', 'custom', 'ondemand')),
  period_start   DATE NOT NULL,
  period_end     DATE NOT NULL,
  data           JSONB NOT NULL DEFAULT '{}',   -- full report snapshot
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_to        TEXT[] NOT NULL DEFAULT '{}',  -- email addresses the report was sent to
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_runs_tenant ON public.report_runs(tenant_id, generated_at DESC);

ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_runs_select_manager_up" ON public.report_runs
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

CREATE POLICY "report_runs_insert_manager_up" ON public.report_runs
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

-- =============================================================================
-- SECTION 10: AUDIT LOG
-- Append-only record of all meaningful actions.
-- old_data / new_data store row snapshots for rollback capability.
-- ip_address is populated at application layer.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,           -- e.g. 'UPDATE', 'DELETE', 'STATUS_CHANGE'
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON public.audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_owner" ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'owner'
  );

-- Only service role and SECURITY DEFINER functions insert audit rows
CREATE POLICY "audit_log_insert_manager_up" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

-- =============================================================================
-- SECTION 11: FIELD TOKENS (Field access without full account)
-- Short-lived tokens allow field workers to update a specific work item
-- via a simple URL without logging in. Consumed once (used_at marks it spent).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.field_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  work_item_id  UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_tokens_token ON public.field_tokens(token);
CREATE INDEX IF NOT EXISTS idx_field_tokens_tenant ON public.field_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_field_tokens_work_item ON public.field_tokens(work_item_id);

ALTER TABLE public.field_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "field_tokens_select_manager_up" ON public.field_tokens
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

CREATE POLICY "field_tokens_insert_manager_up" ON public.field_tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role('manager')
  );

CREATE POLICY "field_tokens_update_manager_up" ON public.field_tokens
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (public.has_role('manager'));

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. handle_new_user()
-- Triggered on auth.users INSERT. Creates a profile row.
-- tenant_id must be passed via raw_user_meta_data->>'tenant_id' at signup.
-- If no tenant_id is present (owner self-signup), profile insert is deferred
-- until the tenant is created and the owner is linked manually via service role.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_display_name TEXT;
  v_role public.user_role;
BEGIN
  v_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'employee'
  );

  -- Only create profile if tenant_id is known at signup time
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, tenant_id, display_name, role)
    VALUES (NEW.id, v_tenant_id, v_display_name, v_role)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. update_work_item_status(work_item_id, new_status, changed_by, note)
-- Atomically updates work item status and logs the transition.
-- Also sets started_at / completed_at timestamps based on status semantics
-- configured in tenant.config->workflow.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_work_item_status(
  p_work_item_id  UUID,
  p_new_status    TEXT,
  p_changed_by    UUID,
  p_note          TEXT DEFAULT NULL
)
RETURNS public.work_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item       public.work_items;
  v_old_status TEXT;
  v_tenant_cfg JSONB;
  v_terminal   JSONB;
BEGIN
  -- Lock the row to prevent concurrent status updates
  SELECT * INTO v_item FROM public.work_items WHERE id = p_work_item_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'work_item % not found', p_work_item_id;
  END IF;

  v_old_status := v_item.status;

  -- Fetch tenant workflow config
  SELECT config INTO v_tenant_cfg FROM public.tenants WHERE id = v_item.tenant_id;
  v_terminal := v_tenant_cfg->'workflow'->'terminal_statuses';

  -- Update timestamps based on status semantics
  UPDATE public.work_items
  SET
    status      = p_new_status,
    started_at  = CASE
      WHEN v_item.started_at IS NULL AND p_new_status IN (
        SELECT jsonb_array_elements_text(v_tenant_cfg->'workflow'->'work_item_statuses')
        OFFSET 2 LIMIT 1
      ) THEN now()
      ELSE v_item.started_at
    END,
    completed_at = CASE
      WHEN p_new_status = v_tenant_cfg->'workflow'->>'auto_invoice_on_status'
        OR v_terminal @> to_jsonb(p_new_status)
      THEN now()
      ELSE v_item.completed_at
    END,
    updated_at  = now()
  WHERE id = p_work_item_id
  RETURNING * INTO v_item;

  -- Log the transition
  INSERT INTO public.work_item_status_history
    (work_item_id, from_status, to_status, changed_by, note)
  VALUES
    (p_work_item_id, v_old_status, p_new_status, p_changed_by, p_note);

  RETURN v_item;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_work_item_status(UUID, TEXT, UUID, TEXT)
  TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. calculate_invoice_totals(invoice_id)
-- Recalculates subtotal, tax_amount, and total from invoice_items.
-- Called by trigger on invoice_items INSERT/UPDATE/DELETE.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_invoice_totals(p_invoice_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal  NUMERIC(14,2);
  v_tax_pct   NUMERIC(5,2);
  v_tax_amt   NUMERIC(14,2);
BEGIN
  SELECT COALESCE(SUM(total), 0)
  INTO v_subtotal
  FROM public.invoice_items
  WHERE invoice_id = p_invoice_id;

  SELECT tax_pct INTO v_tax_pct
  FROM public.invoices
  WHERE id = p_invoice_id;

  v_tax_amt := ROUND(v_subtotal * v_tax_pct / 100, 2);

  UPDATE public.invoices
  SET
    subtotal   = v_subtotal,
    tax_amount = v_tax_amt,
    total      = v_subtotal + v_tax_amt,
    updated_at = now()
  WHERE id = p_invoice_id;
END;
$$;

-- Trigger: recalculate totals whenever invoice_items change
CREATE OR REPLACE FUNCTION public.trg_recalculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_invoice_totals(OLD.invoice_id);
  ELSE
    PERFORM public.calculate_invoice_totals(NEW.invoice_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_items_totals ON public.invoice_items;
CREATE TRIGGER trg_invoice_items_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_invoice_totals();

-- ----------------------------------------------------------------------------
-- 4. get_tenant_dashboard_stats(tenant_id)
-- Returns a JSON snapshot for the dashboard KPI widget.
-- Runs as SECURITY DEFINER so it can aggregate across RLS-protected tables.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_tenant_dashboard_stats(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'active_work_items',   (
      SELECT COUNT(*) FROM public.work_items
      WHERE tenant_id = p_tenant_id
        AND status NOT IN (
          SELECT jsonb_array_elements_text(
            t.config->'workflow'->'terminal_statuses'
          ) FROM public.tenants t WHERE t.id = p_tenant_id
        )
    ),
    'revenue_this_month',  (
      SELECT COALESCE(SUM(total), 0) FROM public.invoices
      WHERE tenant_id = p_tenant_id
        AND status = 'paid'
        AND date_trunc('month', issue_date) = date_trunc('month', CURRENT_DATE)
    ),
    'outstanding_amount',  (
      SELECT COALESCE(SUM(total), 0) FROM public.invoices
      WHERE tenant_id = p_tenant_id
        AND status IN ('sent', 'overdue')
    ),
    'overdue_invoices',    (
      SELECT COUNT(*) FROM public.invoices
      WHERE tenant_id = p_tenant_id
        AND status IN ('sent', 'overdue')
        AND due_date < CURRENT_DATE
    ),
    'urgent_work_items',   (
      SELECT COUNT(*) FROM public.work_items
      WHERE tenant_id = p_tenant_id
        AND priority = 'urgent'
        AND status NOT IN (
          SELECT jsonb_array_elements_text(
            t.config->'workflow'->'terminal_statuses'
          ) FROM public.tenants t WHERE t.id = p_tenant_id
        )
    ),
    'contacts_total',      (
      SELECT COUNT(*) FROM public.contacts WHERE tenant_id = p_tenant_id
    ),
    'generated_at',        now()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_dashboard_stats(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. schedule_payment_reminders(invoice_id)
-- Creates payment_reminders rows for each day configured in tenant config.
-- scheduled_at = invoice.due_date + reminder_day days.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.schedule_payment_reminders(p_invoice_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice       public.invoices;
  v_tenant_cfg    JSONB;
  v_reminder_days JSONB;
  v_day           INTEGER;
  v_channel       public.reminder_channel;
BEGIN
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invoice % not found', p_invoice_id;
  END IF;

  SELECT config INTO v_tenant_cfg FROM public.tenants WHERE id = v_invoice.tenant_id;

  v_reminder_days := COALESCE(
    v_tenant_cfg->'notifications'->'payment_reminder_days',
    '[7, 14, 30]'::jsonb
  );

  v_channel := COALESCE(
    v_tenant_cfg->'notifications'->>'default_channel',
    'email'
  )::public.reminder_channel;

  -- Delete any existing pending reminders for this invoice before re-scheduling
  DELETE FROM public.payment_reminders
  WHERE invoice_id = p_invoice_id AND status = 'pending';

  FOR v_day IN
    SELECT (jsonb_array_elements_text(v_reminder_days))::INTEGER
  LOOP
    INSERT INTO public.payment_reminders
      (tenant_id, invoice_id, reminder_day, channel, status, scheduled_at)
    VALUES (
      v_invoice.tenant_id,
      p_invoice_id,
      v_day,
      v_channel,
      'pending',
      (v_invoice.due_date + (v_day || ' days')::INTERVAL)::TIMESTAMPTZ
    );
  END LOOP;
END;
$$;

-- Trigger: when invoice status becomes 'sent', schedule reminders
CREATE OR REPLACE FUNCTION public.trg_invoice_sent_schedule_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'sent' AND (OLD.status IS DISTINCT FROM 'sent') THEN
    PERFORM public.schedule_payment_reminders(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_sent ON public.invoices;
CREATE TRIGGER trg_invoice_sent
  AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.trg_invoice_sent_schedule_reminders();

-- ----------------------------------------------------------------------------
-- 6. Trigger on work_items UPDATE: log status changes to status_history
-- This is the automatic version; update_work_item_status() is the explicit API.
-- The trigger fires for any direct UPDATE that changes status.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_work_item_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.work_item_status_history
      (work_item_id, from_status, to_status, changed_by, note)
    VALUES
      (NEW.id, OLD.status, NEW.status, auth.uid(), NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_item_status ON public.work_items;
CREATE TRIGGER trg_work_item_status
  AFTER UPDATE ON public.work_items
  FOR EACH ROW EXECUTE FUNCTION public.trg_work_item_status_change();

-- update updated_at on work_items
CREATE OR REPLACE FUNCTION public.trg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_items_updated_at ON public.work_items;
CREATE TRIGGER trg_work_items_updated_at
  BEFORE UPDATE ON public.work_items
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Trigger on payments INSERT: mark invoice as 'paid' when fully settled
-- Compares SUM(payments.amount) against invoices.total.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_payment_check_invoice_settled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_paid  NUMERIC(14,2);
  v_invoice_total NUMERIC(14,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id;

  SELECT total INTO v_invoice_total
  FROM public.invoices
  WHERE id = NEW.invoice_id;

  IF v_total_paid >= v_invoice_total THEN
    UPDATE public.invoices
    SET status = 'paid', updated_at = now()
    WHERE id = NEW.invoice_id AND status != 'paid';

    -- Cancel any pending reminders
    UPDATE public.payment_reminders
    SET status = 'failed'  -- reuse 'failed' to mean "cancelled / no longer needed"
    WHERE invoice_id = NEW.invoice_id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_settle ON public.payments;
CREATE TRIGGER trg_payment_settle
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_payment_check_invoice_settled();

-- =============================================================================
-- REALTIME
-- Enable Realtime publication + full row payloads for live-updating tables.
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.work_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_log;

ALTER TABLE public.work_items REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.notifications_log REPLICA IDENTITY FULL;

-- =============================================================================
-- GRANTS
-- anon role cannot access any business tables.
-- authenticated role has access governed entirely by RLS.
-- =============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
