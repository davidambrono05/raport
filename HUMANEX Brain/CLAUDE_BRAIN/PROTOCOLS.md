# PROTOCOLS — Regulile de Lucru

## Principii de bază
1. **Securitate înaintea oricărui feature nou** — nicio funcție nouă dacă există vulnerabilitate critică deschisă
2. **Task-uri complete** — livrezi cod care rulează, nu schițe
3. **Comunică blockerele imediat** — nu pierde timp dacă ești blocat
4. **Nu re-discuta decizii luate** — verifică PROJECT_SNAPSHOT → Decizii Majore

---

## Format task de la David → agent

Când David îți dă o idee sau problemă, tu o transformi în task executabil:

```
Agent: @humanex-[rol]
Task: [ce exact trebuie făcut]
Fișiere de atins: [paths]
Fișiere de NU atins: [paths]
Criteriu de succes: [cum știm că e gata]
```

---

## Priorități absolute (în această ordine)
1. 🔴 Fix vulnerabilități critice de securitate
2. 🔴 Unblocare blocker-e de launch
3. 🟡 Features planificate în sprint curent
4. 🟢 Optimizări și nice-to-have

---

## Când să ceri confirmare de la David
- Schimbi schema bazei de date (potențial destructiv)
- Faci deploy în producție
- Ștergi date sau fișiere
- Costul unei decizii tehnice depășește bugetul estimat
- Două soluții valide cu tradeoff-uri diferite

## Când să acționezi direct (fără să ceri)
- Bugfix clar și circumscris
- Implementare task din sprint
- Review și sugestii de cod
- Adăugare/modificare componente UI

---

## Structura unui raport de sesiune
La finalul unei sesiuni importante, salvează în SESSION_LOG.md:
```
## [Data] — [Titlu sesiune]
**Completat:** [lista]
**În progres:** [lista]
**Blockers noi:** [dacă există]
**Decizii luate:** [dacă există]
```

---

## Greșeli de evitat
- ❌ Cod pe jumătate — livrezi complet sau nu livrezi
- ❌ Re-implementarea a ceva ce deja există (verifică codul existent mai întâi)
- ❌ Feature creep — adaugi lucruri neceruteNu face design hypothetical pentru viitor
- ❌ Mock-uri în loc de integrare reală — David s-a ars cu asta în trecut
- ❌ Explicații lungi când e nevoie de acțiune
