-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    job VARCHAR(100) NOT NULL DEFAULT '',
    interests VARCHAR(100) NOT NULL DEFAULT '',
    level VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content_pool table (shared content for all users)
CREATE TABLE IF NOT EXISTS public.content_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jp TEXT NOT NULL,
    en TEXT NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    job_roles TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    grammar_patterns TEXT[] DEFAULT '{}',
    contexts TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    generated_by VARCHAR(20) DEFAULT 'gemini' CHECK (generated_by IN ('gemini', 'mock')),
    last_downvoted_at TIMESTAMP WITH TIME ZONE
);

-- Create user_drills table (tracks user's progress on each drill)
CREATE TABLE IF NOT EXISTS public.user_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content_pool(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_rating VARCHAR(10) CHECK (last_rating IN ('hard', 'soso', 'easy')),
    review_count INTEGER DEFAULT 0,
    UNIQUE(user_id, content_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_drills_user_id ON public.user_drills(user_id);
CREATE INDEX idx_user_drills_next_review_at ON public.user_drills(user_id, next_review_at);
CREATE INDEX idx_content_pool_level ON public.content_pool(level);
CREATE INDEX idx_content_pool_generated_by ON public.content_pool(generated_by);

-- Add updated_at trigger for users table
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time subscriptions
ALTER TABLE public.content_pool REPLICA IDENTITY FULL;
ALTER TABLE public.user_drills REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
