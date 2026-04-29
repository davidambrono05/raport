# Sistem Gestiune Electrician

Sistem complet de gestiune pentru firmă de instalații electrice cu 8 module integrate.

## 🚀 Module

1. **Dashboard Principal** - KPI-uri, alerte, calendar
2. **Gestiunea Lucrărilor** - Status: NOU → ÎN PROGRES → FACTURAT → ÎNCASAT
3. **Gestiunea Clienților** - CRM simplu
4. **Facturare Automată** - SmartBill API integration
5. **Urmărire Plăți** - Reminder-e automate (7, 14, 30 zile)
6. **Gestiunea Echipelor** - Alocare lucrări, raport productivitate
7. **Rapoarte** - Lunar automat pe email + export Excel/PDF
8. **Notificări Automate** - WhatsApp + Email

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TanStack Router
- **Backend**: Supabase (PostgreSQL + Realtime)
- **AI**: NVIDIA API (Claude models)
- **Integrări**: SmartBill API, WhatsApp Business API, Email Service
- **Hosting**: Cloudflare Workers

## 📦 Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your API keys in .env
# - NVIDIA_API_KEY
# - SMARTBILL_API_KEY
# - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Start development server
npm run dev
```

## 🔑 API Keys Required

- **NVIDIA API Key** - Pentru funcționalitățile AI
- **SmartBill API** - Pentru facturare automată
- **Supabase** - Pentru baza de date și autentificare
- **WhatsApp Business API** - Pentru notificări WhatsApp (opțional)
- **Email Service** - Pentru notificări email

## 📊 Prețuri

- **Standard**: €2.500 setup + €200/lună
- **Premium**: €3.500 setup + €300/lună (+ app mobilă + rapoarte avansate)

## 🎯 Status Proiect

- [x] Plan detaliat creat
- [x] Client are SmartBill activ
- [ ] Semnare contract
- [ ] Implementare module
- [ ] Testing
- [ ] Deploy în producție

## 📝 Documentație

Vezi `PLAN_CLIENT_ELECTRICIAN.md` pentru planul detaliat de implementare.