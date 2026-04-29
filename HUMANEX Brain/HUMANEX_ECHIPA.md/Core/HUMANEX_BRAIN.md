# HUMANEX BRAIN 🧠
> Creierul proiectului. Actualizat după fiecare decizie majoră.

---

## Viziunea
**HUMANEX — The Human Stock Exchange**
O bursă a valorilor umane unde utilizatorii investesc HMX coins în personalități publice.
Prețurile se mișcă bazat pe date reale: știri, Wikipedia, sentiment public.
**Transparență totală** — fiecare mișcare de preț are o explicație verificabilă.

## Misiunea
Să facem lumea mai conștientă de impactul real al personalităților publice,
transformând reputația într-un activ tranzacționabil și transparent.

---

## Stack Tehnologic
- **Frontend:** React 19 + TanStack Router/Query, Vite 7, Tailwind CSS 4, shadcn/ui
- **Backend:** Supabase (PostgreSQL + Realtime + Auth + pg_cron)
- **Deploy:** Vercel (planificat)
- **Limbaj:** TypeScript
- **Package manager:** npm/bun

---

## Arhitectura Sistemului

### Baza de Date (Supabase — yhnvzcrdwofqndqxvjjb)
- `personalities` — 259 personalități cu preț, categorie, scor
- `profiles` — utilizatori cu balanță HMX (10,000 la înregistrare)
- `holdings` — pozițiile utilizatorilor
- `transactions` — istoricul tranzacțiilor
- `price_history` — graficul de preț în timp
- `news_history` — știrile acumulate pentru scor mai precis

### Algoritmul — Human Reality Score (0-100)
Calculat din 3 componente:
1. **News Score (50%)** — sentiment știri din Google News RSS
2. **Interest Score (30%)** — Wikipedia pageviews (scală logaritmică)
3. **Consistency Score (20%)** — stabilitatea sentimentului în timp

Prețul se schimbă **o dată pe zi** bazat pe diferența de scor față de ziua anterioară.
Fiecare punct de scor = 0.3% mișcare preț, limitat la ±5%/zi.

### Surse de Date
- **Google News RSS** via rss2json.com — știri în timp real, fără limită
- **Wikipedia API** — pageviews săptămânale gratuit
- **Sentiment Analysis** — algoritm avansat cu detecție fraze și negații

### Sistem de Agenți (Claude Code)
- 48 agenți ECC (Everything Claude Code)
- 11 agenți HUMANEX specializați
- Coordonator principal: `humanex-coordinator`

---

## Decizii Majore Luate

### ✅ Prețul se schimbă O DATĂ PE ZI
**De ce:** Refresh-urile multiple acumulau erori și prețul creștea artificial.
**Soluție:** Daily price update bazat pe scor, localStorage tracking.

### ✅ Migrare de la Lovable Supabase la Supabase propriu
**De ce:** Nu aveam control asupra bazei de date Lovable.
**Soluție:** Cont Supabase propriu (davidambrono05), toate tabelele recreate.

### ✅ Human Reality Score în loc de fluctuații random
**De ce:** Datele false nu reflectau realitatea și nu aveau sens pentru utilizatori.
**Soluție:** Scor calculat din date reale verificabile.

### ✅ Toți încep la 500 HMX
**De ce:** Prețurile inițiale arbitrare nu aveau sens.
**Soluție:** Toți la 500, diferențele apar organic din algoritm.

### ✅ See More button pe market feed
**De ce:** 259 personalități înghesuite pe o pagină era copleșitor.
**Soluție:** 12 vizibile inițial, buton "See X more personalities".

---

## Ce Am Încercat și Nu A Funcționat

### ❌ MCP Supabase în Claude Desktop
**Problema:** Token Unauthorized persistent, npm cache corupt.
**Soluția alternativă:** SQL Editor direct + Claude în Chrome pentru automatizare.

### ❌ Sentiment Analysis cu Claude API din browser
**Problema:** API Anthropic nu se poate apela din browser fără cheie vizibilă.
**Soluția alternativă:** Algoritm avansat local cu detecție fraze și negații.

### ❌ Google Trends API
**Problema:** CORS blocat în browser.
**Soluția alternativă:** Wikipedia pageviews ca indicator de interes public.

### ❌ Prețuri în timp real bazate pe știri
**Problema:** Acumulare la refresh, același articol influența prețul de 100 ori.
**Soluția alternativă:** Sistem zilnic stabil bazat pe Human Reality Score.

---

## Probleme Cunoscute (De Rezolvat)

### 🔴 CRITIC — Buy/Sell se execută client-side
Oricine poate manipula balanța din DevTools.
**Fix:** Server function TanStack Start cu supabaseAdmin.

### 🟡 Webhook prețuri neautentificat
Oricine poate POST și triggerui update de prețuri.
**Fix:** Header check X-Webhook-Secret.

### 🟡 rss2json fără API key
Limitat la 10 req/min pe tier gratuit.
**Fix:** API key gratuit sau direct XML parsing.

---

## Personalități
**Total:** 259 personalități
**Categorii:** Sport, Entertainment, Tech, Politics
**Preț inițial:** 500 HMX toți
**Actualizare preț:** Zilnic bazat pe Human Reality Score

---

## Echipa de Agenți Claude Code
| Agent | Responsabilitate |
|-------|-----------------|
| humanex-coordinator | Coordonare generală, prioritizare |
| humanex-developer | Cod TypeScript/React |
| humanex-algorithm | Human Reality Score, sentiment |
| humanex-designer | UI/UX, Tailwind, mobile |
| humanex-security | RLS, autentificare, vulnerabilități |
| humanex-marketing | Growth, copy, social media |
| humanex-database | SQL, migrații, optimizare |
| humanex-tester | Bug detection, scenarii edge-case |
| humanex-devops | Deploy, Vercel, domeniu |
| humanex-data | Personalități noi, date corecte |
| humanex-product | Roadmap, prioritizare features |

---

## Infrastructură
- **Supabase Project:** yhnvzcrdwofqndqxvjjb
- **URL:** https://yhnvzcrdwofqndqxvjjb.supabase.co
- **pg_cron:** tick-market-30s activ (mișcă prețuri la 30 secunde)
- **Realtime:** activ pe personalities și price_history
- **Deploy:** Vercel (planificat, wrangler.jsonc configurat)
## Legături
- [[HUMANEX_SPRINT]] — task-urile curente
- [[HUMANEX_IDEAS]] — idei viitoare
- [[HUMANEX_ECHIPA]] — echipa și agenții
- [[Sesiuni/2026-04-27]] — prima sesiune