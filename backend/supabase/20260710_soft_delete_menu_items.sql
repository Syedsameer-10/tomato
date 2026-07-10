ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

UPDATE public.menu_items
SET is_deleted = false
WHERE is_deleted IS NULL;
