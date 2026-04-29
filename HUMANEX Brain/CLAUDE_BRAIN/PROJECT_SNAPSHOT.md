# PROJECT SNAPSHOT — Starea Tehnică
> Actualizat după fiecare sesiune majoră. Ultima actualizare: 2026-04-28

---

## Cod
**Path local:** `C:\Users\david\Documents\HUMANEX\human-exchange-main\`  
**Stack:** React 19 · TanStack Start · TypeScript · Tailwind CSS 4 · shadcn/ui · Vite 7

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
**Target:** Vercel  
**Status:** wrangler.jsonc configurat, deploy neexecutat  
**Variabile de mediu necesare:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
