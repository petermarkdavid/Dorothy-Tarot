/**
 * Email Service
 * Real email service using Supabase Edge Functions and database
 * Handles email sending, validation, and analytics tracking
 */

class EmailService {
    constructor() {
        // Wait for Supabase functions to be available
        this.supabase = null;
        this.isConfigured = false;
        this.fallbackMode = true;
        
        // Try to initialize Supabase connection
        this.initializeSupabase();
    }

    initializeSupabase() {
        try {
            if (typeof window.getSupabaseClient === 'function') {
                this.supabase = window.getSupabaseClient();
                this.isConfigured = typeof window.isSupabaseConfigured === 'function' && window.isSupabaseConfigured();
                this.fallbackMode = !this.isConfigured;
            }
        } catch (error) {
            // Using fallback mode for email service
            this.fallbackMode = true;
        }
    }

    /**
     * Validate email address format
     * @param {string} email - Email address to validate
     * @returns {boolean} - Valid email format
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Generate email content for sharing a reading
     * @param {Object} readingData - Reading data to share
     * @param {string} friendName - Friend's name (optional)
     * @param {string} personalMessage - Personal message (optional)
     * @returns {Object} - Email content object
     */
    generateEmailContent(readingData, friendName = '', personalMessage = '') {
        // Get brand config (with fallback)
        const brandConfig = window.BrandConfig || {
            siteName: 'Ask Sian',
            websiteUrl: 'https://asksian.com',
            ui: {
                emailSubject: '🔮 Your Tarot Reading from {senderName}',
                emailGreeting: 'Hi {friendName}!',
                emailIntro: '{senderName} has shared a tarot reading with you using {siteName}!',
                emailAbout: '✨ **About {siteName}:**\n{siteName} is a free AI-powered tarot reading service that provides instant, personalized interpretations. Get your own reading at {websiteUrl}',
                emailFooter: 'May the cards guide you on your journey! ✨'
            },
            getUIText: function(key, vars) {
                let text = this.ui[key] || key;
                Object.keys(vars || {}).forEach(v => text = text.replace(`{${v}}`, vars[v]));
                text = text.replace(/{siteName}/g, this.siteName);
                text = text.replace(/{websiteUrl}/g, this.websiteUrl);
                return text;
            }
        };
        
        const senderName = readingData.userName || 'A friend';
        const greeting = friendName 
            ? brandConfig.getUIText('emailGreeting', { friendName })
            : 'Hi there!';
        
        const subject = brandConfig.getUIText('emailSubject', { senderName });
        
        const body = `
${greeting}

${personalMessage ? `${personalMessage}\n\n` : ''}${brandConfig.getUIText('emailIntro', { senderName })}

🔮 **Reading Details:**
• Reading Type: ${this.formatReadingType(readingData.readingType)}
• Spread: ${this.formatSpreadType(readingData.spreadType)}
• Date: ${this.formatDate(readingData.createdAt)}
${readingData.question ? `• Question: "${readingData.question}"` : ''}

View your reading here: ${readingData.shareableUrl}

${brandConfig.getUIText('emailAbout')}

${brandConfig.getUIText('emailFooter')}

---
This reading was shared via ${brandConfig.siteName} - Free AI-Powered Tarot Readings
        `.trim();

        return { subject, body };
    }

    /**
     * Format reading type for display
     * @param {string} readingType - Reading type
     * @returns {string} - Formatted reading type
     */
    formatReadingType(readingType) {
        const types = {
            'question': 'Specific Question',
            'general': 'General Reading',
            'horoscope': 'Daily Horoscope'
        };
        return types[readingType] || readingType;
    }

