# HUMANEX OS — Implementation Plan
> AI-powered Agency Operating System
> Authored by Hermes (AI CTO) — 2026-05-19
> Stack: React 19 + TanStack Router + Tailwind 4 + Supabase + Resend + Cloudflare Workers

---

## Architecture Overview

```
HUMANEX OS
├── /dashboard         → Agency overview (KPIs, revenue, agents status)
├── /leads             → Lead generation + enrichment + scoring
├── /outreach          → Email campaigns + follow-up + tracking
├── /clients           → CRM (active clients, pipeline, notes)
├── /pipeline          → Sales kanban (Lead → Contact → Proposal → Client → Delivered)
├── /agents            → AI agent orchestration status
└── /analytics         → Conversion rates, revenue, ROI
```

### Layered System
```
Hermes Agent (orchestrator)
  ├── Lead Research Agent   → scrape + enrich leads (cron zilnic)
  ├── Outreach Agent        → send emails + follow-up (cron la 3 zile)
  ├── CRM Agent             → update pipeline, log activity
  ├── Reporting Agent       → weekly analytics email to David
  └── Coding Agent          → Claude Code (feature builds)

Supabase (backend)
  ├── leads                 → raw scraped leads
  ├── lead_enrichments      → email, phone, website, score
  ├── outreach_campaigns    → campaign batches
  ├── outreach_emails       → individual sent emails + status
  ├── clients               → paying clients
  ├── pipeline_stages       → kanban stages
  ├── pipeline_items        → leads/clients in pipeline
  ├── ai_agent_runs         → agent execution log + cost
  └── analytics_events      → custom event tracking

Frontend (React + Tailwind 4)
  ├── Dashboard             → real-time KPIs from Supabase
  ├── Leads table           → filterable, sortable, bulk actions
  ├── Outreach composer     → write campaign, preview, send
  ├── Client CRM            → timeline, notes, invoices
  └── Agent monitor         → live status of running agents
```

---

## Phase 1: Foundation (Day 1 — TODAY)
**Goal:** Repo + Supabase schema + scaffold

### Task 1: Create humanex-os repo
```bash
cd /mnt/c/Users/david/Documents/HUMANEX
mkdir humanex-os && cd humanex-os
npm create vite@latest . -- --template react-ts
```

### Task 2: Install dependencies
```bash
npm install @supabase/supabase-js @tanstack/react-router @tanstack/react-query
npm install tailwindcss @tailwindcss/vite lucide-react recharts
npm install date-fns sonner zod react-hook-form @hookform/resolvers
npm install -D @types/node
```

### Task 3: Supabase schema (migration file)
See: supabase/migrations/001_humanex_os_schema.sql

### Task 4: Scaffold routes + layout
- `src/routes/__root.tsx` — sidebar layout
- `src/routes/index.tsx` → redirect /dashboard
- `src/routes/dashboard.tsx` — KPI cards
- `src/routes/leads.tsx` — leads table
- `src/routes/outreach.tsx` — campaigns
- `src/routes/clients.tsx` — CRM
- `src/routes/pipeline.tsx` — kanban
- `src/routes/agents.tsx` — agent status

---

## Phase 2: Lead Generation Engine (Day 1-2)
**Goal:** Automated lead scraping for electricieni/constructori Bacău+Brașov

### Sources:
1. **Google Maps API (Places API)** — search "electricieni Bacău", parse results
2. **listafirme.ro / termene.ro** — scrape Romanian business directories
3. **Yellow Pages RO** — pagini aurii, telefoane.ro

### Lead Schema:
```sql
leads (
  id uuid,
  company_name text,
  domain text (electricieni/constructori/instalatori),
  city text,
  phone text,
  email text,
  website text,
  source text,
  raw_data jsonb,
  status text default 'new', -- new/enriched/contacted/replied/won/lost
  score integer default 0,
  created_at timestamptz
)
```

### Hermes Lead Research Agent (cron zilnic 09:00):
- Cauta firme noi pe listafirme.ro
- Extrage: nume, telefon, email, oras, cod CAEN
- Deduplica dupa company_name + city
- Insereaza in Supabase leads
- Notifica David: "X lead-uri noi gasite azi"

---

## Phase 3: Outreach System (Day 2)
**Goal:** Email personalizat + follow-up automat

### Email personalization variables:
- {{company_name}} — Firma Ionescu SRL
- {{domain}} — instalații electrice
- {{city}} — Bacău
- {{portfolio_url}} — energoprest.site
- {{case_study}} — "am redus cu 80% timpul de completare rapoarte"

### Templates:
1. **Initial outreach** — prezentare + beneficii + CTA
2. **Follow-up 1 (3 zile)** — reminder soft
3. **Follow-up 2 (7 zile)** — social proof + urgency

### Outreach Schema:
```sql
outreach_campaigns (id, name, template_subject, template_body, status, created_at)
outreach_emails (
  id uuid,
  campaign_id uuid,
  lead_id uuid,
  to_email text,
  subject text,
  body text,
  sent_at timestamptz,
  opened_at timestamptz,  -- via tracking pixel
  replied_at timestamptz,
  status text  -- pending/sent/opened/replied/bounced
)
```

### Resend integration:
- Send via Resend API
- Track opens via 1x1 pixel endpoint (Supabase Edge Function)
- Daily report: opens, replies, bounces

---

## Phase 4: Dashboard MVP (Day 2-3)
**Goal:** Single-pane view of the agency

### KPI Cards (row 1):
- Total Leads | This Week Leads | Emails Sent | Open Rate

### KPI Cards (row 2):
- Active Clients | Pipeline Value | Revenue (luna) | MRR

### Charts:
- Lead funnel (bar chart) — New → Contacted → Replied → Won
- Revenue over time (line chart)
- Email performance (open rate trend)

### Tables:
- Hot leads (replied, high score) — quick actions
- Upcoming follow-ups — leads due for follow-up today
- Active agent runs — live status

---

## Phase 5: AI Agent Orchestration (Day 3+)
**Hermes cron jobs:**

1. `lead-research` — daily 09:00 — scrape + enrich 50 leads
2. `outreach-send` — daily 10:00 — send emails for new leads
3. `follow-up` — daily 11:00 — follow-up leads after 3/7 days
4. `weekly-report` — Monday 08:00 — email David with weekly summary
5. `pipeline-update` — daily 18:00 — update lead scores based on activity

---

## Stack Decision
| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | React 19 + TanStack Router + Tailwind 4 | Same stack as UBT — reuse patterns |
| Backend/DB | Supabase | Already configured, project exists |
| Email | Resend | API key tested, works |
| Deploy | Vercel | Quick deploy, free tier |
| Scraping | Python + requests/BeautifulSoup | Via Hermes terminal |
| Orchestration | Hermes cron jobs | Budget-efficient, persistent |
| Auth | Supabase Auth | Simple, already in stack |

---

## MVP Definition (deliverable azi/maine)
A working dashboard where David can:
1. See all leads in a table
2. See outreach status per lead
3. Trigger a new lead scan
4. See KPIs (leads this week, emails sent, replies)
5. Mark a lead as "client"

Everything else (agent status, analytics depth, LinkedIn) = Phase 2.
