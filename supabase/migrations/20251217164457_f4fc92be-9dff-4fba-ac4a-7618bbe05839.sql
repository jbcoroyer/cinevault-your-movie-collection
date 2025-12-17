-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add check constraint for notification types
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('price_alert', 'new_follower', 'like', 'comment', 'badge_earned', 'challenge_completed', 'system'));

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow system to insert notifications (via service role)
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  price_alerts BOOLEAN DEFAULT true,
  new_followers BOOLEAN DEFAULT true,
  likes BOOLEAN DEFAULT true,
  comments BOOLEAN DEFAULT true,
  badges BOOLEAN DEFAULT true,
  challenges BOOLEAN DEFAULT true,
  system BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for preferences
CREATE POLICY "Users can view own preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;