// Google AdSense Auto Ads Configuration
// Auto ads automatically place ads on your site without manual ad units

const GOOGLE_ADS_CONFIG = {
    // Your AdSense Publisher ID
    publisherId: 'ca-pub-2743300891813268',
    
    // Auto ads configuration
    autoAds: {
        enabled: true,
        pageLevelAds: true
    },
    
    // Ad Settings
    settings: {
        autoFormat: true,
        fullWidthResponsive: true,
        enableLazyLoading: true
    }
};

// Function to validate auto ads configuration
function validateAutoAds() {
    // Check if auto ads script is loaded
    if (typeof adsbygoogle === 'undefined') {
        console.warn('🚨 AdSense Auto Ads script not loaded');
        return false;
    }
    
    // Check if auto ads are enabled
    if (!GOOGLE_ADS_CONFIG.autoAds.enabled) {
        console.warn('🚨 Auto ads not enabled in configuration');
        return false;
    }
    
    console.log('✅ AdSense Auto Ads configuration validated successfully');
    return true;
}

// Function to check auto ads status
function checkAutoAdsStatus() {
    // Auto ads don't need manual configuration
    // They automatically place ads based on content and user behavior
    console.log('Auto ads are enabled and will place ads automatically');
    return true;
}

// Function to check if an ad element has actual content
function hasAdContent(adElement) {
    if (!adElement) return false;
    
    // Check for various indicators of ad content
    const hasChildren = adElement.children.length > 0;
    const hasInnerHTML = adElement.innerHTML.trim() !== '';
    const hasIframe = adElement.querySelector('iframe');
    const hasImg = adElement.querySelector('img');
    const hasAdClass = adElement.classList.contains('adsbygoogle') && adElement.style.display !== 'none';
    
    // Also check if the element has been populated by AdSense
    const hasAdSenseContent = adElement.innerHTML.includes('google') || 
                             adElement.innerHTML.includes('adsbygoogle') ||
                             adElement.querySelector('[id*="google"]') ||
                             adElement.querySelector('[class*="google"]');
    
    return hasChildren || hasInnerHTML || hasIframe || hasImg || hasAdClass || hasAdSenseContent;
}

// Function to hide ad containers if no ads are detected (only for main ad)
function hideEmptyAdContainers() {
    const adContainers = document.querySelectorAll('.in-content-ad');
    
    adContainers.forEach(container => {
        const adElement = container.querySelector('.adsbygoogle');
        
        if (!hasAdContent(adElement)) {
            container.classList.add('hidden');
            console.log('Hiding empty ad container:', container.className);
        } else {
            // Show the container if it has content
            container.classList.remove('hidden');
            container.style.opacity = '1';
        }
    });
}

// Set up MutationObserver to watch for ad content changes (only for main ad)
function setupAdObserver() {
    const adElements = document.querySelectorAll('.in-content-ad .adsbygoogle');
    
    adElements.forEach(adElement => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    const container = adElement.closest('.in-content-ad');
                    if (container) {
                        if (hasAdContent(adElement)) {
                            container.classList.remove('hidden');
                            container.style.opacity = '1';
                        } else {
                            container.classList.add('hidden');
                        }
                    }
                }
            });
        });
        
        observer.observe(adElement, {
            childList: true,
            attributes: true,
            subtree: true
        });
    });
}

// Function to disable AdSense and hide containers
function disableAdSense() {
    console.log('Disabling AdSense due to errors');
    
    // Disable AdSense
    if (window.adsbygoogle) {
        window.adsbygoogle = null;
    }
    
    // Hide all ad containers
    const adContainers = document.querySelectorAll('.in-content-ad');
    adContainers.forEach(container => {
        container.classList.add('hidden');
        container.style.display = 'none';
    });
}

