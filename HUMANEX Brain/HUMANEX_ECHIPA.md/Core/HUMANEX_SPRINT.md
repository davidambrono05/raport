# HUMANEX SPRINT 🏃
> Ce facem săptămâna asta. Actualizat în fiecare duminică seara.

---

## Sprint Curent — Săptămâna 1 (Apr 26 - Mai 2, 2026)
**Obiectiv:** Securitate + Stabilitate — pregătire pentru launch

---

## 🔴 BLOCKER — Trebuie rezolvat înainte de orice altceva

### 1. Buy/Sell Server-Side
**Status:** În progres (Claude Code a început)
**Agent:** humanex-developer + humanex-security
**Task Claude Code:**
```
@humanex-developer Implementează complet server function-ul pentru buy/sell.
Mută toată logica din p.$slug.tsx client-side pe un TanStack Start server function.
Folosește supabaseAdmin (service role). Validează cu Zod.
@humanex-security face review după implementare.
```

### 2. Webhook Secret
**Status:** Neînceput
**Agent:** humanex-security
**Task Claude Code:**
```
@humanex-security Adaugă autentificare pe webhook-ul de prețuri din update-prices.ts.
Header check: X-Webhook-Secret. Dacă nu match — return 401.
```

---

## 🟡 IMPORTANT — Săptămâna asta

### 3. Mobile Responsive
**Status:** Neverificat
**Agent:** humanex-designer
**Task Claude Code:**
```
@humanex-designer Verifică și repară toate paginile pe mobile (375px).
Market feed, pagina de profil, portfolio, leaderboard.
```

### 4. Algoritm Calibrat
**Status:** Parțial
**Agent:** humanex-algorithm
**Task Claude Code:**
```
@humanex-algorithm Calibrează Human Reality Score pentru personalități cu views mici.
Neymar are 108 views/săptămână și primește scor incorect.
Verifică că sentiment analysis detectează corect contextul știrilor.
```

### 5. Deploy Vercel
**Status:** Neînceput
**Agent:** humanex-devops
**Task Claude Code:**
```
@humanex-devops Pregătește și execută deploy-ul pe Vercel.
Setează variabilele de mediu, domeniu custom, SSL.
```

---

## 🟢 DONE — Completat

- ✅ Platformă funcțională local
- ✅ 259 personalități în baza de date
- ✅ Human Reality Score implementat
- ✅ Sistem preț zilnic bazat pe scor
- ✅ Google News RSS integrat
- ✅ Wikipedia Intelligence
- ✅ See More button pe market feed
- ✅ Baza de date proprie Supabase
- ✅ pg_cron activ (30 secunde)
- ✅ 59 agenți Claude Code instalați
- ✅ CLAUDE.md creat

---

## Blocat / Probleme

| Problemă | Cauza | Soluție |
|----------|-------|---------|
| rss2json limitat | Fără API key | Obține key gratuit pe rss2json.com |
| Claude Code usage limit | Plan Pro | Sesiuni concentrate, task-uri mari |

---

## Sprint Următor — Săptămâna 2 (Mai 3-9)
- 500+ personalități
- Landing page pentru launch
- Marketing content (10 postări TikTok, 5 threads Twitter)
- Performance optimization
- Grafice de preț îmbunătățite

---

## Metrici de Succes Sprint 1
- [ ] Buy/sell securizat server-side
- [ ] Zero vulnerabilități critice
- [ ] Deploy live pe Vercel
- [ ] Mobile responsive 100%
- [ ] Algoritm calibrat corect
## Legături
- [[HUMANEX_BRAIN]] — contextul complet
- [[HUMANEX_ECHIPA]] — echipa