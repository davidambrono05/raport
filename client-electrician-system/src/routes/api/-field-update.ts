import { createServerFunction } from '@tanstack/react-start/server';
import { supabase } from '@/integrations/supabase/client';

export const serverFieldUpdate = createServerFunction(
  async ({ request }) => {
    const body = await request.json() as {
      token: string;
      status?: string;
      note?: string;
    };

    const { token, status, note } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token lipsește' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('field_tokens')
        .select('*, work_items(*)')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({ error: 'Token invalid sau expirat' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (status) {
        const { error: statusError } = await supabase.rpc('update_work_item_status', {
          p_work_item_id: tokenData.work_item_id,
          p_new_status: status,
          p_changed_by: null,
          p_note: note || null,
        });

        if (statusError) throw statusError;
      }

      await supabase
        .from('field_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : 'Eroare' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
);
