-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for scheduler platforms
CREATE TYPE scheduler_platform AS ENUM (
  'calendly',
  'cal.com',
  'acuity',
  'hubspot',
  'zoom',
  'other'
);

-- Create enum for contact sources
CREATE TYPE contact_source AS ENUM (
  'extension',
  'web_app',
  'manual',
  'import'
);

-- Create enum for contact status
CREATE TYPE contact_status AS ENUM (
  'new',
  'contacted',
  'responded',
  'meeting_scheduled',
  'closed'
);

-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  preferences JSONB DEFAULT '{}',
  api_keys JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  title TEXT,
  organization TEXT,
  location TEXT,
  email TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  source contact_source NOT NULL DEFAULT 'web_app',
  status contact_status NOT NULL DEFAULT 'new',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduler_links table
CREATE TABLE public.scheduler_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  platform scheduler_platform NOT NULL,
  url TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  context_snippet TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_checked TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create search_sessions table
CREATE TABLE public.search_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_params JSONB NOT NULL,
  results_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create extension_sync table for managing sync between extension and web app
CREATE TABLE public.extension_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'contact_added', 'contact_updated', etc.
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduler_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_sync ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for contacts
CREATE POLICY "Users can view their own contacts" 
  ON public.contacts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts" 
  ON public.contacts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
  ON public.contacts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
  ON public.contacts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for scheduler_links
CREATE POLICY "Users can view scheduler links for their contacts" 
  ON public.scheduler_links 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE contacts.id = scheduler_links.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scheduler links for their contacts" 
  ON public.scheduler_links 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE contacts.id = scheduler_links.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scheduler links for their contacts" 
  ON public.scheduler_links 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE contacts.id = scheduler_links.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scheduler links for their contacts" 
  ON public.scheduler_links 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE contacts.id = scheduler_links.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

-- Create RLS policies for search_sessions
CREATE POLICY "Users can view their own search sessions" 
  ON public.search_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search sessions" 
  ON public.search_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search sessions" 
  ON public.search_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for extension_sync
CREATE POLICY "Users can view their own sync data" 
  ON public.extension_sync 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync data" 
  ON public.extension_sync 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync data" 
  ON public.extension_sync 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_organization ON public.contacts(organization);
CREATE INDEX idx_contacts_status ON public.contacts(status);
CREATE INDEX idx_contacts_created_at ON public.contacts(created_at);
CREATE INDEX idx_scheduler_links_contact_id ON public.scheduler_links(contact_id);
CREATE INDEX idx_scheduler_links_platform ON public.scheduler_links(platform);
CREATE INDEX idx_scheduler_links_is_active ON public.scheduler_links(is_active);
CREATE INDEX idx_search_sessions_user_id ON public.search_sessions(user_id);
CREATE INDEX idx_extension_sync_user_id ON public.extension_sync(user_id);
CREATE INDEX idx_extension_sync_processed ON public.extension_sync(processed);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER TABLE public.contacts REPLICA IDENTITY FULL;
ALTER TABLE public.scheduler_links REPLICA IDENTITY FULL;
ALTER TABLE public.extension_sync REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduler_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extension_sync;