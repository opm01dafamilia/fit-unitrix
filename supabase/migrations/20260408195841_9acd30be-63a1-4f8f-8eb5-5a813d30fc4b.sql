
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert settings"
ON public.app_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete settings"
ON public.app_settings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default: Personal enabled
INSERT INTO public.app_settings (key, value) VALUES ('personal_enabled', 'true'::jsonb);
