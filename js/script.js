// ChatGPT Tarot Interpreter Class is now in chatgpt-integration.js

/**
 * Helper function to get brand configuration values
 * Falls back to Ask Sian defaults if BrandConfig is not available
 */
function getBrandConfig() {
    if (window.BrandConfig) {
        return window.BrandConfig;
    }
    // Fallback to Ask Sian defaults
    return {
        siteName: 'Ask Sian',
        readerName: 'Sian',
        websiteUrl: 'https://asksian.com',
        getUIText: function(key, vars) {
            const defaults = {
                loadingMessage: '🔮 {readerName} is preparing your personalised reading...'
            };
            let text = this.ui?.[key] || defaults[key] || key;
            Object.keys(vars || {}).forEach(v => text = text.replace(`{${v}}`, vars[v]));
            text = text.replace(/{readerName}/g, this.readerName);
            text = text.replace(/{siteName}/g, this.siteName);
            return text;
        },
        ui: {}
    };
}

/**
 * Tarot Reading Application
 * Main class that handles all tarot reading functionality including:
 * - Card drawing and interpretation
 * - AI-powered readings via ChatGPT
 * - User preferences and settings
 * - Reading sharing and storage
 * - Premium features and API key management
 */
class TarotReader {
    /**
     * Initialize the TarotReader application
     * Sets up all event listeners, loads user preferences, and initializes components
     */
    constructor() {
        this.currentSpread = 'single';
        this.drawnCards = [];
        this.allCards = this.getAllCards();
        this.chatGPTInterpreter = new ChatGPTTarotInterpreter();
        this.userName = null;
        this.userStarsign = null;
        this.initializeEventListeners();
        this.clearOldApiKey(); // Clear old keys first
        this.loadSavedApiKey();
        this.loadSavedName();
        this.loadSavedStarsign();
        this.checkPremiumStatus();
        this.initializeDarkMode();
        this.initializeCharCounter();
        this.initializeStickyCards();
        // Initialize share functionality only if enabled
        if (window.AskSianConfig?.features?.emailSharing) {
            this.initializeShareFunctionality();
        }
    }


    clearOldApiKey() {
        // Aggressively clear any old compromised API keys
        const savedKey = localStorage.getItem('openai_api_key');
        if (this.isCompromisedApiKey(savedKey)) {
            console.log('Clearing old compromised API key on page load...');
            localStorage.removeItem('openai_api_key');
            // Also clear from the ChatGPT interpreter
            if (this.chatGPTInterpreter && this.chatGPTInterpreter.apiKey) {
                this.chatGPTInterpreter.apiKey = null;
            }
        }
    }

    isCompromisedApiKey(key) {
        if (!key) return false;

        const normalizedKey = key.trim();

        // Only store small fragments so the full key is never exposed in the codebase
        const compromisedPrefixes = ['sk-proj-Ckrq8'];
        const compromisedFragments = ['Y0wA'];

        return compromisedPrefixes.some(prefix => normalizedKey.startsWith(prefix)) ||
               compromisedFragments.some(fragment => normalizedKey.includes(fragment));
    }

    isPlaceholderApiKey(key) {
        if (!key) return false;

        const normalizedKey = key.trim();
        const placeholders = [
            'sk-proj-your-key-here',
            'sk-proj-your-actual-key-here',
            'YOUR_OPENAI_API_KEY'
        ];

        return placeholders.includes(normalizedKey);
    }

    // Check for default API key (you can set this securely)
    getDefaultApiKey() {
        // Check if there's a global config with a default API key
        if (window.BrandConfig && window.BrandConfig.openai && window.BrandConfig.openai.defaultApiKey) {
            const configuredKey = window.BrandConfig.openai.defaultApiKey.trim();
            if (!this.isPlaceholderApiKey(configuredKey)) {
                return configuredKey;
            }
        }
        // Fallback to AskSianConfig for backward compatibility
        if (window.AskSianConfig && window.AskSianConfig.defaultApiKey) {
            const configuredKey = window.AskSianConfig.defaultApiKey.trim();
            if (!this.isPlaceholderApiKey(configuredKey)) {
                return configuredKey;
            }
        }
        return null;
    }

    // Update API config message based on configuration
    updateApiConfigMessage() {
        const messageElement = document.getElementById('apiConfigMessage');
        const apiConfig = document.getElementById('apiConfig');
        
        if (window.AskSianConfig) {
            if (window.AskSianConfig.apiConfigMessage) {
                if (messageElement) {
                    messageElement.textContent = window.AskSianConfig.apiConfigMessage;
                }
            }
            
            if (window.AskSianConfig.showApiKeyInput === false) {
                if (apiConfig) {
                    apiConfig.style.display = 'none';
                }
            }
        }
    }

    getAllCards() {
        const allCards = [];
        
        // Add Major Arcana
        tarotCards.majorArcana.forEach(card => {
            allCards.push({ ...card, type: 'major' });
        });
        
        // Add Minor Arcana
        Object.values(tarotCards.minorArcana).forEach(suit => {
            suit.forEach(card => {
                allCards.push({ ...card, type: 'minor' });
            });
        });
        
        return allCards;
    }

