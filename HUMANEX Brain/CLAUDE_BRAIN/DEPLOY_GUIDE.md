# DEPLOY GUIDE — HUMANEX
> Actualizat: 2026-04-28

## ⚠️ Important: Platform = Cloudflare Workers, nu Vercel
Codul e configurat cu `wrangler.jsonc` → deploy pe **Cloudflare Workers**.
Dacă vrei Vercel, trebuie schimbat adapter-ul — discuție separată.

---

## Pas 1 — Aplică migrația SQL în Supabase

Deschide: https://supabase.com/dashboard/project/yhnvzcrdwofqndqxvjjb/sql/new

Copiază și rulează conținutul fișierului:
```
supabase/migrations/20260428000000_add_news_history_reality_score.sql
```

Ce face:
- Adaugă `last_reality_score` și `score_updated_at` la `personalities`
- Creează tabela `news_history` cu index UNIQUE pe `url`
- Setează RLS policies

---

## Pas 2 — Găsește cheile necesare

Din Supabase Dashboard → Project Settings → API:
- `SUPABASE_SERVICE_ROLE_KEY` (secret, nu anon key!)

Din `.env` (deja există):
- `SUPABASE_URL` = https://yhnvzcrdwofqndqxvjjb.supabase.co

Generează un secret pentru webhook:
```bash
# Rulează în terminal pentru un secret random
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Pas 3 — Autentifică Wrangler și setează secretele

```bash
# Autentificare (se deschide browser)
npx wrangler login

# Setează secretele (te va întreba valoarea)
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put YOUTUBE_API_KEY
npx wrangler secret put WEBHOOK_SECRET
```

---

## Pas 4 — Deploy

```bash
cd "C:\Users\david\Documents\HUMANEX\human-exchange-main"
npm run build
npx wrangler deploy
```

---

## Pas 5 — Verifică după deploy

1. Deschide URL-ul primit de la Wrangler
2. Testează: înregistrare cont nou → primbești 10,000 HMX
3. Testează: buy 1 share dintr-o personalitate
4. Testează: sell 1 share
5. Verifică că webhook-ul merge: POST cu header `X-Webhook-Secret`

---

## Variabile de mediu necesare (rezumat)

| Variabilă | Unde | Obligatoriu |
|-----------|------|-------------|
| `SUPABASE_URL` | Wrangler secret | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Wrangler secret | ✅ (pentru trade + webhook) |
| `YOUTUBE_API_KEY` | Wrangler secret | ✅ (pentru update-prices) |
| `WEBHOOK_SECRET` | Wrangler secret | ✅ (securitate webhook) |
| `VITE_SUPABASE_URL` | .env (build time) | ✅ |
| `VITE_SUPABASE_ANON_KEY` | .env (build time) | ✅ |
