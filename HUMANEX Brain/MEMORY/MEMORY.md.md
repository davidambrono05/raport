# CONTEXT CLAUDE 🧠
> Trimite acest fișier la începutul ORICĂREI conversații noi cu Claude.
> Claude va ști instantaneu tot contextul fără să mai explici nimic.

---

## Cine sunt
**Nume:** David Ambrono
**Vârstă:** 18 ani, student universitate Bacău → Brașov (2026)
**Viziune:** Antreprenor care construiește produse digitale cu echipe AI

---

## Proiectul Principal — HUMANEX
**Ce este:** The Human Stock Exchange — bursă a valorilor umane
**Concept:** Utilizatorii investesc HMX coins în personalități publice
**Prețurile** se mișcă bazat pe date reale: știri, Wikipedia, sentiment public
**Status:** Învechit. Supabase există, dar proiectul principal s-a mutat pe **Agenție AI** ca focus principal.

**Stack:** React 19 + TanStack, Supabase, TypeScript, Tailwind CSS 4
**Baza de date:** Supabase (yhnvzcrdwofqndqxvjjb) — proprietate David
**Personalități:** 259 în baza de date, toate la 500 HMX inițial

---

## Proiectul 2 — Sistem Gestiune Firmă Electrician (Universal Business Template)
**Path:** `C:\Users\david\Documents\HUMANEX\universal-business-template\`
**Status:** ~80% gata, build trece curat
**Deploy:** Cloudflare Workers (wrangler.jsonc configurat)

**Flow complet automat:**
```
Create Job → Notify Team (WhatsApp) → Notify Client → Upload Field Photos
→ Mark Complete → Auto-Generate Invoice (SmartBill) → Send Invoice
→ Track Payment → Send Reminders (auto) → Monthly Reports
```

**Module implementate:**
- ✅ Dashboard +  KPI-uri reale
- ✅ Client Management (CRUD + istoric)
- ✅ Job Management (CRUD + status flow)
- ✅ Team Management
- ✅ Payment Tracking
- ✅ Reports
- ✅ Integrări: SmartBill API, WhatsApp (WATI/Twilio), Resend Email

---

## Proiectul 3 — HUMANEX OS (Agency Operating System) ⭐ FOCUS PRINCIPAL
**Path:** `C:\Users\david\Documents\HUMANEX\humanex-os\`
**GitHub:** https://github.com/davidambrono05/humanex-os
**Live:** https://humanex-os.vercel.app/dashboard
**Status:** ✅ LIVE — în continuă dezvoltare activă
**Ultima actualizare:** 2026-05-19

**Ce este:** Dashboard centralizat pentru agenția HUMANEX — toate operațiunile dintr-un singur loc.

**Stack:** React 19 + TanStack Router + Tailwind 4 + Supabase + Resend
**Deploy:** Vercel (auto-deploy din GitHub main)

### Module implementate:
- ✅ **Dashboard** — KPI-uri (leads, emails, replies, MRR, pipeline) + grafice (funnel, revenue, city breakdown)
- ✅ **Leads** — tabel cu filtrare, search, status badge-uri, schimbare status direct
- ✅ **Outreach** — campanii email, template editor, tracking opens/replies
- ✅ **Clients** — CRM (active, paused, completed, churned)
- ✅ **Pipeline** — kanban board (Lead → Contact → Proposal → Negotiation → Client → Delivered)
- ✅ **Agents** — monitor agenți AI în timp real (status, leads găsite, cost)
- ✅ **Analytics** — distribuție status, orașe, domenii, rata conversie

### Date în DB (2026-05-19):
| Tabel | Count |
|-------|-------|
| leads | 1,697 |
| pipeline_items | 6 |
| agent_runs | 6 |
| outreach_campaigns | 0 |
| outreach_emails | 0 |
| clients | 0 |

### Scripturi:
- `scripts/lead_generation.py` — curated leads + Google search enrichment + insert Supabase
- `scripts/mass_scraper.py` — listafirme.ro scraping cu 12 coduri CAEN (național)

### Cron configurate:
| Agent | Schedule | Ce face |
|-------|----------|---------|
| Lead Research Agent | Zilnic 09:00 | Scrape + enrich 50+ leads noi |

### Blocker principal:
- 🔴 Outreach automat (Resend + follow-up) — încă neconfigurat în cron
- 🟡 Enrichment automat (telefon/email din surse externe)
- 🟡 WhatsApp outreach via UltraMsg ($5/lună, instanță oprită momentan)

---

## Echipa AI
**Claude.ai** — eu, strategia și coordonarea
**Claude Code** — execuție cod, 59 agenți instalați
**Obsidian** — memoria permanentă a echipei
**Hermes Agent** — orchestratorul AI (plan, cron, delegate, research)

**Agenți cheie în Claude Code:**
- @humanex-coordinator — coordonare generală
- @humanex-developer — cod TypeScript/React
- @humanex-security — securitate și RLS
- @humanex-algorithm — Human Reality Score
- @humanex-designer — UI/UX mobile
- @humanex-devops — deploy Vercel

---

## Viziunea de Business
**Agenție AI** — sisteme AI pentru afaceri românești (electricieni, constructori, etc.)
**Produsele active:**
1. **humanex-os** (Agency OS) — dashboard centralizat + lead gen + outreach
2. **UBT** — sistem complet pentru firmă de electricieni (client Energoprest)
3. **humanex.space** — landing page agenție AI
4. **energoprest.site** — formular raport zilnic + automatizări

**Nișa principală:** Electricieni + constructori, Bacău + Brașov
**Target:** Venituri recurente până în septembrie 2026 pentru mutarea la Brașov

---

## Cum lucrez
**La liceu** — telefon, Claude.ai, planific și generez idei
**Acasă** — calculator, Claude Code execută task-urile, Hermes orchestrează
**Buget lunar** — ~$20-30 total (Anthropic API + Claude Pro + UltraMsg + tools)

---

## API Keys colectate
| Serviciu | Cheie/Status |
|----------|-------------|
| Supabase | yhnvzcrdwofqndqxvjjb (anon + service_role în `New Text Document.txt`) |
| Resend | re_VV2To3TD_BHWRq7VXq3yY6pEaZ6ozuCXu (funcționează ✅) |
| UltraMsg | 3debygzom0u4i5vy (instance ID, oprită momentan) |
| EmailJS | km3Un_Nuwq0eqaiPP (pentru humanex.space) |
| GitHub | davidambrono05 (autentificat CLI + dashboard) |

---

## Decizii arhitecturale importante
- **Hermes = orchestrator, Claude Code = executor** — buget eficient
- **Vite păstrăm** (nu Next.js) — toate proiectele folosesc Vite
- **Supabase pentru backend** — control total, pg_cron, Realtime
- **Scraping național** — listafirme.ro + Google search, nu doar local
- **UltraMsg pentru WhatsApp** — mai ieftin decât Twilio pentru RO
- **No MCP Supabase** — token problems, folosim REST direct în scripturi Python

---

## Ce am rezolvat recent
- ✅ 1,697 leads în DB (scraping național 12 CAEN codes)
- ✅ humanex-os LIVE pe Vercel (https://humanex-os.vercel.app/dashboard)
- ✅ Toate modulele frontend scrise (Dashboard, Leads, Outreach, Clients, Pipeline, Agents, Analytics)
- ✅ Cron zilnic configurat: Lead Research Agent 09:00
- ✅ Scripturi funcționale: mass_scraper.py + lead_generation.py

## Ce urmează
- 🔴 Outreach automat (Resend + follow-up cron)
- 🔴 UltraMsg reactivează pentru WhatsApp outreach
- 🟡 Enrichment automat lead-uri (telefon/email)
- 🟡 Deploy UBT pe Cloudflare Workers
- 🟢 Primul client platitor până în septembrie 2026

---

## Cum să mă ajuți eficient
1. Fii direct și concis — nu explica prea mult
2. Task-uri complete pentru Claude Code, nu schițe
3. Prioritizează securitatea înainte de features noi
4. Când nu știi ceva — spune-mi direct
5. Gândește ca un CTO pentru un startup de 18 ani

---

## Linkuri importante
- [[HUMANEX_BRAIN]] — contextul tehnic complet
- [[HUMANEX_OS_PLAN]] — planul de implementare HUMANEX OS
- [[HUMANEX_ECHIPA]] — echipa și agenții
- GitHub: https://github.com/davidambrono05/humanex-os
- Vercel: https://humanex-os.vercel.app/dashboard
- Supabase: https://supabase.com/dashboard/project/yhnvzcrdwofqndqxvjjb
