# Checklist Client Nou

## 1. Creare folder client (5 min)
```bash
cp -r client-configs/_template client-configs/TENANT_ID
```

## 2. branding.json
- [ ] `tenantId` — ID unic, fără spații (ex: `electroservice-bacau`)
- [ ] `companyName` — numele firmei
- [ ] `colors.primary` — culoarea principală (hex)
- [ ] `colors.primaryForeground` — alb `#ffffff` sau negru `#0f172a`
- [ ] `contact.phone`, `contact.email`
- [ ] `logoUrl` — adaugă logo în `public/assets/TENANT_ID/logo.png`

## 3. modules.json
- [ ] Dezactivează modulele neutilizate (`false`)
- [ ] `invoicing: true` doar dacă clientul are SmartBill

## 4. workflows.json
- [ ] `workItemLabel` — cum se numesc lucrările (ex: "Programare", "Comandă", "Dosar")
- [ ] Adaugă/elimină statusuri relevante pentru industrie
- [ ] Ajustează câmpurile (`fields`) — păstrează doar ce folosește clientul

## 5. integrations.json
- [ ] SmartBill — `enabled: true` + completează `apiKey`, `email`, `companyVatCode`
- [ ] WhatsApp — `enabled: true` + alege `provider` (twilio/wati) + completează credențialele
- [ ] Email — `enabled: true` + completează `apiKey` Resend + `defaultFrom`

## 6. notifications.json
- [ ] Verifică ce trigger-uri sunt relevante
- [ ] Dezactivează notificările pentru canale neconfigurate
- [ ] Ajustează `frequency` pentru `payment_overdue` (ora de trimitere)

## 7. reports.json
- [ ] `recipientEmails` — emailul adminului clientului
- [ ] Dezactivează rapoartele dacă emailul nu e configurat

## 8. Test final
- [ ] `loadTenantConfig('TENANT_ID')` returnează config corect
- [ ] `pluginRegistry.has('smartbill')` returnează `true` (dacă e activat)
- [ ] Layout se randează cu culorile corecte
- [ ] Notificare de test trimisă cu succes
