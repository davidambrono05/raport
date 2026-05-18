# AI Agency Architecture — HUMANEX

> Arhitectura oficială a agenției AI-first HUMANEX. Actualizată: 2026-05-18.

---

## Stack-ul Agenției

```
┌─────────────────────────────────────────────────────────┐
│                    STRATEGY (David)                     │
│  Viziune | Relații Clienți | Prețuri | Content          │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              ORCHESTRATION (Hermes Agent)                │
│  delegate_task | cronjob | skills | memory | research   │
│  Model: DeepSeek v4 Flash via Nous (gratis)             │
└────────────────────────┬────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
┌──────────┐     ┌──────────┐     ┌─────────────────┐
│ CLAUDE  │     │ TERMINAL│     │ CRON + WEB      │
│ CODE    │     │ + PYTHON│     │ scrape, deploy   │
│ (cod)   │     │ (scripts)│   │ notify           │
└──────────┘     └──────────┘     └─────────────────┘
```

## Componente Active

| Component | Tehnologie | Status |
|-----------|-----------|--------|
| Metacogniție | Hermes Agent (Nous + DeepSeek v4 Flash) | ✅ Activ |
| Dezvoltare cod | Claude Code v2.1.139 (Windows npm) | ✅ Activ |
| Bază de date | Supabase (yhnvzcrdwofqndqxvjjb) | ✅ Activ |
| Landing agenție | humanex.space (React + Vite + Vercel) | ✅ LIVE |
| Raport electrician | energoprest.site (React + Supabase) | ✅ LIVE |
| Human Exchange | human-exchange-main (TanStack + Supabase) | ⚡ 80% |
| Template business | universal-business-template (TanStack + Supabase) | ⚡ 80% |

## Arhitectura unui Produs (Template)

Fiecare produs livrat de HUMANEX urmează acest pattern:

### Frontend
- React 19 + TanStack Start (sau Vite pentru simpler)
- TypeScript strict
- Tailwind CSS 4 + shadcn/ui
- Mobile-first (breakpoint 375px)
- Deploy: Vercel (standard) sau Cloudflare Workers

### Backend
- Supabase (PostgreSQL + Realtime + Edge Functions)
- TanStack Start server functions (SSR)
- Auth: Supabase Auth
- Webhooks: Database webhooks → Edge Functions

### Integrări Standard
- **Plăți facturi** → SmartBill API
- **Notificări** → WhatsApp (UltraMsg / WATI)
- **Email** → Resend / EmailJS
- **CRM** → Supabase tables
- **Rapoarte** → Cron + Email automat

### Prețuri Agenție
- **Starter** — 400€/proiect: sistem simplu (formular + raportare)
- **Professional** — 800€/proiect: sistem complet (flow end-to-end + integrări)
- **Enterprise** — Custom: sisteme multi-agent, loyalty, dashboards

---

## Fluxul de Lucru (Orchestration)

```
David spune ce vrea
        ↓
Hermes (eu) analizez:
  - e cod? → deleg la Claude Code
  - e research? → web_search + skills
  - e infra? → terminal direct
  - e arhitectură? → planning + documentare
        ↓
Execuție → Verificare → Documentare → Memory
```

**Reguli:**
- Nu re-discut decizii trecute (vezi PROJECT_SNAPSHOT)
- Securitatea înaintea feature-urilor noi
- Task-uri complete, nu schițe
- Buget $20-30/lună — fiecare sesiune contează

---

## Product Roadmap

### Q2 2026 (Mai-Iunie)
- [ ] Deploy HUMANEX (human exchange) — live
- [ ] Deploy universal-business-template — live cu un client real
- [ ] LeadGen system — primul produs de vânzare
- [ ] GitHub organization HUMANEX configurată
- [ ] Obsidian vault — toată arhitectura documentată

### Q3 2026 (Iulie-Septembrie)
- [ ] Shopify connector (skill reutilizabil)
- [ ] Multi-agent workflows (n8n sau orchestrator)
- [ ] Client dashboard — fiecare client vede statusul sistemului
- [ ] Automatizare lead nurturing
- [ ] Loyalty system (puncte + recompense)
- [ ] 3-5 clienți activi

### Q4 2026 (Octombrie-Decembrie)
- [ ] AI workflows SaaS — abonament lunar
- [ ] Agent marketplace (template-uri pre-build)
- [ ] Scalare: de la $800/proiect la $1600/proiect
- [ ] Documentare + tutoriale pentru clienți
