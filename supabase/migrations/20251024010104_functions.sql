-- CleanStay AI System - Database Functions
-- Created: 2025-01-26
-- Purpose: Business logic functions

-- Function to generate signed URLs for media
CREATE OR REPLACE FUNCTION public.generate_signed_url(
    bucket_name TEXT,
    object_path TEXT,
    expires_in INTEGER DEFAULT 172800
) RETURNS TEXT AS $$
BEGIN
    -- This is a placeholder function
    -- In production, this would integrate with Supabase Storage
    RETURN 'https://example.com/signed-url/' || object_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cleaning statistics
CREATE OR REPLACE FUNCTION public.get_cleaning_stats(
    p_tenant_id UUID,
    p_from_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_to_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    total_cleanings BIGINT,
    completed_cleanings BIGINT,
    avg_duration INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_cleanings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_cleanings,
        AVG(completed_at - started_at) as avg_duration
    FROM public.cleanings 
    WHERE tenant_id = p_tenant_id 
    AND scheduled_date BETWEEN p_from_date AND p_to_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