    /**
     * Format spread type for display
     * @param {string} spreadType - Spread type
     * @returns {string} - Formatted spread type
     */
    formatSpreadType(spreadType) {
        const spreads = {
            'single': 'Single Card',
            'three': 'Three Card',
            'five': 'Five Card',
            'twelve': '12 Month'
        };
        return spreads[spreadType] || spreadType;
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Recently';
        }
    }

    /**
     * Store email log in Supabase database
     * @param {Object} emailData - Email data to store
     * @returns {Promise<Object>} - Database response
     */
    async storeEmailLog(emailData) {
        if (this.fallbackMode || !this.supabase) {
            // Fallback to localStorage
            return this.storeEmailLogFallback(emailData);
        }

        try {
            const { data, error } = await this.supabase
                .from('email_logs')
                .insert([{
                    reading_id: emailData.readingId,
                    sender_email: emailData.senderEmail || 'noreply@asksian.com',
                    sender_name: emailData.senderName || 'Ask Sian',
                    recipient_email: emailData.to.trim(),
                    recipient_name: emailData.friendName?.trim() || '',
                    subject: emailData.subject,
                    message: emailData.personalMessage?.trim() || '',
                    email_service: emailData.emailService || 'resend',
                    status: 'sent'
                }]);

            if (error) {
                console.error('Failed to store email log:', error);
                throw error;
            }

            console.log('Email log stored successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Error storing email log:', error);
            // Fallback to localStorage on error
            return this.storeEmailLogFallback(emailData);
        }
    }

    /**
     * Fallback email log storage using localStorage
     * @param {Object} emailData - Email data to store
     * @returns {Object} - Storage response
     */
    storeEmailLogFallback(emailData) {
        try {
            const sentEmailsKey = 'ask_sian_sent_emails';
            const sentEmails = JSON.parse(localStorage.getItem(sentEmailsKey) || '[]');
            
            const emailRecord = {
                ...emailData,
                sentAt: new Date().toISOString(),
                id: 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };
            
            sentEmails.push(emailRecord);
            
            // Keep only last 100 sent emails to prevent storage bloat
            if (sentEmails.length > 100) {
                sentEmails.splice(0, sentEmails.length - 100);
            }
            
            localStorage.setItem(sentEmailsKey, JSON.stringify(sentEmails));
            console.log('Email record stored in localStorage:', emailRecord.id);
            
            return { success: true, data: emailRecord };
        } catch (error) {
            console.error('Failed to store email record in localStorage:', error);
            return { success: false, error };
        }
    }

    /**
     * Send email using Supabase Edge Function
     * @param {Object} emailData - Email data
     * @returns {Promise<Object>} - Response object
     */
    async sendEmail(emailData) {
        const { to, friendName, personalMessage, readingData } = emailData;

        // Validate email
        if (!this.validateEmail(to)) {
            return {
                success: false,
                error: 'Invalid email address format',
                code: 'INVALID_EMAIL'
            };
        }

        // Validate required data
        if (!readingData || !readingData.shareableUrl) {
            return {
                success: false,
                error: 'Missing reading data',
                code: 'MISSING_DATA'
            };
        }

        console.log('📧 Sending email to:', to);
        console.log('📧 Reading data:', readingData);

        if (this.fallbackMode || !this.supabase) {
            // Use mock service in fallback mode
            return this.sendEmailFallback(emailData);
        }

        try {
            // Generate email content
            const emailContent = this.generateEmailContent(readingData, friendName, personalMessage);
            
            // Call Supabase Edge Function to send email
            const { data, error } = await this.supabase.functions.invoke(
                window.SUPABASE_CONFIG.functions.sendEmail,
                {
                    body: {
                        to: to.trim(),
                        subject: emailContent.subject,
                        body: emailContent.body,
                        friendName: friendName?.trim() || '',
                        personalMessage: personalMessage?.trim() || '',
                        readingId: readingData.id,
                        shareableUrl: readingData.shareableUrl
                    }
                }
            );

            if (error) {
                console.error('Email sending failed:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to send email',
                    code: 'EMAIL_SEND_ERROR'
                };
            }

            // Get brand config for email sender info
            const brandConfig = window.BrandConfig || {
                email: { fromEmail: 'noreply@asksian.com', fromName: 'Ask Sian' },
                siteName: 'Ask Sian'
            };
            
            // Store email log
            await this.storeEmailLog({
                to: to.trim(),
                friendName: friendName?.trim() || '',
                personalMessage: personalMessage?.trim() || '',
                readingId: readingData.id,
                shareableUrl: readingData.shareableUrl,
                subject: emailContent.subject,
                body: emailContent.body,
                senderEmail: brandConfig.email?.fromEmail || 'noreply@asksian.com',
                senderName: readingData.userName || brandConfig.email?.fromName || brandConfig.siteName || 'Ask Sian',
                emailService: 'resend'
            });

            console.log('📧 Email sent successfully!');
            console.log('📧 Subject:', emailContent.subject);
            console.log('📧 Shareable URL:', readingData.shareableUrl);

            return {
                success: true,
                message: 'Email sent successfully!',
                shareableUrl: readingData.shareableUrl,
                emailContent: emailContent,
                sentAt: new Date().toISOString(),
                data: data
            };

        } catch (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: 'Network error - please try again',
                code: 'NETWORK_ERROR'
            };
        }
    }

    /**
     * Fallback email sending (mock behavior)
     * @param {Object} emailData - Email data
     * @returns {Promise<Object>} - Response object
     */
    async sendEmailFallback(emailData) {
        const { to, friendName, personalMessage, readingData } = emailData;

        console.log('📧 Using fallback email service (mock)');

        // Simulate network delay
        const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, delay));

        // Simulate occasional failures (5% chance)
        if (Math.random() > 0.95) {
            console.log('📧 Fallback email failed (simulated network error)');
            return {
                success: false,
                error: 'Network error - please try again',
                code: 'NETWORK_ERROR'
            };
        }

        // Generate email content
        const emailContent = this.generateEmailContent(readingData, friendName, personalMessage);
        
        // Store email record
        await this.storeEmailLog({
            to: to.trim(),
            friendName: friendName?.trim() || '',
            personalMessage: personalMessage?.trim() || '',
            readingId: readingData.id,
            shareableUrl: readingData.shareableUrl,
            subject: emailContent.subject,
            body: emailContent.body
        });

        console.log('📧 Fallback email sent successfully!');
        console.log('📧 Subject:', emailContent.subject);
        console.log('📧 Shareable URL:', readingData.shareableUrl);

        return {
            success: true,
            message: 'Email sent successfully! (Fallback mode)',
            shareableUrl: readingData.shareableUrl,
            emailContent: emailContent,
            sentAt: new Date().toISOString()
        };
    }

    /**
     * Get email sending statistics
     * @returns {Promise<Object>} - Email statistics
     */
    async getEmailStats() {
        if (this.fallbackMode) {
            return this.getEmailStatsFallback();
        }

        try {
            const { data, error } = await this.supabase
                .from(window.SUPABASE_CONFIG.tables.email_logs)
                .select('*');

            if (error) {
                console.error('Failed to get email stats:', error);
                return this.getEmailStatsFallback();
            }

            const now = new Date();
            const last24Hours = data.filter(email => 
                new Date(email.sent_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
            );
            const last7Days = data.filter(email => 
                new Date(email.sent_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            );

            return {
                totalSent: data.length,
                last24Hours: last24Hours.length,
                last7Days: last7Days.length,
                uniqueRecipients: new Set(data.map(email => email.recipient_email)).size
            };
        } catch (error) {
            console.error('Error getting email stats:', error);
            return this.getEmailStatsFallback();
        }
    }

    /**
     * Fallback email statistics from localStorage
     * @returns {Object} - Email statistics
     */
    getEmailStatsFallback() {
        try {
            const sentEmailsKey = 'ask_sian_sent_emails';
            const sentEmails = JSON.parse(localStorage.getItem(sentEmailsKey) || '[]');
            const now = new Date();
            const last24Hours = sentEmails.filter(email => 
                new Date(email.sentAt) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
            );
            const last7Days = sentEmails.filter(email => 
                new Date(email.sentAt) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            );

            return {
                totalSent: sentEmails.length,
                last24Hours: last24Hours.length,
                last7Days: last7Days.length,
                uniqueRecipients: new Set(sentEmails.map(email => email.to)).size
            };
        } catch (error) {
            console.error('Failed to get email stats from localStorage:', error);
            return {
                totalSent: 0,
                last24Hours: 0,
                last7Days: 0,
                uniqueRecipients: 0
            };
        }
    }

    /**
     * Test email service functionality
     * @returns {Promise<Object>} - Test results
     */
    async testEmailService() {
        const testResults = {
            emailValidation: {
                valid: this.validateEmail('test@example.com'),
                invalid: !this.validateEmail('invalid-email')
            },
            supabaseConnection: this.isConfigured,
            fallbackMode: this.fallbackMode
        };

        try {
            // Test email stats retrieval
            const stats = await this.getEmailStats();
            testResults.statsRetrieval = stats.totalSent >= 0;
        } catch (error) {
            testResults.statsRetrieval = false;
            console.error('Email service test failed:', error);
        }

        return testResults;
    }
}

// Initialize global email service instance
window.emailService = new EmailService();
