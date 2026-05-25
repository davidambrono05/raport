import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ClientList } from '@/modules/crm/ClientList';
import type { Client } from '@/modules/crm/types';
import { listContacts } from '@/integrations/supabase/queries/contacts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { CreateClientDialog } from '@/components/CreateClientDialog';

export const Route = createFileRoute('/clients')({
  component: ClientsPage,
});

function ClientsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: clients = [], refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const result = await listContacts(supabase, '');
      return (result || []) as Client[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clienți</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Client nou
        </button>
      </div>
      <ClientList
        clients={clients}
        onAdd={() => setShowCreate(true)}
      />
      {showCreate && (
        <CreateClientDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
