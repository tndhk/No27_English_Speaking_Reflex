-- Enable RLS (Row Level Security) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_drills ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- CONTENT POOL POLICIES
-- ============================================

-- Authenticated users can view all content (read-only for clients)
CREATE POLICY "Authenticated users can view content_pool" ON public.content_pool
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only service role or backend can insert content (not for clients)
-- This is enforced via application logic (backend only)
CREATE POLICY "Backend can manage content_pool" ON public.content_pool
    FOR ALL
    USING (auth.role() = 'service_role');

-- Users can only increment downvotes (not set arbitrary values)
-- This is enforced via application logic since RLS can't do partial updates
CREATE POLICY "Users can increment downvotes" ON public.content_pool
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- USER DRILLS POLICIES
-- ============================================

-- Users can only view their own drills
CREATE POLICY "Users can view own drills" ON public.user_drills
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own drills
CREATE POLICY "Users can create own drills" ON public.user_drills
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own drills
CREATE POLICY "Users can update own drills" ON public.user_drills
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Backend service role can manage all drills (if needed for administrative tasks)
CREATE POLICY "Backend can manage all drills" ON public.user_drills
    FOR ALL
    USING (auth.role() = 'service_role');