    initializeEventListeners() {
        // Use event delegation for all spread cards
        document.addEventListener('click', (e) => {
            const spreadCard = e.target.closest('.spread-card');
            if (spreadCard) {
                console.log('Spread card clicked:', spreadCard.dataset.spread);
                
                // Check if it's a premium card
                if (spreadCard.classList.contains('premium-card')) {
                    e.preventDefault();
                    if (!this.isPremiumUser()) {
                        this.showPaywallModal();
                    } else {
                        this.selectSpread(spreadCard.dataset.spread);
                    }
                } else {
                    // Regular card
                    this.selectSpread(spreadCard.dataset.spread);
                }
            }
        });

        // Add keyboard navigation for spread buttons
        document.addEventListener('keydown', (e) => {
            const spreadCard = e.target.closest('.spread-card');
            if (spreadCard && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                console.log('Spread card activated via keyboard:', spreadCard.dataset.spread);
                
                // Check if it's a premium card
                if (spreadCard.classList.contains('premium-card')) {
                    if (!this.isPremiumUser()) {
                        this.showPaywallModal();
                    } else {
                        this.selectSpread(spreadCard.dataset.spread);
                    }
                } else {
                    // Regular card
                    this.selectSpread(spreadCard.dataset.spread);
                }
            }
        });

        // Draw cards button
        const drawCardsBtn = document.getElementById('drawCards');
        if (drawCardsBtn) {
            drawCardsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.drawCards();
            });
        }


        // API key save button
        const saveApiKeyBtn = document.getElementById('saveApiKey');
        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', () => {
                this.saveApiKey();
            });
        }

        // Clear API key button
        const clearApiKeyBtn = document.getElementById('clearApiKey');
        if (clearApiKeyBtn) {
            clearApiKeyBtn.addEventListener('click', () => {
                this.clearApiKey();
                alert('API key cleared successfully!');
            });
        }



        // Name input
        const userNameInput = document.getElementById('userName');
        if (userNameInput) {
            userNameInput.addEventListener('input', (e) => {
                this.saveName(e.target.value.trim());
            });
            
            // Track name input completion
            userNameInput.addEventListener('blur', (e) => {
                if (e.target.value.trim()) {
                    this.trackEvent('name_provided', 'user_input', 'name_field');
                }
            });
        }

        // Starsign input
        const userStarsignInput = document.getElementById('userStarsign');
        if (userStarsignInput) {
            userStarsignInput.addEventListener('change', (e) => {
                this.saveStarsign(e.target.value);
                if (e.target.value) {
                    this.trackEvent('starsign_provided', 'user_input', e.target.value);
                }
            });
        }

        // Question input character counter
        const userQuestionInput = document.getElementById('userQuestion');
        if (userQuestionInput) {
            userQuestionInput.addEventListener('input', (e) => {
                this.updateCharCounter(e.target.value.length);
            });

        // Question input Enter key to draw cards
        userQuestionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent form submission
                this.drawCards();
            }
        });
        }

        // Reading type selection
        document.querySelectorAll('input[name="readingType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleReadingType(e.target.value);
                this.updatePillToggleStates();
            });
        });
        
        // Initialize pill toggle states
        this.updatePillToggleStates();
        
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }

        // Smooth scroll triggers
        document.querySelectorAll('[data-scroll-target]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const targetSelector = trigger.getAttribute('data-scroll-target');
                if (!targetSelector) return;
                const target = document.querySelector(targetSelector);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Premium button handling is now consolidated above

        // Paywall modal
        const closePaywallModal = document.getElementById('closePaywallModal');
        if (closePaywallModal) {
            closePaywallModal.addEventListener('click', () => {
                this.hidePaywallModal();
            });
        }

        const paywallModal = document.getElementById('paywallModal');
        if (paywallModal) {
            paywallModal.addEventListener('click', (e) => {
                if (e.target.id === 'paywallModal') {
                    this.hidePaywallModal();
                }
            });
        }

        // Subscription buttons
        // Notify button handler
        const notifyBtn = document.getElementById('notifyBtn');
        if (notifyBtn) {
            notifyBtn.addEventListener('click', () => {
                this.handleNotifySignup();
            });
        }

        // Footer links are now regular links, no JavaScript needed

        // AdSense initialization is handled by google-ads-config.js
        
        // Share reading button (if enabled)
        if (window.AskSianConfig?.features?.emailSharing) {
            const shareReadingBtn = document.getElementById('shareReadingBtn');
            if (shareReadingBtn) {
                shareReadingBtn.addEventListener('click', async () => {
                    await this.openShareModal();
                });
            }
        }
        
        // Test Google Analytics connection
        this.testGoogleAnalytics();
        
        // Update API config message
        this.updateApiConfigMessage();
        
        // Make export function available globally for admin use
        window.exportEmailSignups = () => this.exportEmailSignups();
        window.getSignupCount = () => this.getSignupCount();
        window.testGA = () => this.testGoogleAnalytics();
    }

    loadSavedApiKey() {
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) {
            // Check if the saved key is the old compromised key (more comprehensive check)
            if (this.isCompromisedApiKey(savedKey) ||
                this.isPlaceholderApiKey(savedKey) ||
                savedKey.length < 50) {
                console.log('Old compromised API key detected, clearing...');
                this.clearApiKey();
                alert('Old API key detected and cleared. Please enter your new API key.');
                return;
            }
            document.getElementById('apiKey').value = savedKey;
            this.chatGPTInterpreter.saveApiKey(savedKey);
            console.log('✅ Loaded API key from localStorage');
        } else {
            // No user key saved, try to use default key
            const defaultKey = this.getDefaultApiKey();
            if (defaultKey) {
                console.log('✅ Using default API key from config for AI readings');
                this.chatGPTInterpreter.saveApiKey(defaultKey);
                // Don't show the key in the input field for security
            } else {
                console.warn('⚠️ No API key found. AI interpretations will not be available.');
                console.log('To enable AI interpretations:');
                console.log('1. Enter your API key in the UI, OR');
                console.log('2. Add defaultApiKey to brand-config.js');
            }
        }
    }

    clearApiKey() {
        localStorage.removeItem('openai_api_key');
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput) {
            apiKeyInput.value = '';
        }
        console.log('API key cleared from localStorage');
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (apiKey) {
            this.chatGPTInterpreter.saveApiKey(apiKey);
            alert('API key saved successfully!');
        } else {
            alert('Please enter a valid API key.');
        }
    }



    loadSavedName() {
        const savedName = localStorage.getItem('user_name');
        if (savedName) {
            this.userName = savedName;
            const userNameInput = document.getElementById('userName');
            if (userNameInput) userNameInput.value = savedName;
            // Show a subtle indicator that name was loaded
            setTimeout(() => this.showSaveIndicator('Welcome back!'), 500);
        }
    }

    loadSavedStarsign() {
        const savedStarsign = localStorage.getItem('user_starsign');
        if (savedStarsign) {
            this.userStarsign = savedStarsign;
            const userStarsignInput = document.getElementById('userStarsign');
            if (userStarsignInput) userStarsignInput.value = savedStarsign;
        }
    }

    saveName(name) {
        if (name && name.length > 0) {
            this.userName = name;
            localStorage.setItem('user_name', name);
            this.showSaveIndicator('Name saved');
        } else {
            this.userName = null;
            localStorage.removeItem('user_name');
        }
    }

    saveStarsign(starsign) {
        if (starsign && starsign.length > 0) {
            this.userStarsign = starsign;
            localStorage.setItem('user_starsign', starsign);
            this.showSaveIndicator('Star sign saved');
        } else {
            this.userStarsign = null;
            localStorage.removeItem('user_starsign');
        }
    }





    formatDateForRegion(dateString) {
        // Detect if user is likely in US based on timezone or locale
        const isUSFormat = this.isUSRegion();
        
        if (isUSFormat) {
            // US format: MM/DD/YYYY
            const date = new Date(dateString);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        } else {
            // International format: DD/MM/YYYY
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }

    parseDateInput(dateInput) {
        // Try to parse the date input in both US and international formats
        const isUS = this.isUSRegion();
        
        // Remove any non-numeric characters except slashes and dashes
        const cleanInput = dateInput.replace(/[^\d\/\-]/g, '');
        
        // Try different patterns
        const patterns = [
            // ISO format (YYYY-MM-DD)
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
            // US format (MM/DD/YYYY or M/D/YYYY)
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
            // International format (DD/MM/YYYY or D/M/YYYY)
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        ];
        
        for (let i = 0; i < patterns.length; i++) {
            const match = cleanInput.match(patterns[i]);
            if (match) {
                let year, month, day;
                
                if (i === 0) {
                    // ISO format
                    [, year, month, day] = match;
                } else if (i === 1) {
                    // US format (MM/DD/YYYY)
                    [, month, day, year] = match;
                } else if (i === 2) {
                    // International format (DD/MM/YYYY)
                    [, day, month, year] = match;
                }
                
                // Validate the date
                const date = new Date(year, month - 1, day);
                if (date.getFullYear() == year && 
                    date.getMonth() == month - 1 && 
                    date.getDate() == day) {
                    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                }
            }
        }
        
        return null;
    }

    isUSRegion() {
        // Check multiple indicators for US region
        try {
            // Check timezone
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timezone.includes('America/') && !timezone.includes('America/Sao_Paulo')) {
                return true;
            }
            
            // Check locale
            const locale = navigator.language || navigator.userLanguage;
            if (locale.startsWith('en-US')) {
                return true;
            }
            
            // Check if we can detect US-specific formatting
            const testDate = new Date('2023-12-25');
            const usFormatted = testDate.toLocaleDateString('en-US');
            const intlFormatted = testDate.toLocaleDateString('en-GB');
            
            // If US and international formats are different, and user's format matches US
            if (usFormatted !== intlFormatted) {
                const userFormatted = testDate.toLocaleDateString();
                return userFormatted === usFormatted;
            }
            
            // Default to non-US format for safety
            return false;
        } catch (error) {
            // Default to non-US format if detection fails
            return false;
        }
    }

    initializeCharCounter() {
        // Initialize character counter on page load
        const questionInput = document.getElementById('userQuestion');
        if (questionInput) {
            this.updateCharCounter(questionInput.value.length);
        }
    }

    updateCharCounter(charCount) {
        const charCounter = document.getElementById('charCount');
        if (!charCounter) return;
        
        const counterDiv = charCounter.parentElement;
        const textarea = document.getElementById('userQuestion');
        
        charCounter.textContent = charCount;
        
        // Update styling based on character count
        if (counterDiv) counterDiv.classList.remove('warning', 'danger');
        if (textarea) textarea.classList.remove('warning', 'danger');
        
        if (charCount >= 70) {
            if (counterDiv) counterDiv.classList.add('danger');
            if (textarea) textarea.classList.add('danger');
        } else if (charCount >= 60) {
            if (counterDiv) counterDiv.classList.add('warning');
            if (textarea) textarea.classList.add('warning');
        }
    }

    checkPremiumStatus() {
        // Check if user has premium subscription on page load
        if (this.isPremiumUser()) {
            this.updatePremiumUI();
        } else {
            // Ensure premium buttons are properly styled
            this.ensurePremiumButtons();
        }
    }

    ensurePremiumButtons() {
        // Make sure premium buttons are properly styled and functional
        document.querySelectorAll('[data-premium="true"]').forEach(btn => {
            if (!btn.classList.contains('premium-btn')) {
                btn.classList.add('premium-btn');
            }
        });
    }

    isPremiumUser() {
        // Check if user has premium subscription
        const premiumStatus = localStorage.getItem('premium_subscription');
        if (!premiumStatus) return false;
        
        const subscription = JSON.parse(premiumStatus);
        const now = new Date().getTime();
        
        // Check if subscription is still valid
        return subscription.expiresAt > now;
    }

    showPaywallModal() {
        const modal = document.getElementById('paywallModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hidePaywallModal() {
        const modal = document.getElementById('paywallModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    selectSpread(spreadType) {
        console.log('selectSpread called with:', spreadType);
        
        // Update active spread button
        document.querySelectorAll('.spread-card').forEach(card => {
            card.classList.remove('active');
            card.setAttribute('aria-pressed', 'false');
        });
        
        const selectedCard = document.querySelector(`[data-spread="${spreadType}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
            selectedCard.setAttribute('aria-pressed', 'true');
            console.log('Card activated:', selectedCard.dataset.spread);
        } else {
            console.log('No button found for spread:', spreadType);
        }
        
        // Update current spread
        this.currentSpread = spreadType;
        console.log('Current spread set to:', spreadType);
        
        // Update cards container class for styling
        const cardsContainer = document.getElementById('cardsContainer');
        cardsContainer.className = `cards-container spread-${spreadType}`;
    }

    handleSubscription(plan) {
        // Simulate subscription process
        const now = new Date().getTime();
        let expiresAt;
        
        if (plan === 'monthly') {
            expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days
        } else if (plan === 'yearly') {
            expiresAt = now + (365 * 24 * 60 * 60 * 1000); // 365 days
        }
        
        // Save subscription to localStorage
        const subscription = {
            plan: plan,
            subscribedAt: now,
            expiresAt: expiresAt
        };
        
        localStorage.setItem('premium_subscription', JSON.stringify(subscription));
        
        // Hide paywall modal
        this.hidePaywallModal();
        
        // Show success message
        this.showSaveIndicator('🎉 Premium subscription activated! You now have access to all features.');
        
        // Update UI to reflect premium status
        this.updatePremiumUI();
        
        // Debug: Log subscription status
        console.log('Premium subscription activated:', subscription);
    }

    handleNotifySignup() {
        const emailInput = document.getElementById('notifyEmail');
        const email = emailInput.value.trim();
        
        if (!email) {
            this.showSaveIndicator('Please enter your email address.', 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showSaveIndicator('Please enter a valid email address.', 'error');
            return;
        }
        
        // Store email locally in a collection
        const existingSignups = JSON.parse(localStorage.getItem('notifySignups') || '[]');
        const notifyData = {
            email: email,
            signupDate: new Date().toISOString(),
            id: Date.now()
        };
        
        // Add to collection (avoid duplicates)
        const existingIndex = existingSignups.findIndex(signup => signup.email === email);
        if (existingIndex === -1) {
            existingSignups.push(notifyData);
            localStorage.setItem('notifySignups', JSON.stringify(existingSignups));
        }
        
        // Also store the latest signup
        localStorage.setItem('notifySignup', JSON.stringify(notifyData));
        
        // Send email notification to peter.anderton7@gmail.com
        this.sendEmailNotification(email);
        
        // Show success message
        this.showSaveIndicator('🎉 Thank you! We\'ll notify you when premium features launch.');
        
        // Clear input
        emailInput.value = '';
        
        // Close modal
        this.hidePaywallModal();
    }

    sendEmailNotification(userEmail) {
        // Get brand config
        const brand = getBrandConfig();
        
        // Create email content
        const subject = `New Premium Feature Signup - ${brand.siteName}`;
        const body = `New user signed up for premium feature notifications:\n\nEmail: ${userEmail}\nSignup Date: ${new Date().toLocaleString()}\nWebsite: ${brand.websiteUrl}\n\nThis is an automated notification from ${brand.siteName}.`;
        
        // Create mailto link
        const mailtoLink = `mailto:peter.anderton7@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Open email client
        window.open(mailtoLink, '_blank');
        
        // Also log to console for debugging
        console.log('Email notification prepared for:', userEmail);
        console.log('Mailto link:', mailtoLink);
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Method to export all collected emails (for admin use)
    exportEmailSignups() {
        const signups = JSON.parse(localStorage.getItem('notifySignups') || '[]');
        
        if (signups.length === 0) {
            console.log('No email signups found');
            return;
        }
        
        // Create CSV content
        const csvContent = [
            'Email,Signup Date,ID',
            ...signups.map(signup => `${signup.email},${signup.signupDate},${signup.id}`)
        ].join('\n');
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ask-sian-email-signups-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log(`Exported ${signups.length} email signups`);
    }

    // Method to get signup count (for admin use)
    getSignupCount() {
        const signups = JSON.parse(localStorage.getItem('notifySignups') || '[]');
        return signups.length;
    }


    updatePremiumUI() {
        // Update premium buttons to show they're now accessible
        document.querySelectorAll('.premium-btn').forEach(btn => {
            btn.classList.remove('premium-btn');
            btn.classList.add('spread-btn');
            
            // Clean up the button content
            const text = btn.textContent.replace('👑', '').replace('Premium', '').trim();
            btn.innerHTML = text;
            
            // Add click listener for the now-regular button
            btn.addEventListener('click', (e) => {
                this.selectSpread(e.target.dataset.spread);
            });
        });
    }

    showSaveIndicator(message) {
        // Create a temporary save indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(212, 175, 55, 0.9);
            color: #1a1a2e;
            padding: 10px 20px;
            border-radius: 25px;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            font-size: 0.9rem;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        indicator.textContent = `✓ ${message}`;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(indicator);
        
        // Remove after 2 seconds
        setTimeout(() => {
            indicator.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 300);
        }, 2000);
    }

    // AdSense initialization is now handled by google-ads-config.js

    getVisibleAdContainers() {
        const adContainers = document.querySelectorAll('.google-ad-header, .google-ad-banner, .google-ad-post-reading, .google-ad-sidebar');
        const visibleContainers = [];
        
        adContainers.forEach(container => {
            const rect = container.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(container);
            const isVisible = rect.width > 0 && rect.height > 0 && 
                            computedStyle.display !== 'none' &&
                            computedStyle.visibility !== 'hidden' &&
                            computedStyle.opacity !== '0';
            
            if (isVisible) {
                visibleContainers.push(container);
            }
        });
        
        return visibleContainers;
    }

    setupAdLoadingDetection() {
        // Check for ad loading with timeout management
        let checkCount = 0;
        const maxChecks = 5; // 10 seconds total
        let hasAnyAds = false;
        let timeoutId = null;
        
        const checkAds = () => {
            // Clear any existing timeout
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            
            checkCount++;
            
            document.querySelectorAll('.ad-container').forEach(container => {
                const adElement = container.querySelector('.adsbygoogle');
                if (adElement) {
                    // Check if ad has loaded content
                    const hasContent = adElement.children.length > 0 || 
                                     adElement.offsetHeight > 0 || 
                                     adElement.innerHTML.trim() !== '';
                    
                    if (hasContent) {
                        container.classList.add('ad-loaded');
                        hasAnyAds = true;
                    }
                }
            });
            
            // Stop if we've reached max checks or found ads
            if (checkCount >= maxChecks || hasAnyAds) {
                if (!hasAnyAds) {
                    console.log('No ads detected after', maxChecks, 'checks');
                }
                return; // Exit to prevent further timeouts
            }
            
            // Schedule next check
            timeoutId = setTimeout(checkAds, 2000);
        };
        
        // Start checking after a short delay
        timeoutId = setTimeout(checkAds, 1000);
    }

    monitorAdContent() {
        // Check for ad content after a delay to allow ads to load
        setTimeout(() => {
            this.checkAllAds();
        }, 3000);

        // Monitor for ad content changes
        const observer = new MutationObserver(() => {
            this.checkAllAds();
        });

        // Observe all ad containers
        const adContainers = document.querySelectorAll('.google-ad-header, .google-ad-banner, .google-ad-post-reading, .google-ad-sidebar');
        adContainers.forEach(container => {
            observer.observe(container, { 
                childList: true, 
                subtree: true, 
                attributes: true 
            });
        });
    }

    checkAllAds() {
        const adContainers = [
            '.google-ad-header',
            '.google-ad-banner', 
            '.google-ad-post-reading',
            '.google-ad-sidebar'
        ];

        let visibleAds = 0;
        adContainers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container) {
                const hasContent = this.hasAdContent(container);
                if (hasContent) {
                    visibleAds++;
                }
                this.checkAndShowAd(container);
            }
        });

        // If no ads are visible after checking, show the blocked message
        if (visibleAds === 0) {
            setTimeout(() => {
                this.showAdBlockedMessage();
            }, 2000);
        }
    }

    checkAndShowAd(container) {
        // Check if ad has actual content
        const hasAdContent = this.hasAdContent(container);
        
        if (hasAdContent) {
            container.style.opacity = '1';
        } else {
            container.style.opacity = '0';
        }
    }

    hasAdContent(container) {
        // Check for various indicators of ad content
        const adElements = container.querySelectorAll('ins, iframe, img, a');
        const hasElements = adElements.length > 0;
        
        // Check for actual ad content (not just empty containers)
        const hasVisibleContent = Array.from(adElements).some(element => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        });

        // Check for AdSense specific content
        const hasAdSenseContent = container.innerHTML.includes('adsbygoogle') && 
                                 container.innerHTML.length > 200; // Basic content check

        return hasElements && (hasVisibleContent || hasAdSenseContent);
    }

    hideAllAds() {
        const adContainers = document.querySelectorAll('.google-ad-header, .google-ad-banner, .google-ad-post-reading, .google-ad-sidebar');
        adContainers.forEach(container => {
            container.style.opacity = '0';
        });
        
        // Log that ads are hidden for debugging
        console.log('Ad containers hidden - no advertising content detected');
    }

    // Add a method to show a subtle message when ads are blocked
    showAdBlockedMessage() {
        // Only show once per session
        if (sessionStorage.getItem('adBlockedMessageShown')) return;
        
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(26, 26, 46, 0.9);
            color: #d4af37;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 1000;
            border: 1px solid rgba(212, 175, 55, 0.3);
            max-width: 250px;
        `;
        message.innerHTML = '🔮 Ad blockers may prevent revenue generation. Consider whitelisting this site.';
        
        document.body.appendChild(message);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
        
        sessionStorage.setItem('adBlockedMessageShown', 'true');
    }

    showPostReadingAd() {
        const postReadingAd = document.querySelector('.google-ad-post-reading');
        if (postReadingAd) {
            // Ensure the container is visible before trying to show ads
            const rect = postReadingAd.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            
            if (isVisible) {
                // Check if ad has content before showing
                setTimeout(() => {
                    this.checkAndShowAd(postReadingAd);
                }, 1000);
            } else {
                console.log('Post-reading ad container not visible, skipping ad display');
            }
        }
    }

    toggleReadingType(readingType) {
        const questionInput = document.getElementById('questionInput');
        const generalReadingInfo = document.getElementById('generalReadingInfo');
        const horoscopeReadingInfo = document.getElementById('horoscopeReadingInfo');
        const userQuestion = document.getElementById('userQuestion');
        
        if (readingType === 'question') {
            if (questionInput) questionInput.classList.remove('hidden');
            if (generalReadingInfo) generalReadingInfo.classList.add('hidden');
            if (horoscopeReadingInfo) horoscopeReadingInfo.classList.add('hidden');
            if (userQuestion) userQuestion.placeholder = 'Ask your question to the cards...';
        } else if (readingType === 'general') {
            if (questionInput) questionInput.classList.add('hidden');
            if (generalReadingInfo) generalReadingInfo.classList.remove('hidden');
            if (horoscopeReadingInfo) horoscopeReadingInfo.classList.add('hidden');
            if (userQuestion) userQuestion.value = '';
        } else if (readingType === 'horoscope') {
            if (questionInput) questionInput.classList.add('hidden');
            if (generalReadingInfo) generalReadingInfo.classList.add('hidden');
            if (horoscopeReadingInfo) horoscopeReadingInfo.classList.remove('hidden');
            if (userQuestion) userQuestion.value = '';
        }
    }
    
    updatePillToggleStates() {
        // Update pill toggle visual states
        document.querySelectorAll('.pill-toggle-option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    playMagicalSound() {
        // Create a subtle chime sound effect
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio not available:', error);
        }
    }
    
    toggleDarkMode() {
        const body = document.body;
        const darkModeToggle = document.getElementById('darkModeToggle');
        const toggleIcon = darkModeToggle.querySelector('.toggle-icon');
        
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            toggleIcon.textContent = 'light_mode';
            localStorage.setItem('darkMode', 'enabled');
        } else {
            toggleIcon.textContent = 'dark_mode';
            localStorage.setItem('darkMode', 'disabled');
        }
    }
    
    initializeDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        const body = document.body;
        const darkModeToggle = document.getElementById('darkModeToggle');
        const toggleIcon = darkModeToggle?.querySelector('.toggle-icon');
        
        if (savedDarkMode === 'enabled') {
            body.classList.add('dark-mode');
            if (toggleIcon) toggleIcon.textContent = 'light_mode';
        } else if (toggleIcon) {
            toggleIcon.textContent = 'dark_mode';
        }
    }

    async drawCards() {
        console.log('drawCards() called');
        console.log('Current spread:', this.currentSpread);
        
        // Play magical sound effect
        this.playMagicalSound();
        
        // Check if current spread requires premium access
        if ((this.currentSpread === 'five' || this.currentSpread === 'twelve') && !this.isPremiumUser()) {
            console.log('Premium required, showing paywall');
            this.showPaywallModal();
            return;
        }

        const readingTypeRadio = document.querySelector('input[name="readingType"]:checked');
        const readingType = readingTypeRadio ? readingTypeRadio.value : 'general';
        console.log('Reading type:', readingType);
        
        const userQuestion = document.getElementById('userQuestion');
        const question = userQuestion ? userQuestion.value.trim() : '';
        console.log('Question:', question);
        
        // If question reading is selected but no question provided, automatically switch to general reading
        if (readingType === 'question' && !question) {
            console.log('Switching to general reading');
            // Switch to general reading mode
            const generalRadio = document.querySelector('input[name="readingType"][value="general"]');
            if (generalRadio) {
                generalRadio.checked = true;
                this.toggleReadingType('general');
            }
        }

        console.log('Getting spread for:', this.currentSpread);
        const spread = tarotSpreads[this.currentSpread];
        console.log('Spread:', spread);
        
        if (!spread) {
            console.error('Spread not found for:', this.currentSpread);
            return;
        }
        
        const numCards = spread.positions.length;
        console.log('Number of cards to draw:', numCards);
        
        // Clear previous reading
        this.clearReadingData();
        
        // Show shuffling animation
        this.showShufflingAnimation();
        
        // Scroll to reading area immediately
        this.scrollToReading();
        
        // Wait 4 seconds for shuffling effect
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Draw new cards
        this.drawnCards = this.drawRandomCards(numCards);
        
        // Display cards
        this.displayCards();
        
        // Show reading area
        const readingArea = document.getElementById('readingArea');
        readingArea.classList.remove('hidden');
        readingArea.classList.add('show');
        
        // Track tarot reading event in Google Analytics
        if (typeof gtag !== 'undefined') {
            console.log('Sending tarot_reading event to Google Analytics');
            gtag('event', 'tarot_reading', {
                'event_category': 'tarot_interaction',
                'event_label': `${this.currentSpread}_${readingType}`,
                'value': numCards,
                'spread_type': this.currentSpread,
                'reading_type': readingType,
                'num_cards': numCards,
                'has_question': question ? 'yes' : 'no',
                'user_name_provided': this.userName ? 'yes' : 'no',
                'user_starsign_provided': this.userStarsign ? 'yes' : 'no'
            });
            
            // Also send as custom event
            gtag('event', 'custom_tarot_reading', {
                'custom_parameter_1': this.currentSpread,
                'custom_parameter_2': readingType,
                'custom_parameter_3': numCards,
                'custom_parameter_4': question ? 'yes' : 'no'
            });
        } else {
            console.warn('gtag function not available - Google Analytics may not be loaded');
            console.log('Data Layer available:', typeof window.dataLayer !== 'undefined');
        }
        
        // Generate interpretation based on reading type
        if (readingType === 'question') {
            if (this.chatGPTInterpreter.hasApiKey()) {
                await this.generateAIInterpretation(question);
            } else {
                await this.generateInterpretation(question);
            }
        } else if (readingType === 'horoscope') {
            // Daily horoscope reading
            if (this.chatGPTInterpreter.hasApiKey()) {
                await this.generateHoroscopeAIInterpretation();
            } else {
                await this.generateHoroscopeInterpretation();
            }
        } else {
            // General reading
            if (this.chatGPTInterpreter.hasApiKey()) {
                await this.generateGeneralAIInterpretation();
            } else {
                await this.generateGeneralInterpretation();
            }
        }
    }

    showShufflingAnimation() {
        // Show reading area with shuffling animation
        const readingArea = document.getElementById('readingArea');
        const cardsContainer = document.getElementById('cardsContainer');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        // Clear any existing content
        cardsContainer.innerHTML = '';
        readingArea.classList.remove('hidden');
        readingArea.classList.add('show');
        
        // Ensure ad container is visible for proper sizing
        const adContainer = document.querySelector('.in-content-ad');
        if (adContainer) {
            adContainer.style.display = 'block';
            adContainer.style.visibility = 'visible';
            adContainer.style.opacity = '1';
        }
        
        // Show enhanced loading indicator with progress stages
        loadingIndicator.classList.remove('hidden');
        this.showLoadingProgress(loadingIndicator);
        
        // Create shuffling card elements
        this.createShufflingCards();
    }

    showLoadingProgress(loadingIndicator) {
        const brand = getBrandConfig();
        const readerName = brand.readerName || 'Sian';
        
        const stages = [
            { icon: '🔮', text: `${readerName} is connecting with the cosmic energies...`, duration: 1500 },
            { icon: '✨', text: 'The cards are being shuffled in the mystical realm...', duration: 2000 },
            { icon: '🌟', text: 'Drawing your personalized cards from the universe...', duration: 1500 },
            { icon: '🔮', text: 'Preparing your unique reading interpretation...', duration: 1000 }
        ];
        
        let currentStage = 0;
        let progress = 0;
        
        const updateLoading = () => {
            if (currentStage < stages.length) {
                const stage = stages[currentStage];
                progress = ((currentStage + 1) / stages.length) * 100;
                
                loadingIndicator.innerHTML = `
                    <div class="enhanced-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-glow"></div>
                        <div class="spinner-center">${stage.icon}</div>
                    </div>
                    <div class="loading-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${Math.round(progress)}%</div>
                    </div>
                    <p class="loading-message">${stage.text}</p>
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                `;
                
                currentStage++;
                setTimeout(updateLoading, stage.duration);
            }
        };
        
        updateLoading();
    }

    createShufflingCards() {
        const cardsContainer = document.getElementById('cardsContainer');
        const spread = tarotSpreads[this.currentSpread];
        const numCards = spread.positions.length;
        
        // Center the shuffling animation
        cardsContainer.classList.add('shuffling');
        
        // Add special class for single card spreads
        if (numCards === 1) {
            cardsContainer.classList.add('single-card');
        }
        
        // Create more sets of cards for enhanced shuffling effect
        const numSets = 8; // Increased from 6 to 8 for more dramatic effect
        const totalShufflingCards = numCards * numSets;
        
        // Create different animation types for variety
        const animationTypes = ['shuffleCard', 'shuffleCard2', 'shuffleCard3'];
        
        for (let set = 0; set < numSets; set++) {
            for (let i = 0; i < numCards; i++) {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'shuffling-card';
                
                // Create image element for plaid card back
                const cardImage = document.createElement('img');
                cardImage.src = './images/cards/card-back-plaid.png';
                cardImage.alt = 'Card back';
                cardImage.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 8px;
                `;
                
                // Add error handling for image loading
                cardImage.onerror = function() {
                    console.error('Failed to load card back image:', cardImage.src);
                    // Fallback to gradient background
                    cardDiv.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
                };
                
                cardImage.onload = function() {
                    console.log('Card back image loaded successfully');
                };
                
                // Calculate centered positioning with overlap
                const cardWidth = 140;
                const cardHeight = 210;
                const overlapAmount = 25; // Slightly reduced overlap for better visibility
                const cardSpacing = cardWidth - overlapAmount;
                
                // Center the entire group of cards
                const totalWidth = (totalShufflingCards * cardSpacing) + overlapAmount;
                let startX = -totalWidth / 2;
                
                // Special handling for single card to ensure perfect centering
                if (numCards === 1) {
                    startX = -cardWidth / 2; // Center single card perfectly
                }
                
                // Enhanced randomness for more natural shuffling
                const randomOffsetX = (Math.random() - 0.5) * 30; // ±15px random horizontal offset
                const randomOffsetY = (Math.random() - 0.5) * 20; // ±10px random vertical offset
                const randomRotation = (Math.random() - 0.5) * 10; // ±5 degrees random rotation
                
                const cardIndex = i + (set * numCards);
                const baseX = startX + (cardIndex * cardSpacing);
                const baseY = (set * 6) - 25; // Reduced vertical stacking for more spread
                
                // Select random animation type
                const animationType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
                
                // Vary animation duration and delay for more organic movement
                const animationDuration = 0.8 + Math.random() * 1.2; // 0.8-2.0 seconds
                const animationDelay = Math.random() * 1.5; // 0-1.5 seconds delay
                
                cardDiv.style.cssText = `
                    position: absolute;
                    width: 140px;
                    height: 210px;
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    border: 2px solid #d4af37;
                    border-radius: 12px;
                    left: ${baseX + randomOffsetX}px;
                    top: ${baseY + randomOffsetY}px;
                    transform: rotate(${randomRotation}deg);
                    animation: ${animationType} ${animationDuration}s ease-in-out infinite;
                    animation-delay: ${animationDelay}s;
                    z-index: ${25 - set - (i * 0.3)}; // More dynamic z-index
                    overflow: hidden;
                    transform-origin: center center;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                `;
                
                cardDiv.appendChild(cardImage);
                cardsContainer.appendChild(cardDiv);
            }
        }
    }

    scrollToReading() {
        const readingArea = document.getElementById('readingArea');
        const readingTitle = readingArea.querySelector('h3');
        
        if (readingTitle) {
            // Add highlight class for visual effect
            readingArea.classList.add('scroll-highlight');
            
            // Smooth scroll to the reading title
            readingTitle.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
            
            // Add a subtle scale animation to the reading area
            if (readingArea) {
                readingArea.style.transform = 'scale(1.02)';
                readingArea.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
                
                // Reset scale and remove highlight after animation
                setTimeout(() => {
                    readingArea.style.transform = 'scale(1)';
                    readingArea.classList.remove('scroll-highlight');
                }, 800);
            }
        }
    }

    drawRandomCards(numCards) {
        const drawnCards = [];
        const availableCards = [...this.allCards];
        
        for (let i = 0; i < numCards; i++) {
            const randomIndex = Math.floor(Math.random() * availableCards.length);
            const card = availableCards.splice(randomIndex, 1)[0];
            
            // Randomly determine if card is reversed (30% chance)
            const isReversed = Math.random() < 0.3;
            
            drawnCards.push({
                ...card,
                isReversed: isReversed,
                position: tarotSpreads[this.currentSpread].positions[i]
            });
        }
        
        return drawnCards;
    }

    displayCards() {
        const cardsContainer = document.getElementById('cardsContainer');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        // Hide loading indicator and clear shuffling animation
        loadingIndicator.classList.add('hidden');
        cardsContainer.classList.remove('shuffling', 'single-card');
        cardsContainer.innerHTML = '';
        
        if (this.currentSpread === 'twelve') {
            this.displayTwelveMonth(cardsContainer);
        } else {
            this.drawnCards.forEach((card, index) => {
                const cardElement = this.createCardElement(card, index);
                cardsContainer.appendChild(cardElement);
            });
        }
    }

    displayTwelveMonth(cardsContainer) {
        // Create the 12-month container
        const monthContainer = document.createElement('div');
        monthContainer.className = 'twelve-month-container';
        
        // Create 3 rows of 4 months each
        for (let row = 0; row < 3; row++) {
            const monthRow = document.createElement('div');
            monthRow.className = 'month-row';
            
            for (let col = 0; col < 4; col++) {
                const cardIndex = row * 4 + col;
                if (cardIndex < this.drawnCards.length) {
                    const cardElement = this.createCardElement(this.drawnCards[cardIndex], cardIndex);
                    cardElement.classList.add('month-card');
                    monthRow.appendChild(cardElement);
                }
            }
            
            monthContainer.appendChild(monthRow);
        }
        
        cardsContainer.appendChild(monthContainer);
    }

    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.isReversed ? 'reversed' : ''}`;
        
        // Add flipping animation with staggered effect
        cardDiv.classList.add('flipping', 'card-drawing');
        setTimeout(() => {
            cardDiv.classList.remove('flipping');
            cardDiv.classList.add('card-drawn');
        }, index * 150 + 300);
        
        // Create card image
        const cardImage = document.createElement('img');
        cardImage.className = 'card-image';
        cardImage.alt = `${card.name} - ${card.isReversed ? 'Reversed' : 'Upright'}`;
        cardImage.loading = 'lazy';
        
        // Set image source based on card
        const imageUrl = this.getCardImageUrl(card);
        console.log('Loading card image:', card.name, 'URL:', imageUrl);
        cardImage.src = imageUrl;
        
        // Add error handling for missing images
        cardImage.onerror = () => {
            console.log('Card image failed to load:', imageUrl);
            this.createTextBasedCard(cardDiv, card);
        };
        
        cardImage.onload = () => {
            console.log('Card image loaded successfully:', imageUrl);
        };
        
        // Create card name that goes above the card
        const nameDiv = document.createElement('div');
        nameDiv.className = 'card-name-display';
        nameDiv.textContent = card.name + (card.isReversed ? ' (Reversed)' : '');
        
        // Create position label that goes below the card
        const positionDiv = document.createElement('div');
        positionDiv.className = 'card-position';
        positionDiv.textContent = card.position.name;
        
        cardDiv.appendChild(cardImage);
        cardDiv.appendChild(nameDiv);
        cardDiv.appendChild(positionDiv);
        
        // Add click and keyboard event for card details
        const handleCardInteraction = () => {
            // Track card click event in Google Analytics
            if (typeof gtag !== 'undefined') {
                console.log('Sending card_clicked event to Google Analytics');
                gtag('event', 'card_clicked', {
                    'event_category': 'tarot_interaction',
                    'event_label': card.name,
                    'card_name': card.name,
                    'card_orientation': card.isReversed ? 'reversed' : 'upright',
                    'card_position': card.position.name,
                    'card_type': card.type,
                    'spread_type': this.currentSpread
                });
            } else {
                console.warn('gtag function not available - Google Analytics may not be loaded');
            }
            this.showCardDetails(card);
        };
        
        cardDiv.addEventListener('click', handleCardInteraction);
        cardDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardInteraction();
            }
        });
        
        // Make card focusable and accessible
        cardDiv.setAttribute('tabindex', '0');
        cardDiv.setAttribute('role', 'button');
        cardDiv.setAttribute('aria-label', `${card.name} ${card.isReversed ? 'reversed' : 'upright'} card in ${card.position.name} position. Click to view details.`);
        
        return cardDiv;
    }

    getImageName(card) {
        // Convert card name to URL-friendly format
        const cardName = card.name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/the-/g, ''); // Remove "the" prefix
        
        // Handle special cases for Rider-Waite deck
        const specialCases = {
            'fool': '00-fool',
            'magician': '01-magician',
            'high-priestess': '02-high-priestess',
            'empress': '03-empress',
            'emperor': '04-emperor',
            'hierophant': '05-hierophant',
            'lovers': '06-lovers',
            'chariot': '07-chariot',
            'strength': '08-strength',
            'hermit': '09-hermit',
            'wheel-of-fortune': '10-wheel-of-fortune',
            'justice': '11-justice',
            'hanged-man': '12-hanged-man',
            'death': '13-death',
            'temperance': '14-temperance',
            'devil': '15-devil',
            'tower': '16-tower',
            'star': '17-star',
            'moon': '18-moon',
            'sun': '19-sun',
            'judgement': '20-judgement',
            'world': '21-world'
        };
        
        let imageName = specialCases[cardName] || cardName;
        
        // Add suit prefix for minor arcana
        if (card.type !== 'major') {
            const suitPrefix = card.suit.toLowerCase().replace(/\s+/g, '-');
            imageName = `${suitPrefix}-${imageName}`;
        }
        
        return imageName;
    }

    getCardImageUrl(card) {
        // Use local Rider-Waite card images with aggressive cache busting
        const fileName = this.getCardFileName(card);
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const localUrl = `./images/cards/${fileName}-${card.isReversed ? 'reversed' : 'upright'}.png?v=${timestamp}&r=${random}`;
        
        // Return local URL as primary source
        return localUrl;
    }


    getCardFileName(card) {
        if (card.type === 'major') {
            // Major Arcana: "the-fool", "the-magician", etc.
            return card.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        } else {
            // Minor Arcana: "cups-1", "wands-2", etc.
            return `${card.suit.toLowerCase()}-${card.number}`;
        }
    }

    createCardDataUrl(card, cardNumber, suit) {
        try {
            // Create a simple SVG representation of the card
            const lightColor = card.type === 'major' ? '#8a2be2' : this.getSuitColor(suit);
            const darkColor = card.type === 'major' ? '#6a1b9a' : this.getSuitColor(suit, true);
            const reversedText = card.isReversed ? '<text x="60" y="160" text-anchor="middle" fill="#d4af37" font-family="Arial" font-size="10">REVERSED</text>' : '';
            
            const svg = `<svg width="120" height="180" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${lightColor};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${darkColor};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="120" height="180" fill="url(#bg)" rx="15" stroke="#d4af37" stroke-width="3"/>
                <text x="60" y="30" text-anchor="middle" fill="#d4af37" font-family="Arial" font-size="12" font-weight="bold">${card.position.name}</text>
                <text x="60" y="60" text-anchor="middle" fill="#fff" font-family="Arial" font-size="14" font-weight="bold">${card.name}</text>
                <text x="60" y="100" text-anchor="middle" fill="#d4af37" font-family="Arial" font-size="24">${card.symbol}</text>
                <text x="60" y="140" text-anchor="middle" fill="#b8b8b8" font-family="Arial" font-size="12">${card.type === 'major' ? cardNumber : cardNumber + ' of ' + card.suit}</text>
                ${reversedText}
            </svg>`;
            
            return `data:image/svg+xml;base64,${btoa(svg)}`;
        } catch (error) {
            console.error('Error creating SVG card:', error);
            return null;
        }
    }

    getSuitColor(suit, isDark = false) {
        const colors = {
            'cups': isDark ? '#357abd' : '#4a90e2',
            'wands': isDark ? '#c0392b' : '#e74c3c',
            'swords': isDark ? '#7f8c8d' : '#95a5a6',
            'pentacles': isDark ? '#e67e22' : '#f39c12'
        };
        return colors[suit] || (isDark ? '#34495e' : '#2c3e50');
    }

    createTextBasedCard(cardDiv, card) {
        // Fallback method if image fails to load
        cardDiv.innerHTML = '';
        cardDiv.className = `card text-based ${card.isReversed ? 'reversed' : ''}`;
        
        // Add background based on card type
        if (card.type === 'major') {
            cardDiv.style.background = 'linear-gradient(145deg, #8a2be2, #6a1b9a)';
        } else {
            const suitColors = {
                'Cups': 'linear-gradient(145deg, #4a90e2, #357abd)',
                'Wands': 'linear-gradient(145deg, #e74c3c, #c0392b)',
                'Swords': 'linear-gradient(145deg, #95a5a6, #7f8c8d)',
                'Pentacles': 'linear-gradient(145deg, #f39c12, #e67e22)'
            };
            cardDiv.style.background = suitColors[card.suit] || 'linear-gradient(145deg, #2c3e50, #34495e)';
        }
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'card-name';
        nameDiv.textContent = card.name;
        
        const symbolDiv = document.createElement('div');
        symbolDiv.className = 'card-suit';
        symbolDiv.textContent = card.symbol;
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'card-number';
        numberDiv.textContent = card.type === 'major' ? card.number : `${card.number} of ${card.suit}`;
        
        const positionDiv = document.createElement('div');
        positionDiv.className = 'card-position';
        positionDiv.textContent = card.position.name;
        
        cardDiv.appendChild(nameDiv);
        cardDiv.appendChild(symbolDiv);
        cardDiv.appendChild(numberDiv);
        cardDiv.appendChild(positionDiv);
    }

    async showCardDetails(card) {
        const userQuestion = document.getElementById('userQuestion');
        const question = userQuestion ? userQuestion.value.trim() : '';
        
        if (this.chatGPTInterpreter.hasApiKey() && question) {
            try {
                const loadingDiv = document.createElement('div');
                const brand = getBrandConfig();
                const readerName = brand.readerName || 'Sian';
                
                loadingDiv.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div class="spinner" style="margin: 0 auto 10px;"></div>
                        <p>🔮 ${readerName} is interpreting this card...</p>
                    </div>
                `;
                
                // Show loading in a modal-like overlay
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                `;
                overlay.appendChild(loadingDiv);
                document.body.appendChild(overlay);
                
                const aiInterpretation = await this.chatGPTInterpreter.generateCardSpecificInterpretation(card, question, this.userName);
                document.body.removeChild(overlay);
                
                const formattedInterpretation = this.formatAIResponse(aiInterpretation);
                this.showCardModal(card, formattedInterpretation);
            } catch (error) {
                console.error('AI interpretation failed:', error);
                const interpretation = card.isReversed ? card.reversed : card.upright;
                const orientation = card.isReversed ? 'Reversed' : 'Upright';
                alert(`${card.name} (${orientation})\n\n${interpretation}\n\n(AI interpretation unavailable)`);
            }
        } else {
            const interpretation = card.isReversed ? card.reversed : card.upright;
            const orientation = card.isReversed ? 'Reversed' : 'Upright';
            alert(`${card.name} (${orientation})\n\n${interpretation}`);
        }
    }

    showCardModal(card, aiInterpretation) {
        const orientation = card.isReversed ? 'Reversed' : 'Upright';
        const cardImageUrl = this.getCardImageUrl(card);
        const shortOverview = card.isReversed ? card.reversed : card.upright;
        
        const modal = document.createElement('div');
        modal.className = 'card-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border: 2px solid #d4af37;
                border-radius: 15px;
                padding: 40px;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                margin: 20px;
                color: #e8e8e8;
                font-family: 'Cormorant Garamond', serif;
                font-size: 18px;
                line-height: 1.8;
            ">
                <h3 style="
                    font-family: 'Cinzel', serif;
                    color: #d4af37;
                    margin-bottom: 25px;
                    text-align: center;
                    font-size: 1.8rem;
                ">${card.name} (${orientation})</h3>
                
                <div style="
                    display: flex;
                    gap: 30px;
                    margin-bottom: 25px;
                    align-items: flex-start;
                ">
                    <div style="
                        flex: 0 0 200px;
                        text-align: center;
                    ">
                        <img src="${cardImageUrl}" 
                             alt="${card.name}" 
                             style="
                                width: 200px;
                                height: auto;
                                border-radius: 10px;
                                border: 2px solid rgba(212, 175, 55, 0.5);
                                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                                margin-bottom: 15px;
                             "
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                        />
                        <div style="
                            display: none;
                            width: 200px;
                            height: 300px;
                            background: linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%);
                            border: 2px solid rgba(212, 175, 55, 0.5);
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #d4af37;
                            font-size: 14px;
                            text-align: center;
                            padding: 20px;
                        ">
                            Card Image<br>Unavailable
                        </div>
                    </div>
                    
                    <div style="
                        flex: 1;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(212, 175, 55, 0.3);
                        border-radius: 10px;
                        padding: 25px;
                    ">
                        <h4 style="
                            color: #d4af37;
                            font-family: 'Cinzel', serif;
                            font-size: 1.3rem;
                            margin-bottom: 15px;
                        ">Quick Overview</h4>
                        <p style="
                            font-size: 1rem;
                            line-height: 1.6;
                            margin-bottom: 20px;
                            color: #e8e8e8;
                        ">${shortOverview}</p>
                    </div>
                </div>
                
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(212, 175, 55, 0.3);
                    border-radius: 10px;
                    padding: 30px;
                    margin-bottom: 25px;
                    line-height: 1.8;
                    font-size: 1.1rem;
                ">
                    <h4 style="
                        color: #d4af37;
                        font-family: 'Cinzel', serif;
                        font-size: 1.3rem;
                        margin-bottom: 15px;
                    ">${getBrandConfig().readerName || 'Sian'}'s Detailed Interpretation</h4>
                    ${aiInterpretation}
                </div>
                
                <button class="modal-close-btn" style="
                    background: #d4af37;
                    color: #1a1a2e;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.1rem;
                    font-weight: 600;
                    display: block;
                    margin: 0 auto;
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">Close</button>
            </div>
        `;
        
        // Add event listener for close button
        const closeBtn = modal.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Add event listener to close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Add escape key listener
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        document.body.appendChild(modal);
    }

    async generateGeneralAIInterpretation() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const interpretationDiv = document.getElementById('interpretation');
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        interpretationDiv.innerHTML = '';
        
        try {
            const spread = tarotSpreads[this.currentSpread];
            const aiInterpretation = await this.chatGPTInterpreter.generateGeneralTarotInterpretation(this.drawnCards, spread, this.userName, this.userStarsign);
            
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
            
            // Format AI interpretation with proper paragraphs
            const formattedInterpretation = this.formatAIResponse(aiInterpretation);
            
            // Display AI interpretation
            let personalInfoHTML = '';
            if (this.userName) {
                personalInfoHTML += `<p><strong>Reading for:</strong> ${this.userName}</p>`;
            }
            
            interpretationDiv.innerHTML = `
                <h4>🔮 ${getBrandConfig().readerName || 'Sian'}'s General Reading</h4>
                <p><strong>Reading Type:</strong> General Life Guidance</p>
                <p><strong>Spread:</strong> ${spread.name}</p>
                ${personalInfoHTML}
                <!-- Speech controls removed -->
                <hr>
                <div style="
                    background: rgba(212, 175, 55, 0.1);
                    border-left: 4px solid #d4af37;
                    padding: 30px;
                    margin: 25px 0;
                    border-radius: 0 10px 10px 0;
                    line-height: 1.8;
                    font-size: 1.2rem;
                ">
                    ${formattedInterpretation}
                </div>
            `;
            
            // Speech functionality removed
            
            // Show share button after reading is complete (if enabled)
            if (window.AskSianConfig?.features?.emailSharing) {
                await this.showShareButton();
            }
        } catch (error) {
            console.error('AI interpretation failed:', error);
            loadingIndicator.classList.add('hidden');
            
            // Fallback to regular interpretation
            await this.generateGeneralInterpretation();
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                background: rgba(255, 0, 0, 0.1);
                border: 1px solid rgba(255, 0, 0, 0.3);
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                color: #ff6b6b;
            `;
            errorDiv.innerHTML = `
                <strong>AI Interpretation Unavailable</strong><br>
                ${error.message}. Showing standard interpretation instead.
            `;
            interpretationDiv.insertBefore(errorDiv, interpretationDiv.firstChild);
        }
    }

    async generateGeneralInterpretation() {
        const interpretationDiv = document.getElementById('interpretation');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const spread = tarotSpreads[this.currentSpread];
        
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
        
        let interpretationHTML = `
            <h4>General Life Reading</h4>
            <p><strong>Reading Type:</strong> General Life Guidance</p>
            <p><strong>Spread:</strong> ${spread.name}</p>
            <p><strong>Description:</strong> ${spread.description}</p>
        `;
        
        if (this.userName) {
            interpretationHTML += `<p><strong>Reading for:</strong> ${this.userName}</p>`;
        }
        
        
        interpretationHTML += `<hr>`;
        
        this.drawnCards.forEach((card, index) => {
            const position = card.position;
            const interpretation = card.isReversed ? card.reversed : card.upright;
            const orientation = card.isReversed ? 'Reversed' : 'Upright';
            
            interpretationHTML += `
                <div style="margin-bottom: 30px; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border-left: 3px solid #d4af37;">
                    <h4 style="color: #d4af37; margin-bottom: 15px;">${position.name} - ${card.name} (${orientation})</h4>
                    <p style="margin-bottom: 12px; font-size: 1.1rem;"><strong>Position Meaning:</strong> ${position.description}</p>
                    <p style="margin-bottom: 0; font-size: 1.1rem; line-height: 1.7;"><strong>Card Interpretation:</strong> ${interpretation}</p>
                </div>
            `;
        });
        
        // Add overall reading summary
        interpretationHTML += this.generateOverallReading();
        
        interpretationDiv.innerHTML = interpretationHTML;
        
        // Show share button after reading is complete
        await this.showShareButton();
    }

    async generateHoroscopeInterpretation() {
        const interpretationDiv = document.getElementById('interpretation');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const spread = tarotSpreads[this.currentSpread];
        const today = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
        
        let interpretationHTML = `
            <h4>🌟 Daily Horoscope Reading</h4>
            <p><strong>Date:</strong> ${today}</p>
            <p><strong>Reading Type:</strong> Daily Horoscope</p>
            <p><strong>Spread:</strong> ${spread.name}</p>
            <p><strong>Description:</strong> ${spread.description}</p>
        `;
        
        if (this.userName) {
            interpretationHTML += `<p><strong>Reading for:</strong> ${this.userName}</p>`;
        }
        
        if (this.userStarsign) {
            interpretationHTML += `<p><strong>Star Sign:</strong> ${this.userStarsign}</p>`;
        }
        
        interpretationHTML += `<hr>`;
        
        this.drawnCards.forEach((card, index) => {
            const position = card.position;
            const interpretation = card.isReversed ? card.reversed : card.upright;
            const orientation = card.isReversed ? 'Reversed' : 'Upright';
            
            interpretationHTML += `
                <div style="margin-bottom: 30px; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border-left: 3px solid #d4af37;">
                    <h4 style="color: #d4af37; margin-bottom: 15px;">${position.name} - ${card.name} (${orientation})</h4>
                    <p style="margin-bottom: 12px; font-size: 1.1rem;"><strong>Position Meaning:</strong> ${position.description}</p>
                    <p style="margin-bottom: 0; font-size: 1.1rem; line-height: 1.7;"><strong>Card Interpretation:</strong> ${interpretation}</p>
                </div>
            `;
        });
        
        // Add horoscope-specific summary
        interpretationHTML += this.generateHoroscopeSummary();
        
        interpretationDiv.innerHTML = interpretationHTML;
        
        // Show share button after reading is complete
        await this.showShareButton();
    }

    generateHoroscopeSummary() {
        const today = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        let summary = `
            <div style="
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
                border: 2px solid #d4af37;
                border-radius: 12px;
                padding: 25px;
                margin: 25px 0;
                text-align: center;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
            ">
                <h4 style="
                    color: #d4af37;
                    font-family: 'Cinzel', serif;
                    font-size: 1.4rem;
                    margin: 0 0 15px 0;
                    font-weight: 600;
                ">🌟 Today's Cosmic Guidance</h4>
                <p style="margin-bottom: 15px; font-size: 1.2rem; line-height: 1.7; color: #e8e8e8;">
                    The cards reveal what the universe has in store for you today, ${this.userName ? this.userName : 'dear seeker'}. 
                    ${this.userStarsign ? `As a ${this.userStarsign}, your unique cosmic energy influences how these energies manifest in your life.` : 'Your personal energy influences how these cosmic messages apply to your day.'}
                </p>
        `;
        
        // Add daily guidance based on cards
        const reversedCards = this.drawnCards.filter(card => card.isReversed).length;
        const majorArcanaCards = this.drawnCards.filter(card => card.suit === 'Major Arcana').length;
        
        if (majorArcanaCards > 0) {
            summary += `<p style="margin-bottom: 15px; font-size: 1.1rem; line-height: 1.7; color: #d4af37; font-weight: 500;">
                <strong>🌟 Major Cosmic Influences:</strong> ${majorArcanaCards} Major Arcana card${majorArcanaCards > 1 ? 's' : ''} indicate significant spiritual and karmic energies at play today.
            </p>`;
        }
        
        if (reversedCards > 0) {
            summary += `<p style="margin-bottom: 15px; font-size: 1.1rem; line-height: 1.7; color: #d4af37; font-weight: 500;">
                <strong>🔄 Internal Focus:</strong> ${reversedCards} reversed card${reversedCards > 1 ? 's' : ''} suggest today is about inner reflection and personal growth.
            </p>`;
        }
        
        summary += `
                <p style="margin-bottom: 0; font-size: 1.1rem; line-height: 1.7; color: #e8e8e8; font-style: italic;">
                    Trust the cosmic flow and let the universe guide your steps today. The stars are aligned in your favor!
                </p>
            </div>
        `;
        
        return summary;
    }

    async generateHoroscopeAIInterpretation() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const interpretationDiv = document.getElementById('interpretation');
        const today = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        interpretationDiv.innerHTML = '';
        
        try {
            const spread = tarotSpreads[this.currentSpread];
            const aiInterpretation = await this.chatGPTInterpreter.generateHoroscopeInterpretation(this.drawnCards, spread, this.userName, this.userStarsign);
            
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
            
            // Format AI interpretation with proper paragraphs
            const formattedInterpretation = this.formatAIResponse(aiInterpretation);
            
            // Display AI interpretation
            let personalInfoHTML = '';
            if (this.userName) {
                personalInfoHTML += `<p><strong>Reading for:</strong> ${this.userName}</p>`;
            }
            if (this.userStarsign) {
                personalInfoHTML += `<p><strong>Star Sign:</strong> ${this.userStarsign}</p>`;
            }
            
            interpretationDiv.innerHTML = `
                <h4>🌟 ${getBrandConfig().readerName || 'Sian'}'s Daily Horoscope</h4>
                <p><strong>Date:</strong> ${today}</p>
                <p><strong>Reading Type:</strong> Daily Horoscope</p>
                <p><strong>Spread:</strong> ${spread.name}</p>
                ${personalInfoHTML}
                <!-- Speech controls removed -->
                <hr>
                <div style="
                    background: rgba(212, 175, 55, 0.1);
                    border-left: 4px solid #d4af37;
                    padding: 30px;
                    margin: 25px 0;
                    border-radius: 0 10px 10px 0;
                    line-height: 1.8;
                    font-size: 1.2rem;
                ">
                    ${formattedInterpretation}
                </div>
            `;
            
            // Speech functionality removed
            
            // Show share button after reading is complete (if enabled)
            if (window.AskSianConfig?.features?.emailSharing) {
                await this.showShareButton();
            }
        } catch (error) {
            console.error('AI horoscope interpretation failed:', error);
            loadingIndicator.classList.add('hidden');
            
            // Fallback to regular horoscope interpretation
            await this.generateHoroscopeInterpretation();
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                background: rgba(255, 0, 0, 0.1);
                border: 1px solid rgba(255, 0, 0, 0.3);
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                color: #ff6b6b;
            `;
            errorDiv.innerHTML = `
                <strong>AI Horoscope Unavailable</strong><br>
                ${error.message}. Showing standard horoscope interpretation instead.
            `;
            interpretationDiv.appendChild(errorDiv);
        }
    }

    async generateInterpretation(question) {
        const interpretationDiv = document.getElementById('interpretation');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const spread = tarotSpreads[this.currentSpread];
        
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
        
        let interpretationHTML = `
            <h4>Your Question: "${question}"</h4>
            <p><strong>Spread:</strong> ${spread.name}</p>
            <p><strong>Description:</strong> ${spread.description}</p>
        `;
        
        if (this.userName) {
            interpretationHTML += `<p><strong>Reading for:</strong> ${this.userName}</p>`;
        }
        
        
        interpretationHTML += `<hr>`;
        
        this.drawnCards.forEach((card, index) => {
            const position = card.position;
            const interpretation = card.isReversed ? card.reversed : card.upright;
            const orientation = card.isReversed ? 'Reversed' : 'Upright';
            
            interpretationHTML += `
                <div style="margin-bottom: 30px; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border-left: 3px solid #d4af37;">
                    <h4 style="color: #d4af37; margin-bottom: 15px;">${position.name} - ${card.name} (${orientation})</h4>
                    <p style="margin-bottom: 12px; font-size: 1.1rem;"><strong>Position Meaning:</strong> ${position.description}</p>
                    <p style="margin-bottom: 0; font-size: 1.1rem; line-height: 1.7;"><strong>Card Interpretation:</strong> ${interpretation}</p>
                </div>
            `;
        });
        
        // Add overall reading summary
        interpretationHTML += this.generateOverallReading();
        
        interpretationDiv.innerHTML = interpretationHTML;
        
        // Show share button after reading is complete
        await this.showShareButton();
    }

    generateOverallReading() {
        const majorArcanaCount = this.drawnCards.filter(card => card.type === 'major').length;
        const reversedCount = this.drawnCards.filter(card => card.isReversed).length;
        
        let summary = '<hr><h4>Overall Reading Summary</h4>';
        
        // Major Arcana influence
        if (majorArcanaCount > 0) {
            summary += `<p style="margin-bottom: 15px; font-size: 1.1rem; line-height: 1.7;"><strong>Major Arcana Influence:</strong> ${majorArcanaCount} major arcana card(s) appeared, indicating significant life lessons and spiritual growth opportunities.</p>`;
        }
        
        // Reversed cards
        if (reversedCount > 0) {
            summary += `<p style="margin-bottom: 15px; font-size: 1.1rem; line-height: 1.7;"><strong>Reversed Cards:</strong> ${reversedCount} card(s) appeared reversed, suggesting internal work or challenges that need attention.</p>`;
        }
        
        // Suit analysis
        const suitCounts = { Cups: 0, Wands: 0, Swords: 0, Pentacles: 0 };
        this.drawnCards.forEach(card => {
            if (card.suit && suitCounts.hasOwnProperty(card.suit)) {
                suitCounts[card.suit]++;
            }
        });
        
        const dominantSuit = Object.entries(suitCounts).reduce((a, b) => suitCounts[a[0]] > suitCounts[b[0]] ? a : b);
        if (dominantSuit[1] > 0) {
            const suitMeanings = {
                'Cups': 'emotional matters, relationships, and intuition',
                'Wands': 'creativity, passion, and action',
                'Swords': 'thoughts, communication, and challenges',
                'Pentacles': 'material matters, work, and practical concerns'
            };
            summary += `<p style="margin-bottom: 15px; font-size: 1.1rem; line-height: 1.7;"><strong>Dominant Element:</strong> ${dominantSuit[0]} cards suggest focus on ${suitMeanings[dominantSuit[0]]}.</p>`;
        }
        
        
        summary += '<p style="margin-top: 25px; font-style: italic; color: #b8b8b8; font-size: 1.1rem; line-height: 1.7; padding: 20px; background: rgba(212, 175, 55, 0.1); border-radius: 10px; border-left: 4px solid #d4af37;"><em>Remember: Tarot cards offer guidance and insight, but the power to create your future lies within you. Trust your intuition and take inspired action.</em></p>';
        
        return summary;
    }

    async generateAIInterpretation(question) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const interpretationDiv = document.getElementById('interpretation');
        
        // Check if API key is available
        if (!this.chatGPTInterpreter.hasApiKey()) {
            console.error('❌ No API key available for AI interpretation');
            console.log('Available sources:', {
                localStorage: !!localStorage.getItem('openai_api_key'),
                brandConfig: !!(window.BrandConfig && window.BrandConfig.openai && window.BrandConfig.openai.defaultApiKey),
                askSianConfig: !!(window.AskSianConfig && window.AskSianConfig.openai && window.AskSianConfig.openai.defaultApiKey)
            });
            this.showToast('No API key found. Please enter your OpenAI API key in the settings above, or add it to brand-config.js', 'error');
            // Fall back to regular interpretation
            await this.generateInterpretation(question);
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        interpretationDiv.innerHTML = '';
        
        try {
            console.log('🤖 Starting AI interpretation...');
            const spread = tarotSpreads[this.currentSpread];
            const aiInterpretation = await this.chatGPTInterpreter.generateTarotInterpretation(question, this.drawnCards, spread, this.userName, this.userStarsign);
            
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
            
            // Format AI interpretation with proper paragraphs
            const formattedInterpretation = this.formatAIResponse(aiInterpretation);
            
            // Display AI interpretation
            let personalInfoHTML = '';
            if (this.userName) {
                personalInfoHTML += `<p><strong>Reading for:</strong> ${this.userName}</p>`;
            }
            
            const readerName = getBrandConfig().readerName || 'Dorothy';
            interpretationDiv.innerHTML = `
                <h4>🔮 ${readerName}'s AI-Powered Reading</h4>
                <p><strong>Your Question:</strong> "${question}"</p>
                <p><strong>Spread:</strong> ${spread.name}</p>
                ${personalInfoHTML}
                <!-- Speech controls removed -->
                <hr>
                <div style="
                    background: rgba(212, 175, 55, 0.1);
                    border-left: 4px solid #d4af37;
                    padding: 30px;
                    margin: 25px 0;
                    border-radius: 0 10px 10px 0;
                    line-height: 1.8;
                    font-size: 1.2rem;
                ">
                    ${formattedInterpretation}
                </div>
            `;
            
            // Speech functionality removed
            
            // Show share button after reading is complete (if enabled)
            if (window.AskSianConfig?.features?.emailSharing) {
                await this.showShareButton();
            }
        } catch (error) {
            console.error('AI interpretation failed:', error);
            loadingIndicator.classList.add('hidden');
            
            // Fallback to regular interpretation
            await this.generateInterpretation(question);
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                background: rgba(255, 0, 0, 0.1);
                border: 1px solid rgba(255, 0, 0, 0.3);
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                color: #ff6b6b;
            `;
            errorDiv.innerHTML = `
                <strong>AI Interpretation Unavailable</strong><br>
                ${error.message}. Showing standard interpretation instead.
            `;
            interpretationDiv.insertBefore(errorDiv, interpretationDiv.firstChild);
        }
    }

    formatAIResponse(text) {
        // Split the text into paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        
        if (paragraphs.length === 0) {
            return this.formatDetailedResponse(text);
        }
        
        // Extract the first paragraph as summary
        const summary = paragraphs[0].trim();
        const detailedResponse = paragraphs.slice(1).join('\n\n');
        
        // Format the summary as a highlighted box
        const summaryHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
                border: 2px solid #d4af37;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
            ">
                <h4 style="
                    color: #d4af37;
                    font-family: 'Cinzel', serif;
                    font-size: 1.3rem;
                    margin: 0 0 10px 0;
                    font-weight: 600;
                ">Summary</h4>
                <p style="
                    font-size: 1.2rem;
                    font-weight: 500;
                    margin: 0;
                    line-height: 1.6;
                ">${summary}</p>
            </div>
        `;
        
        // Format the detailed response
        const detailedHTML = this.formatDetailedResponse(detailedResponse);
        
        return summaryHTML + detailedHTML;
    }

    formatDetailedResponse(text) {
        // Split the text into paragraphs and format them properly
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        
        return paragraphs.map(paragraph => {
            const trimmed = paragraph.trim();
            if (trimmed.length === 0) return '';
            
            // Check if it's a heading (starts with a number or is very short)
            if (/^\d+\./.test(trimmed) || trimmed.length < 50) {
                return `<h5 style="color: #d4af37; font-family: 'Cinzel', serif; font-size: 1.2rem; margin: 20px 0 15px 0;">${trimmed}</h5>`;
            }
            
            // Regular paragraph
            return `<p style="margin-bottom: 18px; line-height: 1.8;">${trimmed}</p>`;
        }).join('');
    }

    clearReading() {
        this.clearReadingData();
        
        // Refresh the page for a completely clean start
        window.location.reload();
    }
    
    clearReadingData() {
        this.drawnCards = [];
        
        const cardsContainer = document.getElementById('cardsContainer');
        if (cardsContainer) cardsContainer.innerHTML = '';
        
        const interpretation = document.getElementById('interpretation');
        if (interpretation) interpretation.innerHTML = '';
        
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        
        const readingArea = document.getElementById('readingArea');
        if (readingArea) {
            readingArea.classList.add('hidden');
            readingArea.classList.remove('show');
        }
        
        // Clear user question
        const userQuestion = document.getElementById('userQuestion');
        if (userQuestion) {
            userQuestion.value = '';
            this.updateCharCounter(0);
        }
        
        // Clear user name and star sign
        const userNameInput = document.getElementById('userName');
        if (userNameInput) {
            userNameInput.value = '';
            this.userName = '';
            localStorage.removeItem('user_name');
        }
        
        const userStarsignInput = document.getElementById('userStarsign');
        if (userStarsignInput) {
            userStarsignInput.value = '';
            this.userStarsign = '';
            localStorage.removeItem('user_starsign');
        }
    }

    initializeStickyCards() {
        // Add scroll event listener to enhance sticky behavior
        window.addEventListener('scroll', () => {
            const cardsContainer = document.querySelector('.cards-container');
            if (cardsContainer && cardsContainer.children.length > 0) {
                const scrollY = window.scrollY;
                const threshold = 100; // Start showing sticky effect after 100px scroll
                
                if (scrollY > threshold) {
                    cardsContainer.classList.add('sticky-active');
                } else {
                    cardsContainer.classList.remove('sticky-active');
                }
            }
        });
    }

    testGoogleAnalytics() {
        console.log('Testing Google Analytics connection...');
        console.log('gtag function available:', typeof gtag !== 'undefined');
        console.log('Data Layer available:', typeof window.dataLayer !== 'undefined');
        console.log('Data Layer contents:', window.dataLayer);
        
        if (typeof gtag !== 'undefined') {
            // Send a test event
            gtag('event', 'test_connection', {
                'event_category': 'debug',
                'event_label': 'GA4_connection_test',
                'value': 1
            });
            console.log('Test event sent to Google Analytics');
        } else {
            console.error('Google Analytics not properly loaded');
        }
        
        // Check if the script loaded
        const gaScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
        if (gaScript) {
            console.log('Google Analytics script found:', gaScript.src);
        } else {
            console.error('Google Analytics script not found in DOM');
        }
    }

    trackEvent(eventName, category, label, value = null) {
        if (typeof gtag !== 'undefined') {
            const eventData = {
                'event_category': category,
                'event_label': label
            };
            
            if (value !== null) {
                eventData.value = value;
            }
            
            gtag('event', eventName, eventData);
            console.log(`GA Event: ${eventName}`, eventData);
        } else {
            console.warn('Google Analytics not available for event:', eventName);
        }
    }

    // TTS functionality removed

    // TTS functionality removed

    // TTS functionality removed

    // TTS functionality removed

    // TTS functionality removed

    // ========================================
    // EMAIL SHARING FUNCTIONALITY
    // ========================================

    initializeShareFunctionality() {
        this.currentReadingId = null;
        this.shareModal = null;
        
        // Initialize share modal
        this.initializeShareModal();
        
        // Initialize floating action button
        this.initializeFloatingActionButton();
        
        // Initialize toast notifications
        this.initializeToastNotifications();
    }

    initializeShareModal() {
        this.shareModal = {
            modal: document.getElementById('shareModal'),
            closeBtn: document.getElementById('closeShareModal'),
            cancelBtn: document.getElementById('cancelShareBtn'),
            sendBtn: document.getElementById('sendShareBtn'),
            form: document.getElementById('shareEmailForm'),
            friendName: document.getElementById('friendName'),
            friendEmail: document.getElementById('friendEmail'),
            personalMessage: document.getElementById('personalMessage'),
            messageCharCount: document.getElementById('messageCharCount'),
            emailError: document.getElementById('emailError'),
            loading: document.getElementById('shareLoading'),
            success: document.getElementById('shareSuccess'),
            error: document.getElementById('shareError'),
            shareableUrl: document.getElementById('shareableUrl'),
            copyLinkBtn: document.getElementById('copyLinkBtn'),
            retryBtn: document.getElementById('retryShareBtn'),
            previewCards: document.getElementById('previewCards'),
            previewType: document.getElementById('previewType'),
            previewSpread: document.getElementById('previewSpread'),
            previewDate: document.getElementById('previewDate')
        };

        if (!this.shareModal.modal) return;

        // Event listeners
        this.shareModal.closeBtn?.addEventListener('click', () => this.closeShareModal());
        this.shareModal.cancelBtn?.addEventListener('click', () => this.closeShareModal());
        this.shareModal.sendBtn?.addEventListener('click', () => this.sendShareEmail());
        this.shareModal.copyLinkBtn?.addEventListener('click', () => this.copyShareableLink());
        this.shareModal.retryBtn?.addEventListener('click', () => this.retryShareEmail());
        
        // Form validation
        this.shareModal.friendEmail?.addEventListener('input', () => this.validateEmail());
        this.shareModal.personalMessage?.addEventListener('input', () => this.updateCharCount());
        
        // Close modal on backdrop click
        this.shareModal.modal.addEventListener('click', (e) => {
            if (e.target === this.shareModal.modal || e.target.classList.contains('modal-backdrop')) {
                this.closeShareModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.shareModal.modal.classList.contains('show')) {
                this.closeShareModal();
            }
        });
    }

    initializeFloatingActionButton() {
        this.floatingActionButton = document.getElementById('floatingActionButton');
        if (!this.floatingActionButton) return;

        const fabMainBtn = this.floatingActionButton.querySelector('.fab-main-btn');
        const fabMenu = this.floatingActionButton.querySelector('.fab-menu');
        const shareMenuItem = this.floatingActionButton.querySelector('[data-action="share"]');
        const saveMenuItem = this.floatingActionButton.querySelector('[data-action="save"]');
        const newReadingMenuItem = this.floatingActionButton.querySelector('[data-action="new"]');

        // Main FAB button click
        fabMainBtn?.addEventListener('click', () => this.toggleFabMenu());

        // Menu item clicks
        shareMenuItem?.addEventListener('click', async () => {
            await this.openShareModal();
            this.closeFabMenu();
        });

        saveMenuItem?.addEventListener('click', async () => {
            await this.saveCurrentReading();
            this.closeFabMenu();
        });

        newReadingMenuItem?.addEventListener('click', () => {
            this.startNewReading();
            this.closeFabMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.floatingActionButton.contains(e.target)) {
                this.closeFabMenu();
            }
        });
    }

    initializeToastNotifications() {
        this.toastContainer = document.getElementById('toastContainer');
    }

    async saveCurrentReading() {
        if (!this.drawnCards.length) {
            this.showToast('No reading to save', 'error');
            return;
        }

        try {
            const readingData = {
                cards: this.drawnCards,
                spreadType: this.currentSpread,
                spreadName: this.currentSpread, // Add spreadName for compatibility
                readingType: this.getCurrentReadingType(),
                question: this.getCurrentQuestion(),
                userName: this.userName,
                userStarsign: this.userStarsign,
                interpretation: this.getCurrentInterpretation(),
                personalInfo: {
                    name: this.userName || '',
                    starSign: this.userStarsign || '',
                    zodiacSign: this.userStarsign || ''
                }
            };

            this.currentReadingId = await window.readingStorage.saveReading(readingData);
            console.log('Reading saved with ID:', this.currentReadingId);
            
            // Verify the reading was saved
            if (this.currentReadingId) {
                const verifyReading = await window.readingStorage.getReading(this.currentReadingId);
                if (!verifyReading) {
                    console.error('Reading was saved but cannot be retrieved:', this.currentReadingId);
                    this.showToast('Reading saved but verification failed', 'warning');
                } else {
                    console.log('Reading verified successfully:', verifyReading);
                }
            }
            
            this.showToast('Reading saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving reading:', error);
            this.showToast('Failed to save reading', 'error');
        }
    }

    getCurrentReadingType() {
        const questionRadio = document.querySelector('input[name="readingType"][value="question"]');
        const generalRadio = document.querySelector('input[name="readingType"][value="general"]');
        const horoscopeRadio = document.querySelector('input[name="readingType"][value="horoscope"]');

        if (questionRadio?.checked) return 'question';
        if (generalRadio?.checked) return 'general';
        if (horoscopeRadio?.checked) return 'horoscope';
        return 'question';
    }

    getCurrentQuestion() {
        const questionInput = document.getElementById('userQuestion');
        return questionInput?.value?.trim() || '';
    }

    getCurrentInterpretation() {
        const interpretationDiv = document.getElementById('interpretation');
        return interpretationDiv?.innerHTML || '';
    }

    async openShareModal() {
        if (!this.drawnCards.length) {
            this.showToast('No reading to share', 'error');
            return;
        }

        // Save reading if not already saved
        if (!this.currentReadingId) {
            await this.saveCurrentReading();
        }

        this.populateShareModal();
        this.showShareModal();
        this.closeFabMenu();
        
        // Track share modal opened event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share_modal_opened', {
                'event_category': 'engagement',
                'event_label': 'email_sharing',
                'value': 1
            });
        }
    }

    populateShareModal() {
        if (!this.shareModal.modal) return;

        // Populate preview
        this.populateReadingPreview();
        
        // Reset form
        this.resetShareForm();
        
        // Show form, hide other states
        this.shareModal.form.classList.remove('hidden');
        this.shareModal.loading.classList.add('hidden');
        this.shareModal.success.classList.add('hidden');
        this.shareModal.error.classList.add('hidden');
        
        // Enable send button
        this.shareModal.sendBtn.disabled = false;
    }

    populateReadingPreview() {
        const { previewCards, previewType, previewSpread, previewDate } = this.shareModal;
        
        // Clear preview cards
        if (previewCards) {
            previewCards.innerHTML = '';
            
            // Add preview cards
            this.drawnCards.forEach(card => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'preview-card';
                cardDiv.textContent = card.symbol;
                previewCards.appendChild(cardDiv);
            });
        }

        // Set preview details
        if (previewType) {
            const readingTypes = {
                'question': 'Specific Question',
                'general': 'General Reading',
                'horoscope': 'Daily Horoscope'
            };
            previewType.textContent = readingTypes[this.getCurrentReadingType()] || 'Reading';
        }

        if (previewSpread) {
            const spreadTypes = {
                'single': 'Single Card',
                'three': 'Three Card',
                'five': 'Five Card',
                'twelve': '12 Month'
            };
            previewSpread.textContent = spreadTypes[this.currentSpread] || this.currentSpread;
        }

        if (previewDate) {
            previewDate.textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    resetShareForm() {
        this.shareModal.friendName.value = '';
        this.shareModal.friendEmail.value = '';
        this.shareModal.personalMessage.value = '';
        this.shareModal.emailError.classList.add('hidden');
        this.updateCharCount();
        this.validateEmail();
    }

    showShareModal() {
        if (!this.shareModal.modal) return;
        
        this.shareModal.modal.classList.remove('hidden');
        this.shareModal.modal.classList.add('show');
        
        // Focus on first input
        setTimeout(() => {
            this.shareModal.friendName.focus();
        }, 300);
    }

    closeShareModal() {
        if (!this.shareModal.modal) return;
        
        this.shareModal.modal.classList.remove('show');
        setTimeout(() => {
            this.shareModal.modal.classList.add('hidden');
        }, 300);
    }

    validateEmail() {
        const email = this.shareModal.friendEmail.value.trim();
        const isValid = window.emailService.validateEmail(email);
        
        this.shareModal.sendBtn.disabled = !isValid;
        
        if (email && !isValid) {
            this.shareModal.emailError.textContent = 'Please enter a valid email address';
            this.shareModal.emailError.classList.remove('hidden');
        } else {
            this.shareModal.emailError.classList.add('hidden');
        }
    }

    updateCharCount() {
        const message = this.shareModal.personalMessage.value;
        this.shareModal.messageCharCount.textContent = message.length;
        
        if (message.length > 180) {
            this.shareModal.messageCharCount.parentElement.classList.add('warning');
        } else {
            this.shareModal.messageCharCount.parentElement.classList.remove('warning');
        }
    }

    async sendShareEmail() {
        // Ensure we have a reading to share
        if (!this.drawnCards.length) {
            this.showShareError('No reading to share. Please draw cards first.');
            return;
        }

        // Save the reading if not already saved
        if (!this.currentReadingId) {
            try {
                await this.saveCurrentReading();
                // Wait a moment for the save to complete
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Error saving reading for sharing:', error);
                this.showShareError('Failed to save reading. Please try again.');
                return;
            }
        }

        // Verify reading ID exists
        if (!this.currentReadingId) {
            console.error('No reading ID available after save attempt');
            this.showShareError('Failed to save reading. Please try again.');
            return;
        }

        console.log('Attempting to generate shareable data for reading ID:', this.currentReadingId);

        // Generate shareable data (with one retry if needed)
        let readingData = await window.readingStorage.generateShareableData(this.currentReadingId);
        
        if (!readingData) {
            console.warn('First attempt to generate shareable data failed. Retrying save/get sequence...');
            try {
                await this.saveCurrentReading(); // re-save to ensure data exists
                await new Promise(resolve => setTimeout(resolve, 500));
                readingData = await window.readingStorage.generateShareableData(this.currentReadingId);
            } catch (retryError) {
                console.error('Retry save failed:', retryError);
            }
        }
        
        if (!readingData) {
            console.error('Failed to generate shareable data for reading ID:', this.currentReadingId);
            // Try to get the reading directly to debug
            const directReading = await window.readingStorage.getReading(this.currentReadingId);
            console.log('Direct reading retrieval result:', directReading);
            
            this.showShareError('Reading data not found. Please try saving the reading again.');
            return;
        }

        console.log('Shareable data generated successfully:', readingData);

        const emailData = {
            to: this.shareModal.friendEmail.value.trim(),
            friendName: this.shareModal.friendName.value.trim(),
            personalMessage: this.shareModal.personalMessage.value.trim(),
            readingData: readingData
        };

        // Show loading state
        this.shareModal.form.classList.add('hidden');
        this.shareModal.loading.classList.remove('hidden');

        try {
            const result = await window.emailService.sendEmail(emailData);
            
            if (result.success) {
                this.showShareSuccess(result.shareableUrl);
            } else {
                this.showShareError(result.error);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            this.showShareError('An unexpected error occurred. Please try again.');
        }
    }

    showShareSuccess(shareableUrl) {
        this.shareModal.loading.classList.add('hidden');
        this.shareModal.success.classList.remove('hidden');
        this.shareModal.shareableUrl.value = shareableUrl;
        
        // Show success toast
        this.showToast('Reading shared successfully!', 'success');
        
        // Track successful email sharing event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'reading_shared', {
                'event_category': 'engagement',
                'event_label': 'email_share_success',
                'value': 1
            });
        }
    }

    showShareError(errorMessage) {
        this.shareModal.loading.classList.add('hidden');
        this.shareModal.error.classList.remove('hidden');
        this.shareModal.error.querySelector('#errorMessage').textContent = errorMessage;
    }

    retryShareEmail() {
        this.shareModal.error.classList.add('hidden');
        this.shareModal.form.classList.remove('hidden');
    }

    copyShareableLink() {
        const urlInput = this.shareModal.shareableUrl;
        urlInput.select();
        urlInput.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            this.showToast('Link copied to clipboard!', 'success');
            
            // Add sparkle effect
            this.addSparkleEffect(this.shareModal.copyLinkBtn);
        } catch (error) {
            console.error('Failed to copy link:', error);
            this.showToast('Failed to copy link', 'error');
        }
    }

    addSparkleEffect(element) {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #d4af37, transparent);
            border-radius: 50%;
            pointer-events: none;
            animation: sparkle 0.6s ease-out forwards;
        `;
        
        const rect = element.getBoundingClientRect();
        sparkle.style.left = rect.left + rect.width / 2 - 10 + 'px';
        sparkle.style.top = rect.top + rect.height / 2 - 10 + 'px';
        
        document.body.appendChild(sparkle);
        
        setTimeout(() => {
            document.body.removeChild(sparkle);
        }, 600);
    }


    startNewReading() {
        this.clearReading();
        this.closeFabMenu();
        this.showToast('Starting new reading...', 'success');
    }

    toggleFabMenu() {
        if (this.floatingActionButton) {
            this.floatingActionButton.classList.toggle('active');
        }
    }

    openFabMenu() {
        if (this.floatingActionButton) {
            this.floatingActionButton.classList.add('active');
        }
    }

    closeFabMenu() {
        if (this.floatingActionButton) {
            this.floatingActionButton.classList.remove('active');
        }
    }

    async showShareButton() {
        // Automatically save the reading if not already saved
        if (!this.currentReadingId && this.drawnCards.length > 0) {
            await this.saveCurrentReading();
        }
        
        const shareSection = document.getElementById('shareReadingSection');
        if (shareSection) {
            shareSection.classList.remove('hidden');
        }
        
        // Show floating action button
        if (this.floatingActionButton) {
            this.floatingActionButton.classList.remove('hidden');
        }
    }

    hideShareButton() {
        const shareSection = document.getElementById('shareReadingSection');
        if (shareSection) {
            shareSection.classList.add('hidden');
        }
        
        // Hide floating action button
        if (this.floatingActionButton) {
            this.floatingActionButton.classList.add('hidden');
        }
    }

    showToast(message, type = 'success') {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">${message}</div>
            <button class="toast-close">&times;</button>
        `;

        this.toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto remove after 4 seconds
        setTimeout(() => {
            this.removeToast(toast);
        }, 4000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - initializing Ask Sian...');
    
    // Add a global timeout to prevent hanging
    const globalTimeout = setTimeout(() => {
        console.warn('Page initialization timeout - this may indicate a performance issue');
    }, 15000); // 15 second global timeout
    
    // Add a small delay to ensure all elements are available
    setTimeout(() => {
        try {
            window.tarotReader = new TarotReader();
            console.log('TarotReader initialized successfully');
            
            // Button initialization successful
            console.log('TarotReader and button initialization completed successfully');
            
            clearTimeout(globalTimeout);
        } catch (error) {
            console.error('Error initializing TarotReader:', error);
            clearTimeout(globalTimeout);
        }
    }, 100); // 100ms delay
});

