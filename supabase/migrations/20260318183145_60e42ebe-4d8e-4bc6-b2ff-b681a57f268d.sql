
-- Create user_files table for PDF tracking
CREATE TABLE public.user_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'treino',
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  ai_extracted_data JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own files" ON public.user_files FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own files" ON public.user_files FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON public.user_files FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-pdfs', 'user-pdfs', false, 20971520, ARRAY['application/pdf']);

-- Storage RLS policies
CREATE POLICY "Users can upload own PDFs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own PDFs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'user-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own PDFs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'user-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
