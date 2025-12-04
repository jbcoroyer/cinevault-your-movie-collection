-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create lists table for personal movie lists
CREATE TABLE public.lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create list_items table for movies in lists
CREATE TABLE public.list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE(list_id, tmdb_id)
);

-- Enable RLS on both tables
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for lists
CREATE POLICY "Users can view own lists" ON public.lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public lists" ON public.lists
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own lists" ON public.lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists" ON public.lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists" ON public.lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for list_items
CREATE POLICY "Users can view items from own lists" ON public.list_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.lists WHERE id = list_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view items from public lists" ON public.list_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.lists WHERE id = list_id AND is_public = true)
  );

CREATE POLICY "Users can add items to own lists" ON public.list_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.lists WHERE id = list_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update items in own lists" ON public.list_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.lists WHERE id = list_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete items from own lists" ON public.list_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.lists WHERE id = list_id AND user_id = auth.uid())
  );

-- Create trigger for updated_at
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_lists_user_id ON public.lists(user_id);
CREATE INDEX idx_list_items_list_id ON public.list_items(list_id);
CREATE INDEX idx_list_items_tmdb_id ON public.list_items(tmdb_id);