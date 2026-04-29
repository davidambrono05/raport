# Onboarding Client Nou — Pas cu Pas

## Întâlnire inițială (30 min)

Întrebări obligatorii:
1. Cum se numesc „obiectele" principale din business? (lucrări, programări, comenzi, dosare)
2. Care sunt statusurile prin care trece un obiect de la creare la finalizare?
3. Ce câmpuri specifice are fiecare obiect? (ex: adresă obiectiv, tip instalație)
4. Cum comunică cu clienții? (WhatsApp, email, telefon)
5. Folosesc SmartBill sau altă soluție de facturare?
6. Cine primește rapoartele și cât de des?

## Configurare (2 ore)

```
1. cp -r client-configs/_template client-configs/TENANT_ID
2. Completează branding.json   (culori de pe site/logo existente)
3. Completează workflows.json  (răspunsurile de la întâlnire)
4. Completează integrations.json (API keys de la client)
5. Ajustează notifications.json și reports.json
6. Test complet cu date reale
```

## Livrare

- [ ] Demo live în fața clientului
- [ ] Cont admin creat în Supabase
- [ ] Domeniu configurat (ex: app.electroservice.ro)
- [ ] Primul angajat adăugat în sistem
- [ ] Primul client adăugat în CRM
- [ ] Notificare de test trimisă

## Mentenanță lunară

- Verifică dacă rapoartele automate se trimit
- Verifică dacă notificările funcționează
- Update credențiale expirate (WhatsApp, SmartBill)
- Backup Supabase (automat, dar verifică)

## Prețuri orientative

| Serviciu       | Setup    | Lunar    |
|---------------|----------|----------|
| Sistem de bază | €1.500  | €150     |
| + SmartBill    | +€200   | +€30     |
| + WhatsApp     | +€200   | +€50     |
| + Rapoarte PDF | +€150   | inclus   |
| Cost infra     | —        | €5–15    |
