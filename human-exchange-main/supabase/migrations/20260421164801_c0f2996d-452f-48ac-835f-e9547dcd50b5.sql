ALTER TABLE public.personalities
  ADD COLUMN IF NOT EXISTS youtube_channel_id text,
  ADD COLUMN IF NOT EXISTS last_subscriber_count bigint;

-- Map known personalities to their YouTube channel IDs (best-effort by name)
UPDATE public.personalities SET youtube_channel_id = 'UCX6OQ3DkcsbYNE6H8uQQuVA'
  WHERE youtube_channel_id IS NULL AND lower(name) LIKE '%mrbeast%' AND lower(name) NOT LIKE '%gaming%';

UPDATE public.personalities SET youtube_channel_id = 'UCqECaJ8Gagnn7YCbPEzWH6g'
  WHERE youtube_channel_id IS NULL AND lower(name) LIKE '%taylor swift%';

UPDATE public.personalities SET youtube_channel_id = 'UCIPPMRA040LQr5QPyJEbmXA'
  WHERE youtube_channel_id IS NULL AND lower(name) LIKE '%mrbeast gaming%';