import { useState } from 'react';
import type { Payment, PaymentStatus, PaymentSummaryData } from './types';

interface PaymentListProps {
  payments: Payment[];
  summary: PaymentSummaryData;
  onMarkPaid?: (payment: Payment) => void;
  onSendReminder?: (payment: Payment) => void;
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Plătit',
  pending: 'În așteptare',
  overdue: 'Restant',
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: '#16a34a',
  pending: '#d97706',
  overdue: 'var(--color-destructive)',
};

export function PaymentList({ payments, summary, onMarkPaid, onSendReminder }: PaymentListProps) {
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');

  const filtered = filter === 'all' ? payments : payments.filter((p) => p.status === filter);

  return (
    <div className="p-6 space-y-6">
      <PaymentSummary summary={summary} />

      <div className="flex gap-2">
        {(['all', 'overdue', 'pending', 'paid'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: filter === s ? 'var(--color-primary)' : 'var(--color-muted)',
              color: filter === s ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
            }}
          >
            {s === 'all' ? 'Toate' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((payment) => (
          <div
            key={payment.id}
            className="rounded-lg border p-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {payment.invoiceNumber}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      color: STATUS_COLORS[payment.status],
                      backgroundColor: `${STATUS_COLORS[payment.status]}18`,
                    }}
                  >
                    {STATUS_LABELS[payment.status]}
                  </span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                  {payment.clientName} · Scadență: {payment.dueDate.toLocaleDateString('ro-RO')}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  {payment.amount.toFixed(2)} RON
                </p>
                {payment.status !== 'paid' && (
                  <div className="flex gap-2">
                    {onSendReminder && (
                      <button
                        onClick={() => onSendReminder(payment)}
                        className="text-xs px-2 py-1 rounded border"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                      >
                        Reminder
                      </button>
                    )}
                    {onMarkPaid && (
                      <button
                        onClick={() => onMarkPaid(payment)}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-foreground)',
                        }}
                      >
                        Marchează plătit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
            Nicio plată în această categorie.
          </p>
        )}
      </div>
    </div>
  );
}

function PaymentSummary({ summary }: { summary: PaymentSummaryData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total facturat', value: summary.totalInvoiced },
        { label: 'Încasat', value: summary.totalPaid, color: '#16a34a' },
        { label: 'Restant', value: summary.totalOverdue, color: 'var(--color-destructive)' },
        { label: 'Facturi restante', value: summary.overdueCount, unit: 'buc' },
      ].map((item, i) => (
        <div
          key={i}
          className="rounded-lg border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {item.label}
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: item.color ?? 'var(--color-foreground)' }}
          >
            {typeof item.value === 'number' && !item.unit
              ? `${item.value.toFixed(2)} RON`
              : `${item.value} ${item.unit ?? ''}`}
          </p>
        </div>
      ))}
    </div>
  );
}
