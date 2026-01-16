/**
 * Ask Sian Configuration
 * This file now uses BrandConfig for all branding values.
 * BrandConfig should be loaded before this file.
 */

// Ensure BrandConfig is loaded
if (typeof window.BrandConfig === 'undefined') {
    console.error('BrandConfig not found! Make sure brand-config.js is loaded before config.js');
    // Fallback to default Dorothy Tarot config (should not happen if brand-config.js loads properly)
    window.BrandConfig = {
        siteName: 'Dorothy Tarot',
        readerName: 'Dorothy',
        email: {
            fromEmail: 'noreply@dorothytarot.com',
            fromName: 'Dorothy Tarot',
            websiteUrl: 'https://dorothytarot.com'
        },
        supabase: {
            url: 'https://hmuerktbxmbgagabyqfv.supabase.co',
            anonKey: 'sb_publishable_rVykMNSqj_OO-C1bBfQxew_3XKt8EiC',
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
        },
        ui: {
            loadingMessage: '🔮 Dorothy is preparing your personalized reading...'
        },
        // Add getUIText method to fallback
        getUIText: function(key, variables = {}) {
            let text = (this.ui && this.ui[key]) || key;
            Object.keys(variables).forEach(variable => {
                text = text.replace(`{${variable}}`, variables[variable]);
            });
            text = text.replace(/{readerName}/g, this.readerName || 'Dorothy');
            text = text.replace(/{siteName}/g, this.siteName || 'Dorothy Tarot');
            text = text.replace(/{websiteUrl}/g, this.websiteUrl || 'https://dorothytarot.com');
            return text;
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
