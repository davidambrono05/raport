# PLAN COMPLET — Sistem Gestiune Firmă Instalații Electrice
> Document creat pentru primul client al agenției AI
> Data: 27 Aprilie 2026

---

## 1. VIZIUNEA SISTEMULUI

Un sistem web complet accesibil de pe orice device care automatizează
integral procesele administrative ale firmei de instalații electrice.

**Înainte:** Lucrări în caiet/Excel, facturi manuale în SmartBill, 
telefoane pentru status, urmărire plăți manuală.

**După:** Totul automat — de la înregistrarea lucrării până la 
încasarea banilor, fără intervenție manuală.

---

## 2. MODULELE SISTEMULUI

### MODUL 1 — Dashboard Principal
**Ce vede el când se loghează:**

```
┌─────────────────────────────────────────┐
│  FIRMA SA — Dashboard                   │
├─────────────────────────────────────────┤
│  📊 LUNA ACEASTA                        │
│  Lucrări active: 8                      │
│  Lucrări finalizate: 12                 │
│  Venituri: 23,400 RON                   │
│  Neîncasat: 4,200 RON                   │
├─────────────────────────────────────────┤
│  ⚠️ URGENT                              │
│  • Client Ionescu — restanță 30 zile    │
│  • Lucrare Rozelor — finalizare mâine   │
├─────────────────────────────────────────┤
│  📅 AZI                                 │
│  • Echipa 1 — Str. Mihai Viteazu        │
│  • Echipa 2 — Bloc A4, Sc. 2            │
└─────────────────────────────────────────┘
```

---

### MODUL 2 — Gestiunea Lucrărilor

**2.1 Adăugare lucrare nouă:**
- Numele clientului (din lista existentă sau client nou)
- Adresa lucrării
- Tipul lucrării (instalație nouă, revizie, urgență)
- Descrierea lucrării
- Echipa alocată
- Data estimată începere
- Data estimată finalizare
- Valoarea estimată

**2.2 Status-uri lucrare:**
```
NOU → ÎN AȘTEPTARE → ÎN PROGRES → FINALIZAT → FACTURAT → ÎNCASAT
```

**2.3 Actualizare status din teren:**
- Șeful de echipă primește link unic pe WhatsApp
- Dă click și marchează: "Am început" / "Am terminat"
- Poate adăuga fotografii din teren
- Nu are nevoie de cont sau aplicație

**2.4 Istoricul lucrărilor:**
- Toate lucrările filtrate după: client, echipă, perioadă, status
- Export Excel pentru contabilitate

---

### MODUL 3 — Gestiunea Clienților

**Ce informații stochează:**
- Nume complet / Firma + CUI
- Adresă
- Telefon + Email
- Istoricul tuturor lucrărilor
- Total facturat și total încasat
- Note interne

**Funcționalități:**
- Căutare rapidă după nume/telefon
- Vedere 360° — toate lucrările unui client
- Alertă clienți cu restanțe

---

### MODUL 4 — Facturare Automată (SmartBill)

**Cum funcționează:**

```
Lucrare marcată FINALIZAT
         ↓
Sistemul generează automat factura în SmartBill
         ↓
Factura trimisă pe email către client
         ↓
WhatsApp trimis clientului cu link factură și suma
         ↓
Lucrarea trece în status FACTURAT
```

**Ce generează automat:**
- Numărul facturii (serie continuă)
- Data facturii
- Datele clientului (CUI, adresă)
- Descrierea lucrării
- Suma + TVA
- Termen de plată (ex: 15 zile)

**Integrare SmartBill API:**
- Facturile apar și în SmartBill ca de obicei
- Contabilul lui lucrează în continuare cu SmartBill normal
- Zero schimbări pentru contabil

---

### MODUL 5 — Urmărire Plăți

**Automatizare completă:**

```
Factură emisă
    ↓
Ziua 7 — WhatsApp automat: "Bună ziua, vă reamintim factura X"
    ↓
Ziua 14 — Email automat: "Factură scadentă — vă rugăm să achitați"
    ↓
Ziua 30 — Alertă urgentă pentru patron: "CLIENT RESTANȚIER"
```

**Dashboard plăți:**
- Verde: Achitat
- Galben: În termen
- Portocaliu: Aproape de scadență
- Roșu: Restant

**Înregistrare plată:**
- El marchează manual când primește banii (cash sau transfer)
- Sau integrare viitoare cu extrasul bancar

---

### MODUL 6 — Gestiunea Echipelor

**Ce poate face:**
- Creare echipe (Echipa 1, Echipa 2, etc.)
- Adăugare membri per echipă
- Alocare lucrări per echipă
- Vizualizare program zilnic per echipă

**Raport per echipă:**
- Câte lucrări a finalizat luna asta
- Valoarea totală a lucrărilor
- Productivitate comparativă

---

### MODUL 7 — Rapoarte și Statistici

**Raport lunar automat (trimis pe email în prima zi a lunii):**
```
RAPORT LUNA MARTIE 2026
━━━━━━━━━━━━━━━━━━━━━━━
Lucrări finalizate: 24
Venituri totale: 45,200 RON
Încasat: 38,700 RON
Neîncasat: 6,500 RON

TOP CLIENȚI:
1. Ionescu SRL — 12,400 RON
2. Popescu Ana — 8,200 RON
3. Construct SA — 6,800 RON

PERFORMANȚĂ ECHIPE:
Echipa 1: 14 lucrări / 28,400 RON
Echipa 2: 10 lucrări / 16,800 RON
━━━━━━━━━━━━━━━━━━━━━━━
```

