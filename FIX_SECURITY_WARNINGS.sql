-- Fix Security Warnings: Set secure search_path for functions
-- Run this in your Supabase SQL Editor to fix the security warnings

-- Fix cleanup_expired_readings function
CREATE OR REPLACE FUNCTION cleanup_expired_readings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM readings WHERE expires_at < NOW();
END;
$$;

-- Fix get_reading_stats function (create if it doesn't exist, or update if it does)
CREATE OR REPLACE FUNCTION get_reading_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_readings', COUNT(*),
        'active_readings', COUNT(*) FILTER (WHERE expires_at > NOW()),
        'expired_readings', COUNT(*) FILTER (WHERE expires_at <= NOW()),
        'total_views', COALESCE(SUM(view_count), 0),
        'readings_today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'readings_this_week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
        'readings_this_month', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')
    ) INTO stats
    FROM readings;
    
    RETURN stats;
END;
$$;

-- Fix get_email_stats function (create if it doesn't exist, or update if it does)
CREATE OR REPLACE FUNCTION get_email_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_emails', COUNT(*),
        'emails_today', COUNT(*) FILTER (WHERE sent_at >= CURRENT_DATE),
        'emails_this_week', COUNT(*) FILTER (WHERE sent_at >= CURRENT_DATE - INTERVAL '7 days'),
        'emails_this_month', COUNT(*) FILTER (WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days'),
        'unique_recipients', COUNT(DISTINCT recipient_email),
        'successful_emails', COUNT(*) FILTER (WHERE status = 'sent'),
        'failed_emails', COUNT(*) FILTER (WHERE status = 'failed')
    ) INTO stats
    FROM email_logs;
    
    RETURN stats;
END;
$$;

-- Also fix the other functions for consistency
CREATE OR REPLACE FUNCTION increment_reading_view_count(reading_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE readings 
    SET view_count = view_count + 1 
    WHERE id = reading_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION increment_reading_share_count(reading_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE readings 
    SET share_count = share_count + 1 
    WHERE id = reading_uuid;
END;
$$;

