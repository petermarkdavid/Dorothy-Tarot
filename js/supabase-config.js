/**
 * Supabase Configuration
 * Configuration for Supabase client and database connection
 */

// Supabase configuration - Check BrandConfig first, then AskSianConfig for backward compatibility
const SUPABASE_CONFIG = (window.BrandConfig && window.BrandConfig.supabase) || 
                        (window.AskSianConfig && window.AskSianConfig.supabase) || {
    // Fallback default (should not be used if BrandConfig is loaded)
    url: 'https://eydmgvneewccqfylcsdh.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZG1ndm5lZXdjY3FmeWxjc2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzE5MDQsImV4cCI6MjA3NTcwNzkwNH0.LbMZ5dEQNF7tfw0JsrSo77qYa4eIwHLAt_IDZuDY28s',
    
    // Database table names
    tables: {
        readings: 'readings',
        email_logs: 'email_logs',
        analytics: 'analytics'
    },
    
    // Edge function endpoints
    functions: {
        sendEmail: 'send-email',
        generateShareUrl: 'generate-share-url'
    }
};

// Initialize Supabase client
let supabase = null;

/**
 * Initialize Supabase client
 * @returns {Object} - Supabase client instance
 */
function initializeSupabase() {
    if (supabase) {
        return supabase;
    }
    
    try {
        // Check if Supabase library is loaded
        if (typeof window === 'undefined' || !window.supabase) {
            console.warn('Supabase library not loaded yet');
            return null;
        }
        
        // Validate configuration
        if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'https://your-project-id.supabase.co') {
            console.warn('Supabase URL not configured');
            return null;
        }
        
        if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey === 'your-anon-key-here') {
            console.warn('Supabase anon key not configured');
            return null;
        }
        
        // Create Supabase client
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase client initialized successfully');
        return supabase;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return null;
    }
}

/**
 * Get Supabase client instance
 * @returns {Object|null} - Supabase client or null if not available
 */
function getSupabaseClient() {
    return initializeSupabase();
}

/**
 * Check if Supabase is available and configured
 * @returns {boolean} - Whether Supabase is properly configured
 */
function isSupabaseConfigured() {
    const client = getSupabaseClient();
    return client !== null && SUPABASE_CONFIG.url !== 'https://your-project-id.supabase.co';
}

// Export configuration
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.getSupabaseClient = getSupabaseClient;
window.isSupabaseConfigured = isSupabaseConfigured;