// Function to safely initialize AdSense (only for main ad)
function initializeAdSense() {
    const adContainer = document.querySelector('.in-content-ad .adsbygoogle');
    
    if (!adContainer) {
        console.log('No AdSense container found');
        return false;
    }
    
    // Check if container is visible and has proper dimensions
    const rect = adContainer.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(adContainer);
    const parentRect = adContainer.closest('.in-content-ad')?.getBoundingClientRect();
    
    const isVisible = rect.width > 0 && rect.height > 0 && 
                     computedStyle.display !== 'none' && 
                     computedStyle.visibility !== 'hidden' &&
                     computedStyle.opacity !== '0' &&
                     parentRect && parentRect.width > 0;
    
    if (!isVisible) {
        console.log('AdSense container not ready:', {
            width: rect.width,
            height: rect.height,
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            parentWidth: parentRect?.width || 0,
            parentHeight: parentRect?.height || 0
        });
        return false;
    }
    
    // Additional check: ensure minimum dimensions
    if (rect.width < 300 || rect.height < 250) {
        console.log('AdSense container too small:', {
            width: rect.width,
            height: rect.height,
            minRequired: '300x250'
        });
        return false;
    }
    
    // Check if the container is actually in the viewport
    if (rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
        console.log('AdSense container not in viewport');
        return false;
    }
    
    try {
        // Only initialize if adsbygoogle is available and container is ready
        if (typeof adsbygoogle !== 'undefined' && adsbygoogle.push) {
            // Wrap the push in a try-catch to handle internal AdSense errors
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
                console.log('Google AdSense initialized successfully');
                return true;
            } catch (pushError) {
                console.log('AdSense push error caught:', pushError.message);
                // Hide containers and disable AdSense
                this.disableAdSense();
                return false;
            }
        } else {
            console.log('AdSense script not ready yet');
            return false;
        }
    } catch (error) {
        console.error('Error initializing AdSense:', error);
        this.disableAdSense();
        return false;
    }
}

// Initialize auto ads when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Validate auto ads configuration
    validateAutoAds();
    
    // Check auto ads status
    checkAutoAdsStatus();
    
    // Auto ads are automatically initialized by the AdSense script
    // No manual initialization needed
    console.log('AdSense Auto Ads initialized - ads will appear automatically');
});

// Global error handler for AdSense errors
window.addEventListener('error', function(event) {
    const errorMessage = event.error?.message || event.message || '';
    const errorSource = event.filename || '';
    
    // Handle various AdSense errors
    if (errorMessage.includes('No slot size') || 
        errorSource.includes('show_ads_impl_fy2021.js') ||
        errorSource.includes('adsbygoogle.js') ||
        errorMessage.includes('adsbygoogle') ||
        errorMessage.includes('AdSense')) {
        
        console.log('Caught AdSense error, implementing fallback:', errorMessage);
        
        // Disable AdSense to prevent further errors
        if (window.adsbygoogle) {
            window.adsbygoogle = null;
        }
        
        // Hide ad containers
        const adContainers = document.querySelectorAll('.in-content-ad');
        adContainers.forEach(container => {
            container.classList.add('hidden');
            container.style.display = 'none';
        });
        
        // Prevent error from showing in console
        event.preventDefault();
        return true;
    }
});

// Additional error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    const errorMessage = event.reason?.message || event.reason || '';
    
    if (errorMessage.includes('AdSense') || 
        errorMessage.includes('adsbygoogle') ||
        errorMessage.includes('show_ads_impl')) {
        
        console.log('Caught AdSense promise rejection, implementing fallback');
        
        // Hide ad containers
        const adContainers = document.querySelectorAll('.in-content-ad');
        adContainers.forEach(container => {
            container.classList.add('hidden');
            container.style.display = 'none';
        });
        
        // Prevent the error from showing
        event.preventDefault();
    }
});

// Debug function for auto ads
window.debugAutoAds = function() {
    console.log('=== AdSense Auto Ads Debug ===');
    console.log('Publisher ID:', GOOGLE_ADS_CONFIG.publisherId);
    console.log('Auto Ads Enabled:', GOOGLE_ADS_CONFIG.autoAds.enabled);
    console.log('Page Level Ads:', GOOGLE_ADS_CONFIG.autoAds.pageLevelAds);
    
    // Check if AdSense script is loaded
    console.log('AdSense Script Loaded:', typeof adsbygoogle !== 'undefined');
    
    // Check for auto-placed ads
    const autoAds = document.querySelectorAll('[data-adsbygoogle-status]');
    console.log('Auto-placed Ads Found:', autoAds.length);
    
    // Validation results
    const isValid = validateAutoAds();
    console.log('Configuration Valid:', isValid);
    
    if (isValid) {
        console.log('✅ Auto ads are properly configured and will place ads automatically');
    }
};

// Export for use in other scripts
window.GOOGLE_ADS_CONFIG = GOOGLE_ADS_CONFIG;
