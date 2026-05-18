import { useState } from 'react';
import type { Client, ClientFilters } from './types';

interface ClientListProps {
  clients: Client[];
  onSelect?: (client: Client) => void;
  onAdd?: () => void;
}

export function ClientList({ clients, onSelect, onAdd }: ClientListProps) {
  const [filters, setFilters] = useState<ClientFilters>({ search: '' });

  const filtered = clients.filter((c) => {
    const q = filters.search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Caută client..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-foreground)',
          }}
        />
        {onAdd && (
          <button
            onClick={onAdd}
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            + Client nou
          </button>
        )}
      </div>

      <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        {filtered.length} client{filtered.length !== 1 ? 'i' : ''}
      </p>

      <div className="space-y-2">
        {filtered.map((client) => (
          <ClientRow key={client.id} client={client} onClick={() => onSelect?.(client)} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
            Niciun client găsit.
          </p>
        )}
      </div>
    </div>
  );
}

function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border p-4 transition-colors hover:opacity-80"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
            {client.name}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            {[client.phone, client.email].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          {client.totalWorkItems !== undefined && (
            <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              {client.totalWorkItems} lucrări
            </p>
          )}
          {client.totalInvoiced !== undefined && (
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {client.totalInvoiced.toFixed(2)} RON
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
