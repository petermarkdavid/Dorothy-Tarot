/**
 * Dorothy Tarot Brand Configuration
 * LGBTI-friendly tarot reading site
 */

window.BrandConfig = {
    // ============================================
    // SITE IDENTITY
    // ============================================
    siteName: 'Dorothy Tarot',
    readerName: 'Dorothy',
    tagline: 'Inclusive tarot guidance · Available 24/7',
    
    // ============================================
    // DOMAIN & URLs
    // ============================================
    domain: 'dorothytarot.com',
    websiteUrl: 'https://dorothytarot.com',
    
    // ============================================
    // EMAIL CONFIGURATION
    // ============================================
    email: {
        fromEmail: 'noreply@dorothytarot.com',
        fromName: 'Dorothy Tarot',
        supportEmail: 'support@dorothytarot.com',
        websiteUrl: 'https://dorothytarot.com'
    },
    
    // ============================================
    // COLOR SCHEME - Vibrant, inclusive colors
    // ============================================
    colors: {
        // Primary: Vibrant purple/magenta - welcoming and inclusive
        primary: '#9B59B6',           // Rich vibrant purple
        primaryLight: '#BB8FCE',      // Lighter purple
        primaryDark: '#7D3C98',       // Deeper purple
        primarySubtle: 'rgba(155, 89, 182, 0.15)',
        
        // Accent: Vibrant pink/magenta for warmth and celebration
        accent: '#E91E63',            // Vibrant pink
        accentLight: '#F48FB1',
        accentDark: '#C2185B',
        
        // Additional vibrant colors for LGBTI celebration
        vibrantTeal: '#26A69A',
        vibrantCoral: '#FF6B6B',
        
        // Background colors
        background: '#ffffff',
        backgroundSecondary: '#f8f9fa',
        backgroundAccent: '#f1f3f4',
        
        // Text colors
        textPrimary: '#1a1a1a',
        textSecondary: '#4a4a4a',
        textMuted: '#6c757d',
        textLight: '#8e8e93',
        
        // Border colors
        borderLight: '#e5e5e7',
        borderMedium: '#d1d1d6',
        borderStrong: '#c7c7cc',
        
        // Theme color for mobile browsers
        themeColor: '#9B59B6'
    },
    
    // ============================================
    // ANALYTICS & TRACKING
    // ============================================
    // Configure these when setting up analytics
    analytics: {
        ga4: 'G-FXZTKK2YP8',                    // Google Analytics 4 property ID
        adsense: 'ca-pub-2743300891813268',     // Google AdSense publisher ID
        conversion: 'AW-XXXXXXXXX'              // Google Ads conversion tracking ID
    },
    
    // ============================================
    // SOCIAL MEDIA
    // ============================================
    social: {
        twitter: '@dorothytarot',
        facebook: 'dorothytarot',
        instagram: '@dorothytarot'
    },
    
    // ============================================
    // SEO META DATA
    // ============================================
    meta: {
        description: 'Dorothy Tarot - Free AI-powered tarot card readings for the LGBTI community. Get instant, personalized interpretations and daily horoscopes in a welcoming, inclusive space.',
        keywords: 'tarot reading, LGBTI tarot, gay tarot, inclusive tarot, AI tarot, online tarot, tarot cards, tarot interpretation, free tarot reading, tarot guidance, Dorothy Tarot, virtual tarot reader, queer tarot, LGBTQ tarot',
        author: 'Dorothy Tarot',
        language: 'en-US',
        geoRegion: 'US',
        geoPlaceName: 'United States'
    },
    
    // ============================================
    // SUPABASE CONFIGURATION
    // ============================================
    // NOTE: Using shared database with Ask Sian
    // To use separate database, create new Supabase project and update URL/anonKey
    supabase: {
        url: 'https://hmuerktbxmbgagabyqfv.supabase.co',
        anonKey: 'sb_publishable_rVykMNSqj_OO-C1bBfQxew_3XKt8EiC',tables: {
            readings: 'readings',
            email_logs: 'email_logs',
            analytics: 'analytics'
        },
        functions: {
            sendEmail: 'send-email',
            generateShareUrl: 'generate-share-url'
        }
    },
    
    // ============================================
    // FEATURE FLAGS
    // ============================================
    features: {
        emailSharing: true,
        readingStorage: true,
        supabaseIntegration: true,
        dailyHoroscope: true,
        premiumFeatures: false
    },
    
    // ============================================
    // READING CONFIGURATION
    // ============================================
    reading: {
        expiryDays: 30,
        publicByDefault: true
    },
    
    // ============================================
    // OPENAI CONFIGURATION
    // ============================================
    openai: {
        defaultApiKey: null
    },
    
    // ============================================
    // UI TEXT & MESSAGES - Inclusive and welcoming
    // ============================================
    ui: {
        heroTitle: 'Discover your path with confidence and pride.',
        heroSubtitle: 'Get instant AI-powered tarot readings in a safe, inclusive space. Share your journey with friends who understand.',
        ctaButton: 'Start your reading',
        loadingMessage: '🔮 {readerName} is preparing your personalized reading...',
        shareButton: 'Share Your Reading',
        shareModalTitle: '🔮 Share Your Reading',
        emailSubject: '🔮 Your Tarot Reading from {senderName}',
        emailGreeting: 'Hi {friendName}!',
        emailIntro: '{senderName} has shared a tarot reading with you using {siteName}!',
        emailAbout: '✨ **About {siteName}:**\n{siteName} is a free, inclusive AI-powered tarot reading service that provides instant, personalized interpretations in a welcoming space. Get your own reading at {websiteUrl}',
        emailFooter: 'May the cards guide you on your journey with love and acceptance! ✨'
    },
    
    // ============================================
    // DEBUG CONFIGURATION
    // ============================================
    debug: {
        enabled: false,
        level: 'info'
    }
};

// Helper function to get UI text with variable substitution
window.BrandConfig.getUIText = function(key, variables = {}) {
    let text = this.ui[key] || key;
    
    // Replace provided variables
    Object.keys(variables).forEach(variable => {
        text = text.replace(`{${variable}}`, variables[variable]);
    });
    
    // Replace config variables
    text = text.replace(/{readerName}/g, this.readerName);
    text = text.replace(/{siteName}/g, this.siteName);
    text = text.replace(/{websiteUrl}/g, this.websiteUrl);
    
    return text;
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.BrandConfig;
}