**Rapoarte disponibile oricând:**
- Venituri per perioadă
- Lucrări per client
- Lucrări per echipă
- Restanțieri
- Export Excel/PDF

---

### MODUL 8 — Notificări Automate

**Către clienți:**
- ✅ "Lucrarea dumneavoastră a început"
- ✅ "Lucrarea a fost finalizată"
- ✅ "Factura a fost emisă — X RON"
- ✅ "Reminder plată"

**Către patron:**
- ✅ "Lucrare nouă adăugată"
- ✅ "Echipa a finalizat lucrarea X"
- ✅ "Client nou cu restanță"
- ✅ "Raport lunar disponibil"

**Canale:**
- WhatsApp Business API
- Email
- Notificări în aplicație

---

## 3. STRUCTURA BAZEI DE DATE

```
TABELE PRINCIPALE:
├── clienti (id, nume, cui, telefon, email, adresa)
├── lucrari (id, client_id, echipa_id, status, descriere, valoare, date)
├── echipe (id, nume, membri)
├── facturi (id, lucrare_id, numar, suma, status_plata, data_scadenta)
├── plati (id, factura_id, suma, data, metoda)
├── notificari (id, tip, destinatar, mesaj, trimis_la)
└── utilizatori (id, nume, rol, email, parola)
```

---

## 4. TEHNOLOGIA FOLOSITĂ

| Componentă | Tehnologie | Cost |
|------------|-----------|------|
| Frontend | React + Tailwind | Gratuit |
| Backend/DB | Supabase | Gratuit |
| Deploy | Vercel | Gratuit |
| Facturare | SmartBill API | Al lui |
| WhatsApp | WhatsApp Business API | ~5€/lună |
| Email | Resend | Gratuit |
| Domeniu | .ro custom | ~30 RON/an |

**Cost lunar infrastructură: ~5-10€**
**Tu încasezi: 200€/lună**

---

## 5. TIMELINE IMPLEMENTARE

| Zi | Task |
|----|------|
| 1 | Setup Supabase, structura DB, autentificare |
| 2-3 | Dashboard principal + gestiune lucrări |
| 4-5 | Gestiune clienți + echipe |
| 6-7 | Integrare SmartBill API — facturare automată |
| 8 | Notificări WhatsApp + Email |
| 9 | Urmărire plăți + reminder-e automate |
| 10 | Rapoarte + export |
| 11-12 | Testare completă cu date reale |
| 13 | Training cu clientul |
| 14 | Go live + suport primele 48 ore |

**Total: 2 săptămâni**

---

## 6. PROPUNEREA FINANCIARĂ

### Varianta Standard
- **Setup:** 2,500€ (50% avans, 50% la livrare)
- **Mentenanță lunară:** 200€/lună
- **Include:** Hosting, updates, suport tehnic, backup zilnic

### Varianta Premium
- **Setup:** 3,500€
- **Mentenanță lunară:** 300€/lună
- **Include:** Tot din Standard + app mobilă simplă + rapoarte avansate

### Ce economisește el:
- Față de oferta de 40,000€ — economisește 36,500€
- Timp economisit: ~15-20 ore/lună
- Erori de facturare: eliminate complet
- Plăți restante: reduse cu ~60% prin reminder-e automate

---

## 7. GARANȚII OFERITE

- ✅ 30 zile money-back dacă nu e mulțumit
- ✅ Uptime 99.9% (Vercel + Supabase)
- ✅ Backup zilnic al datelor
- ✅ Suport WhatsApp în 24 ore
- ✅ Update-uri incluse în mentenanță

---

## 8. CE AI NEVOIE DE LA CLIENT

**La prima întâlnire:**
- [ ] API Key SmartBill
- [ ] Seria de facturi folosită
- [ ] Logo firma (PNG/SVG)
- [ ] Culorile firmei
- [ ] Lista echipelor și membri
- [ ] Export clienți din SmartBill

**Informații firmă:**
- [ ] Nume complet firmă
- [ ] CUI
- [ ] Adresa sediului
- [ ] Email oficial
- [ ] Telefon
- [ ] Plătitor TVA da/nu

**Preferințe:**
- [ ] Notificări WhatsApp sau Email pentru clienți
- [ ] Câte lucrări are în medie/lună
- [ ] Câte echipe și câți oameni

---

## 9. SCRIPT PREZENTARE (CE ÎI SPUI)

> "Practic sistemul funcționează simplu. Tu adaugi lucrarea la început — 
> clientul, adresa, echipa. Din acel moment sistemul se ocupă de tot.
> 
> Când echipa ta termină lucrarea, dă un click pe telefon și sistemul 
> generează automat factura în SmartBill și o trimite clientului.
> 
> Dacă clientul nu plătește, sistemul îi trimite reminder automat la 
> 7 zile și 14 zile. Tu primești alertă dacă depășește 30 de zile.
> 
> În prima zi a fiecărei luni primești pe email raportul complet — 
> cât ai facturat, cât ai încasat, cine are restanțe.
> 
> Tu nu mai faci nimic manual. Te concentrezi pe lucrări, 
> sistemul se ocupă de birocrație."

---

**Creat de:** David Ambrono + Claude
**Data:** 27 Aprilie 2026
**Versiune:** 1.0