// Add some mystical effects
document.addEventListener('DOMContentLoaded', () => {
    // Add floating particles effect
    createFloatingParticles();
    
    // Add starry background
    createStarryBackground();
});

function createFloatingParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
    `;
    document.body.appendChild(particleContainer);
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: #d4af37;
            border-radius: 50%;
            opacity: 0.6;
            animation: float ${3 + Math.random() * 4}s infinite linear;
        `;
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        
        particleContainer.appendChild(particle);
    }
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% { transform: translateY(100vh) translateX(0px); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            100% { transform: translateY(-100px) translateX(${Math.random() * 200 - 100}px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

function createStarryBackground() {
    const starContainer = document.createElement('div');
    starContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
    `;
    document.body.appendChild(starContainer);
    
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            background: #d4af37;
            border-radius: 50%;
            opacity: ${Math.random() * 0.8 + 0.2};
            animation: twinkle ${2 + Math.random() * 3}s infinite;
        `;
        
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 5 + 's';
        
        starContainer.appendChild(star);
    }
    
    // Add twinkle animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
}


// Add debug function to window for testing
window.debugAdSense = function() {
    console.log('=== AdSense Debug Info ===');
    console.log('AdSense script loaded:', typeof adsbygoogle !== 'undefined');
    console.log('Ad containers found:', document.querySelectorAll('.adsbygoogle').length);
    
    // Check if ads are visible
    const adContainers = document.querySelectorAll('.adsbygoogle');
    adContainers.forEach((ad, index) => {
        const rect = ad.getBoundingClientRect();
        const hasContent = ad.children.length > 0;
        console.log(`Ad ${index + 1}:`, {
            visible: rect.width > 0 && rect.height > 0,
            hasContent: hasContent,
            dimensions: `${rect.width}x${rect.height}`,
            position: `${rect.top},${rect.left}`,
            slot: ad.getAttribute('data-ad-slot'),
            children: ad.children.length
        });
    });
    
    console.log('Auto Ads will automatically populate ad containers when ads are available');
};

// Debug function available for manual testing via console: debugAdSense()

// ChatGPT TTS debug functions removed

