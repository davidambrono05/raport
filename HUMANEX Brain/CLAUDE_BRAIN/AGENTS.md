# AGENTS — Echipa de Agenți

## Cum funcționează sistemul
- Tu (Claude Code) ești **coordonatorul** — primești task-ul de la David, îl distribui
- Fiecare agent are un domeniu clar — nu suprapune responsabilități
- Poți combina agenți pe același task: `@developer` implementează, `@security` face review
- Template prompt → copiază, completează `[...]`, trimite în Claude Code

---

## Agenți Activi

### @humanex-coordinator
**Rol:** Coordonare generală, prioritizare, decizii cross-team  
**Când îl folosești:** Task ambiguu sau care implică mai mulți agenți  
**Prompt template:**
```
@humanex-coordinator [descrie situația și ce trebuie decis/coordonat]
Context: [link la fișiere relevante dacă e cazul]
```

---

### @humanex-developer
**Rol:** Cod TypeScript, React, TanStack Start, componente UI  
**Când îl folosești:** Implementare features, bugfix, refactoring  
**Fișiere principale:** `src/routes/`, `src/components/`, server functions  
**Prompt template:**
```
@humanex-developer Implementează [feature/fix].
Fișier: [path]
Cerințe: [lista exactă]
Nu atinge: [ce să nu modifice]
```

---

### @humanex-security
**Rol:** RLS Supabase, autentificare, vulnerabilități, review cod sensibil  
**Când îl folosești:** Orice atingere buy/sell, auth, date utilizator, webhook-uri  
**Prompt template:**
```
@humanex-security Review securitate pe [fișier/feature].
Verifică: RLS policies, input validation, auth checks, expunere date.
Raportează vulnerabilități și fix-uri concrete.
```

---

### @humanex-algorithm
**Rol:** Human Reality Score, sentiment analysis, calibrare prețuri  
**Când îl folosești:** Probleme cu scorul, calibrare, date incorecte  
**Fișiere principale:** logica de scoring, RSS parsing, Wikipedia integration  
**Prompt template:**
```
@humanex-algorithm [descrie problema cu algoritmul]
Exemplu concret: [personalitate + date observate vs așteptate]
```

---

### @humanex-designer
**Rol:** UI/UX, Tailwind CSS 4, mobile responsive, shadcn/ui  
**Când îl folosești:** Layout broken, mobile issues, redesign componente  
**Breakpoint țintă:** 375px (iPhone SE) și 390px (iPhone 14)  
**Prompt template:**
```
@humanex-designer Repară/redesignează [pagină/componentă] pentru mobile (375px).
Probleme observate: [descrie ce e broken]
Păstrează: [ce trebuie să rămână]
```

---

### @humanex-database
**Rol:** SQL, migrații Supabase, optimizare queries, RLS policies  
**Când îl folosești:** Schema changes, queries lente, migrații  
**Supabase project:** yhnvzcrdwofqndqxvjjb  
**Prompt template:**
```
@humanex-database [descrie problema/task-ul de bază de date]
Tabel afectat: [tabel]
Comportament actual vs așteptat: [...]
```

---

### @humanex-devops
**Rol:** Deploy Vercel, variabile de mediu, domeniu, CI/CD  
**Când îl folosești:** Deploy, configurare producție, probleme de build  
**Prompt template:**
```
@humanex-devops [task deploy/infra]
Starea actuală: [ce există]
Obiectiv: [ce trebuie să rezulte]
```

---

### @humanex-tester
**Rol:** Bug detection, scenarii edge-case, QA înainte de deploy  
**Când îl folosești:** Înainte de orice deploy sau feature major  
**Prompt template:**
```
@humanex-tester Testează [feature/flow].
Happy path: [descrie]
Edge cases de verificat: [lista]
Raportează: ce e broken + severitate.
```

---

### @humanex-data
**Rol:** Adăugare personalități noi, corectare date, categorii  
**Când îl folosești:** Batch insert personalități, date incorecte în DB  
**Prompt template:**
```
@humanex-data Adaugă/corectează [personalități].
Format: nume, categorie, slug Wikipedia.
Verifică dubluri înainte de insert.
```

---

### @humanex-product
**Rol:** Roadmap, prioritizare features, decizii produs  
**Când îl folosești:** Când David propune o idee nouă și vrei feedback structurat  
**Prompt template:**
```
@humanex-product Evaluează feature: [descriere].
Impact vs efort. Prioritate față de sprint curent.
```

---

### @humanex-marketing
**Rol:** Copy, social media content, landing page text  
**Când îl folosești:** Conținut TikTok, Twitter/X, descrieri produs  
**Prompt template:**
```
@humanex-marketing Creează [tip conținut] pentru [platformă].
Tone: direct, intrigant, pentru audiență 16-25 ani.
Angle: [ce aspect al HUMANEX vrei să evidențiezi]
```

---

## Combinații frecvente

| Situație | Agenți |
|---------|--------|
| Feature nou cu implicații de securitate | @developer → @security (review) |
| Bug în algoritm cu impact pe DB | @algorithm + @database |
| Deploy | @tester → @devops |
| Feature UI complex | @developer + @designer |
| Decizie arhitecturală | @coordinator → @developer |
