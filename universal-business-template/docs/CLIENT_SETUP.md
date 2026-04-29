# Ghid Setup Client

## Arhitectura unui client

```
client-configs/
└── TENANT_ID/
    ├── branding.json       ← identitate vizuală
    ├── modules.json        ← ce module sunt active
    ├── workflows.json      ← statusuri + câmpuri per industrie
    ├── integrations.json   ← API keys SmartBill / WhatsApp / Email
    ├── notifications.json  ← reguli de notificare
    └── reports.json        ← rapoarte automate
```

## Inițializare în aplicație

```tsx
// main.tsx sau root route
import { loadTenantConfig } from './src/lib/config/loader';
import { loadPlugins } from './src/lib/plugins/loader';
import { applyBrandingTheme } from './src/lib/branding/theme';

const TENANT_ID = import.meta.env.VITE_TENANT_ID;

const config = await loadTenantConfig(TENANT_ID);
applyBrandingTheme(config.branding);
await loadPlugins(TENANT_ID);
```

## Randare layout

```tsx
import { Layout } from './src/components/branded/Layout';

<Layout tenantId={TENANT_ID} navItems={navItems}>
  <Dashboard data={dashboardData} />
</Layout>
```

## Accesare config în componente

```tsx
import { loadTenantConfig } from './src/lib/config/loader';

const config = await loadTenantConfig(TENANT_ID);

// Module active
if (config.modules.invoicing) { /* arată facturare */ }

// Label dinamic per industrie
const label = config.workflow.workItemLabel; // "Lucrare", "Programare" etc.

// Statusuri configurate
const statuses = config.workflow.statuses;
```

## Trimitere notificare

```tsx
import { dispatch } from './src/lib/notifications/dispatcher';

await dispatch({
  templateId: 'work_item_completed',
  channel: 'whatsapp',
  recipient: { phone: '+40723000000', name: 'Ion Popescu' },
  variables: {
    client_name: 'Ion Popescu',
    work_item_title: 'Instalație tablou electric',
  },
});
```

## Generare + export raport

```tsx
import { generateSummaryReport } from './src/lib/reports/generator';
import { exportToExcel, downloadExcel } from './src/lib/reports/exporters/excel';

const report = generateSummaryReport({
  title: 'Raport Octombrie 2026',
  period: { from: new Date('2026-10-01'), to: new Date('2026-10-31') },
  workItemStats: { total: 42, completed: 38, inProgress: 4, pending: 0, totalRevenue: 15800 },
  clientStats: [...],
  teamStats: [...],
});

const blob = await exportToExcel(report);
downloadExcel(blob, 'raport-octombrie-2026');
```

## Industriile suportate (exemple workflows)

| Industrie      | workItemLabel | Statusuri cheie                          |
|---------------|---------------|------------------------------------------|
| Electrician   | Lucrare       | Nou → Programat → În execuție → Finalizat |
| Medical       | Programare    | Nou → Confirmat → Realizat → Anulat      |
| Imobiliare    | Dosar         | Nou → În negociere → Semnat → Închis     |
| Transport     | Comandă       | Nou → Ridicat → În tranzit → Livrat      |
| Salon         | Programare    | Nou → Confirmat → Realizat → Anulat      |
