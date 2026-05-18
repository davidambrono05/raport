# PROJECT SNAPSHOT — Starea Tehnică
> Actualizat după fiecare sesiune majoră. Ultima actualizare: 2026-05-13

---

## Cod

### HUMANEX (Principal)
**Path local:** `C:\Users\david\Documents\HUMANEX\human-exchange-main\`  
**Stack:** React 19 · TanStack Start · TypeScript · Tailwind CSS 4 · shadcn/ui · Vite 7

### Universal Business Template (Electrician)
**Path local:** `C:\Users\david\Documents\HUMANEX\universal-business-template\`
**Stack:** React 19 · TanStack Start · TypeScript · Tailwind CSS 4 · shadcn/ui · Vite 7
**Status:** ~80% gata, build trece curat
**Deploy target:** Cloudflare Workers (wrangler.jsonc configurat)

**Structură fișiere create:**
```
universal-business-template/
├── src/
│   ├── routes/
│   │   ├── __root.tsx          # App shell + AuthProvider + Header
│   │   ├── index.tsx            # Redirect /dashboard
│   │   ├── auth.tsx             # Login/Signup
│   │   ├── dashboard.tsx        # Dashboard cu KPI-uri reale
│   │   ├── clients.tsx          # Listă clienți
│   │   ├── clients/$id.tsx      # Detalii client
│   │   ├── jobs.tsx             # Listă lucrări
│   │   ├── jobs/$id.tsx         # Detalii lucrare + status flow
│   │   ├── teams.tsx            # Listă echipe
│   │   ├── invoices.tsx         # Listă facturi
│   │   ├── reports.tsx          # Rapoarte
│   │   ├── api/invoice.ts      # Server function create invoice
│   │   └── api/field-update.ts # Server function field access
│   ├── components/
│   │   ├── Header.tsx           # Navigare + user menu
│   │   ├── CreateClientDialog.tsx
│   │   ├── CreateJobDialog.tsx
│   │   └── ui/ (Button, sonner)
│   ├── lib/
│   │   ├── auth.tsx             # AuthProvider + useAuth + useRequireAuth
│   │   ├── utils.ts             # cn() utility
│   │   └── supabase/
│   │       ├── client.ts        # Browser client (anon key)
│   │       ├── client.server.ts # Server client (service role)
│   │       ├── types.ts        # Database types complete
│   │       └── queries/
│   │           ├── profiles.ts
│   │           ├── workItems.ts
│   │           ├── contacts.ts
│   │           ├── invoices.ts
│   │           └── teams.ts
│   ├── modules/              # UI components (existenți, wire-up cu date)
│   ├── integrations/
│   │   ├── smartbill/index.ts  # ✅ Implementat complet
│   │   ├── whatsapp/index.ts  # ✅ Implementat complet
│   │   └── email/index.ts      # ✅ Implementat complet
│   └── router.tsx            # TanStack Router entry (NECESAR!)
├── package.json                # Dependencies complete
├── vite.config.ts             # TanStack Start + Tailwind + define
├── tsconfig.json              # @/* path alias
├── tsconfig.app.json
├── postcss.config.js          # @tailwindcss/postcss
├── wrangler.jsonc             # Cloudflare Workers
└── .env.example              # Template variabile mediu
```

## Baza de Date
**Provider:** Supabase  
**Project ID:** yhnvzcrdwofqndqxvjjb  
**URL:** https://yhnvzcrdwofqndqxvjjb.supabase.co

### Tabele
| Tabel | Scop |
|-------|------|
| `personalities` | 259 personalități cu preț, categorie, scor |
| `profiles` | Utilizatori cu balanță HMX (10,000 la înregistrare) |
| `holdings` | Pozițiile utilizatorilor |
| `transactions` | Istoricul tranzacțiilor |
| `price_history` | Graficul de preț în timp |
| `news_history` | Știri acumulate pentru scor precis |

### Infrastructură activă
- **pg_cron:** `tick-market-30s` activ (mișcă prețuri la 30s)
- **Realtime:** activ pe `personalities` și `price_history`

---

## Algoritm — Human Reality Score
```
Score = (News 50%) + (Interest 30%) + (Consistency 20%)
Mișcare preț = diferența scor × 0.3%, limitat la ±5%/zi
Update: O DATĂ PE ZI
```
**Surse date:**
- Google News RSS via rss2json.com (fără API key momentan — limitat 10 req/min)
- Wikipedia Pageviews API — pageviews săptămânale
- Sentiment analysis local cu detecție fraze și negații

---

## Blockers Critice (2026-04-28)
| # | Problemă | Impact | Fix |
|---|---------|--------|-----|
| 1 | Buy/sell execută client-side | Oricine poate manipula balanța din DevTools | Server function TanStack Start + supabaseAdmin |
| 2 | Webhook prețuri neautentificat | Oricine poate triggeri update de prețuri | Header `X-Webhook-Secret` |
| 3 | rss2json fără API key | Limitat 10 req/min | Obține key gratuit |

---

## Decizii Majore — NU RE-DISCUTA

| Decizie | Motivul |
|---------|---------|
| Preț se schimbă O DATĂ PE ZI | Refresh-urile multiple acumulau erori, preț crescea artificial |
| Toți pornesc la 500 HMX | Prețuri inițiale arbitrare n-aveau sens — diferențele ies organic |
| Google News RSS (nu NewsAPI plătit) | Fără limită, gratuit |
| Wikipedia pageviews (nu Google Trends) | Google Trends CORS blocat în browser |
| Supabase propriu (nu Lovable) | Control total asupra datelor |
| Sentiment analysis local | Anthropic API nu se poate apela din browser fără cheie expusă |

---

## Ce NU funcționează (încercat și abandonat)
- MCP Supabase în Claude Desktop — token Unauthorized persistent
- Sentiment analysis cu Claude API din browser — cheie expusă
- Google Trends API — CORS blocat
- Prețuri în timp real — acumulare erori la refresh

---

## Deploy
**Target:** Vercel / Cloudflare Workers  
**Status:** wrangler.jsonc configurat, deploy neexecutat  
**Variabile de mediu necesare:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

---

## HUMANEX Agency Site (Creat 2026-05-13)

**Path:** `C:\Users\david\Documents\HUMANEX\humanex-agency\`
**GitHub:** https://github.com/davidambrono05/humanex-agency.git
**Live:** https://humanex.space
**Stack:** React 19 + Vite + TypeScript + Tailwind CSS 4 (@tailwindcss/vite) + EmailJS
**Status:** ✅ LIVE și COMPLET — mobil responsive, domeniu configurat

**Ce face:**
- Landing page agenție AI în română, design navy/masculin
- Secțiuni: Navbar, Hero, Services (6), Case Study Energoprest, How It Works, Pricing (3 planuri), FAQ, CTA Band, Contact Form, Footer
- Formular contact trimite email via EmailJS (service_vgg5fdg, template_asjlv4r)
- EmailJS Key: km3Un_Nuwq0eqaiPP
- Mobile responsive cu media queries în style block

**Prețuri:**
- Starter: 400€/proiect
- Professional: 800€/proiect (highlighted)
- Enterprise: Custom

**Deploy:** Vercel auto-deploy din GitHub main branch

---

## Electrician System — Energoprest (energoprest.site)

**Path formular:** `C:\Users\david\Documents\HUMANEX\sistem final\`
**Live:** energoprest.site (Vercel)
**Edge Function:** Supabase `send-report-email` (hyper-function)
**Status:** ✅ COMPLET — email + WhatsApp automate

**Ce face:**
- Formular mobil pentru șeful de echipă (fără login)
- La submit → insert în Supabase `daily_reports`
- Database Webhook → Edge Function → Email (nodemailer) + WhatsApp (UltraMsg)
- Email: design profesional, toate pozele clickabile, rows of 2
- WhatsApp: același conținut ca emailul, trimis automat pe numărul patronului

**UltraMsg setup:**
- David scanează QR → trimite de pe numărul lui
- Patronul primește pasiv (nu face nimic)
- Secrets în Supabase: WHATSAPP_PHONE, ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN

---

## Electrician Daily Report (Creat 2026-05-05)

**Path:** `C:\Users\david\Documents\HUMANEX\electrician-report\`  
**Stack:** React 19 + Vite 7 + Tailwind CSS 4 + Supabase JS (fără TanStack Start)  
**Status:** ✅ COMPLET — formularul funcționează live (David: "este super")

**Ce face:**
- Pagina publică (fără login) unde șeful de echipă introduce raportul zilnic
- Validare Zod pe client + insert în Supabase `daily_reports`
- Mobile-first, UI SaaS-style, buton mare "Trimite raportul"
- Feedback vizual (success/error)

**Structură:**
```
electrician-report/
├── package.json          ← React, Vite, Tailwind, Supabase, Zod
├── vite.config.ts        ← Tailwind + React plugins
├── tsconfig.json
├── index.html
├── .env / .env.example
└── src/
    ├── main.tsx
    ├── App.tsx           ← FORMULARUL COMPLET
    ├── styles.css
    └── integrations/
        └── supabase/
            └── client.ts
```

**De făcut de David (mâine 2026-05-06):**
1. Push proiectul pe GitHub
2. Import în Vercel
3. Setează Environment Variables în Vercel: `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY`
4. Deploy pe Vercel
5. n8n-ul deja configurat va trimite automat email către patron la ora 18:00

**Notă:** n8n workflow-ul e complet și funcțional — face schedule trigger → HTTP Request Supabase → filtrează ziua curentă → Code Node HTML → Email către patron
