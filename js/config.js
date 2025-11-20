/**
 * Ask Sian Configuration
 * This file now uses BrandConfig for all branding values.
 * BrandConfig should be loaded before this file.
 */

// Ensure BrandConfig is loaded
if (typeof window.BrandConfig === 'undefined') {
    console.error('BrandConfig not found! Make sure brand-config.js is loaded before config.js');
    // Fallback to default Ask Sian config
    window.BrandConfig = {
        siteName: 'Ask Sian',
        readerName: 'Sian',
        email: {
            fromEmail: 'noreply@asksian.com',
            fromName: 'Ask Sian',
            websiteUrl: 'https://asksian.com'
        },
        supabase: {
            url: 'https://eydmgvneewccqfylcsdh.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZG1ndm5lZXdjY3FmeWxjc2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzE5MDQsImV4cCI6MjA3NTcwNzkwNH0.LbMZ5dEQNF7tfw0JsrSo77qYa4eIwHLAt_IDZuDY28s',
            tables: {
                readings: 'readings',
                email_logs: 'email_logs',
                analytics: 'analytics'
            },
            functions: {
                sendEmail: 'send-email',
                generateShareUrl: 'generate-share-url'
            }
        },
        features: {
            emailSharing: true,
            readingStorage: true,
            supabaseIntegration: true
        },
        reading: {
            expiryDays: 30,
            publicByDefault: true
        },
        openai: {
            defaultApiKey: 'sk-proj-your-openai-api-key-here'
        },
        debug: {
            enabled: false,
            level: 'info'
        }
    };
}

// Create AskSianConfig from BrandConfig for backward compatibility
window.AskSianConfig = {
    // Feature Flags
    features: window.BrandConfig.features || {
        emailSharing: true,
        readingStorage: true,
        supabaseIntegration: true
    },
    
    // Supabase Configuration (from BrandConfig)
    supabase: window.BrandConfig.supabase,
    
    // Email Configuration (from BrandConfig)
    email: window.BrandConfig.email,
    
    // Reading Configuration (from BrandConfig)
    reading: window.BrandConfig.reading,
    
    // OpenAI Configuration (from BrandConfig)
    openai: window.BrandConfig.openai,
    
    // Debug Configuration (from BrandConfig)
    debug: window.BrandConfig.debug
};

// Set Supabase config for backward compatibility
if (window.AskSianConfig.supabase && window.AskSianConfig.supabase.url !== 'https://your-project-id.supabase.co') {
    window.SUPABASE_CONFIG = window.AskSianConfig.supabase;
}
