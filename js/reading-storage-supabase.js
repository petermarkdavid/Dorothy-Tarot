/**
 * Reading Storage System with Supabase
 * Manages tarot reading data in Supabase database with localStorage fallback
 * Handles CRUD operations, expiration, and shareable data generation
 */

class ReadingStorageSupabase {
    constructor() {
        this.storageKey = 'ask_sian_readings';
        this.readingExpiryDays = 30;
        
        // Check if Supabase functions are available
        if (typeof window.getSupabaseClient === 'function' && typeof window.isSupabaseConfigured === 'function') {
            this.supabase = window.getSupabaseClient();
            this.isConfigured = window.isSupabaseConfigured();
        } else {
            console.warn('Supabase functions not available, using fallback mode');
            this.supabase = null;
            this.isConfigured = false;
        }
        
        this.fallbackMode = !this.isConfigured;
        
        if (this.fallbackMode) {
            console.log('Using localStorage fallback for reading storage');
        }
        
        this.cleanupOldReadings();
    }

    /**
     * Generate a unique reading ID (UUID format for Supabase compatibility)
     */
    generateReadingId() {
        // Generate a UUID v4 compatible string
        // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        return uuidv4();
    }

    /**
     * Save a reading to Supabase database (with localStorage fallback)
     * @param {Object} readingData - Complete reading data
     * @returns {Promise<string>} - Unique reading ID
     */
    async saveReading(readingData) {
        const readingId = this.generateReadingId();
        
        // Transform reading data to match database schema
        const reading = {
            id: readingId,
            reading_type: readingData.readingType || 'general',
            question: readingData.question || null,
            spread_name: readingData.spreadName || readingData.spreadType || 'Single Card',
            cards: readingData.cards || [],
            interpretation: readingData.interpretation || '',
            personal_info: readingData.personalInfo || readingData.personal_info || {},
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + (this.readingExpiryDays * 24 * 60 * 60 * 1000)).toISOString(),
            view_count: 0,
            share_count: 0,
            is_public: true // Make readings public by default for sharing
        };

        if (this.fallbackMode) {
            return this.saveReadingFallback(reading);
        }

        try {
            console.log('Saving reading to Supabase:', {
                id: readingId,
                reading_type: reading.reading_type,
                spread_name: reading.spread_name,
                cards_count: reading.cards.length,
                has_interpretation: !!reading.interpretation
            });
            
            const tableName = window.SUPABASE_CONFIG?.tables?.readings || 'readings';
            const { data, error } = await this.supabase
                .from(tableName)
                .insert([reading])
                .select(); // Return the inserted row

            if (error) {
                console.error('❌ Failed to save reading to Supabase:', error);
                console.error('Error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                // Fall back to localStorage
                return this.saveReadingFallback(reading);
            }

            console.log('✅ Reading saved to Supabase successfully:', readingId);
            if (data && data[0]) {
                console.log('Inserted reading data:', data[0]);
            }
            
            // Also save to localStorage as backup
            this.saveReadingFallback(reading);
            
            return readingId;
        } catch (error) {
            console.error('Error saving reading to Supabase:', error);
            return this.saveReadingFallback(reading);
        }
    }

    /**
     * Fallback save to localStorage
     * @param {Object} reading - Reading data
     * @returns {string} - Reading ID
     */
    saveReadingFallback(reading) {
        const allReadings = this.getAllReadingsFallback();
        allReadings[reading.id] = reading;
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(allReadings));
            console.log('Reading saved to localStorage successfully:', reading.id);
            return reading.id;
        } catch (error) {
            console.error('Failed to save reading to localStorage:', error);
            throw new Error('Failed to save reading to storage');
        }
    }

    /**
     * Check if a reading ID is in the old format (not UUID)
     * @param {string} readingId - Reading ID to check
     * @returns {boolean} - True if old format
     */
    isOldFormatId(readingId) {
        // Old format: reading_1234567890_abc123
        // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        return readingId && readingId.startsWith('reading_') && !readingId.includes('-');
    }

    /**
     * Get a specific reading by ID
     * @param {string} readingId - Reading ID
     * @returns {Promise<Object|null>} - Reading data or null if not found
     */
    async getReading(readingId) {
        if (!readingId) {
            console.error('No reading ID provided to getReading');
            return null;
        }

        // Old-format IDs can only exist in localStorage (not in Supabase UUID column)
        // So skip Supabase lookup for old-format IDs
        if (this.isOldFormatId(readingId)) {
            console.log('Old-format reading ID detected, checking localStorage only:', readingId);
            return this.getReadingFallback(readingId);
        }

        if (this.fallbackMode) {
            return this.getReadingFallback(readingId);
        }

        try {
            // First try with is_public filter
            let { data, error } = await this.supabase
                .from(window.SUPABASE_CONFIG.tables.readings)
                .select('*')
                .eq('id', readingId)
                .eq('is_public', true)
                .single();

            // If not found with is_public filter, try without it (in case reading was just saved)
            if (error && error.code === 'PGRST116') {
                console.log('Reading not found with is_public filter, trying without filter...');
                const result = await this.supabase
                    .from(window.SUPABASE_CONFIG.tables.readings)
                    .select('*')
                    .eq('id', readingId)
                    .single();
                
                data = result.data;
                error = result.error;
            }

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned - try fallback
                    console.log('Reading not found in Supabase, trying localStorage fallback...');
                    return this.getReadingFallback(readingId);
                }
                console.error('Failed to get reading from Supabase:', error);
                return this.getReadingFallback(readingId);
            }

            if (!data) {
                console.log('No data returned from Supabase, trying localStorage fallback...');
                return this.getReadingFallback(readingId);
            }

            // Check if reading has expired
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                console.log('Reading has expired:', readingId);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error getting reading from Supabase:', error);
            return this.getReadingFallback(readingId);
        }
    }

    /**
     * Fallback get reading from localStorage
     * @param {string} readingId - Reading ID
     * @returns {Object|null} - Reading data or null
     */
    getReadingFallback(readingId) {
        const allReadings = this.getAllReadingsFallback();
        const reading = allReadings[readingId];
        
        if (!reading) {
            return null;
        }

        // Check if reading has expired
        if (new Date(reading.expires_at) < new Date()) {
            console.log('Reading has expired:', readingId);
            return null;
        }

        return reading;
    }

    /**
     * Increment view count for a reading
     * @param {string} readingId - Reading ID
     * @returns {Promise<boolean>} - Success status
     */
    async incrementViewCount(readingId) {
        if (this.fallbackMode) {
            return this.incrementViewCountFallback(readingId);
        }

        try {
            const { error } = await this.supabase
                .from(window.SUPABASE_CONFIG.tables.readings)
                .update({ view_count: this.supabase.raw('view_count + 1') })
                .eq('id', readingId);

            if (error) {
                console.error('Failed to increment view count in Supabase:', error);
                return this.incrementViewCountFallback(readingId);
            }

            return true;
        } catch (error) {
            console.error('Error incrementing view count in Supabase:', error);
            return this.incrementViewCountFallback(readingId);
        }
    }

    /**
     * Fallback increment view count in localStorage
     * @param {string} readingId - Reading ID
     * @returns {boolean} - Success status
     */
    incrementViewCountFallback(readingId) {
        const allReadings = this.getAllReadingsFallback();
        const reading = allReadings[readingId];
        
        if (reading) {
            reading.view_count = (reading.view_count || 0) + 1;
            localStorage.setItem(this.storageKey, JSON.stringify(allReadings));
            return true;
        }
        
        return false;
    }

    /**
     * Get all readings (fallback only - Supabase doesn't need this for public access)
     * @returns {Object} - All readings object
     */
    getAllReadings() {
        return this.getAllReadingsFallback();
    }

    /**
     * Fallback get all readings from localStorage
     * @returns {Object} - All readings object
     */
    getAllReadingsFallback() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to retrieve readings from localStorage:', error);
            return {};
        }
    }

    /**
     * Generate shareable data for a reading
     * @param {string} readingId - Reading ID
     * @returns {Promise<Object|null>} - Shareable data or null
     */
    async generateShareableData(readingId) {
        const reading = await this.getReading(readingId);
        
        if (!reading) {
            return null;
        }

        const baseUrl = window.location.origin;
        const shareableUrl = `${baseUrl}/view-reading.html?id=${readingId}`;

        return {
            id: readingId,
            shareableUrl: shareableUrl,
            readingType: reading.reading_type || reading.readingType || 'general',
            spreadType: reading.spread_name || reading.spreadType || 'single',
            question: reading.question,
            userName: reading.personal_info?.name || reading.userName,
            createdAt: reading.created_at || reading.createdAt,
            cards: reading.cards,
            interpretation: reading.interpretation,
            personalInfo: reading.personal_info || reading.personalInfo,
            title: `${reading.spread_name || reading.spreadType} Reading`,
            description: `A ${reading.spread_name || reading.spreadType} tarot reading shared via Ask Sian`,
            image: `${baseUrl}/og-image.svg`
        };
    }

    /**
     * Generate a shareable URL for a reading
     * @param {string} readingId - Reading ID
     * @returns {string} - Shareable URL
     */
    generateShareableUrl(readingId) {
        return `${window.location.origin}/view-reading.html?id=${readingId}`;
    }

    /**
     * Clean up expired readings
     * @returns {Promise<number>} - Number of cleaned up readings
     */
    async cleanupOldReadings() {
        if (this.fallbackMode) {
            return this.cleanupOldReadingsFallback();
        }

        try {
            // Call the cleanup function in Supabase
            const { data, error } = await this.supabase
                .rpc('cleanup_expired_readings');

            if (error) {
                console.error('Failed to cleanup expired readings in Supabase:', error);
                return this.cleanupOldReadingsFallback();
            }

            console.log('Cleaned up expired readings:', data);
            return data || 0;
        } catch (error) {
            console.error('Error cleaning up expired readings in Supabase:', error);
            return this.cleanupOldReadingsFallback();
        }
    }

    /**
     * Fallback cleanup expired readings from localStorage
     * @returns {number} - Number of cleaned up readings
     */
    cleanupOldReadingsFallback() {
        const allReadings = this.getAllReadingsFallback();
        const now = new Date();
        let cleanedCount = 0;

        Object.keys(allReadings).forEach(readingId => {
            const reading = allReadings[readingId];
            if (new Date(reading.expires_at) < now) {
                delete allReadings[readingId];
                cleanedCount++;
            }
        });

        if (cleanedCount > 0) {
            localStorage.setItem(this.storageKey, JSON.stringify(allReadings));
            console.log(`Cleaned up ${cleanedCount} expired readings from localStorage`);
        }

        return cleanedCount;
    }

    /**
     * Get reading statistics
     * @returns {Promise<Object>} - Reading statistics
     */
    async getReadingStats() {
        if (this.fallbackMode) {
            return this.getReadingStatsFallback();
        }

        try {
            const { data, error } = await this.supabase
                .rpc('get_reading_stats');

            if (error) {
                console.error('Failed to get reading stats from Supabase:', error);
                return this.getReadingStatsFallback();
            }

            return data;
        } catch (error) {
            console.error('Error getting reading stats from Supabase:', error);
            return this.getReadingStatsFallback();
        }
    }

    /**
     * Fallback get reading statistics from localStorage
     * @returns {Object} - Reading statistics
     */
    getReadingStatsFallback() {
        const allReadings = this.getAllReadingsFallback();
        const readings = Object.values(allReadings);
        const now = new Date();

        return {
            total_readings: readings.length,
            active_readings: readings.filter(r => new Date(r.expires_at) > now).length,
            expired_readings: readings.filter(r => new Date(r.expires_at) <= now).length,
            total_views: readings.reduce((sum, r) => sum + (r.view_count || 0), 0),
            readings_today: readings.filter(r => new Date(r.created_at) >= new Date(now.getFullYear(), now.getMonth(), now.getDate())).length,
            readings_this_week: readings.filter(r => new Date(r.created_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length,
            readings_this_month: readings.filter(r => new Date(r.created_at) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)).length
        };
    }

    /**
     * Export all readings data
     * @returns {Promise<string>} - JSON string of all readings
     */
    async exportReadings() {
        const allReadings = this.getAllReadings();
        return JSON.stringify(allReadings, null, 2);
    }

    /**
     * Import readings data
     * @param {string} jsonData - JSON string of readings data
     * @returns {Promise<boolean>} - Success status
     */
    async importReadings(jsonData) {
        try {
            const importedReadings = JSON.parse(jsonData);
            
            if (this.fallbackMode) {
                localStorage.setItem(this.storageKey, JSON.stringify(importedReadings));
                return true;
            }

            // For Supabase, we would need to handle this differently
            // For now, just store in localStorage as backup
            localStorage.setItem(this.storageKey, JSON.stringify(importedReadings));
            return true;
        } catch (error) {
            console.error('Failed to import readings:', error);
            return false;
        }
    }

    /**
     * Clear all readings (use with caution)
     * @returns {Promise<boolean>} - Success status
     */
    async clearAllReadings() {
        try {
            if (this.fallbackMode) {
                localStorage.removeItem(this.storageKey);
                return true;
            }

            // For Supabase, we would need admin privileges
            // For now, just clear localStorage
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear readings:', error);
            return false;
        }
    }

    /**
     * Test reading storage functionality
     * @returns {Promise<Object>} - Test results
     */
    async testReadingStorage() {
        const testResults = {
            supabaseConnection: this.isConfigured,
            fallbackMode: this.fallbackMode,
            storage: false,
            retrieval: false,
            cleanup: false
        };

        try {
            // Test saving a reading
            const testReading = {
                userName: 'Test User',
                readingType: 'general',
                spreadType: 'single',
                question: 'Test question',
                cards: [{ name: 'The Fool', number: 0, suit: 'Major Arcana', symbol: '🃏', isReversed: false }],
                interpretation: 'Test interpretation'
            };

            const readingId = await this.saveReading(testReading);
            testResults.storage = !!readingId;

            // Test retrieving the reading
            const retrievedReading = await this.getReading(readingId);
            testResults.retrieval = !!retrievedReading;

            // Test cleanup
            const cleanedCount = await this.cleanupOldReadings();
            testResults.cleanup = cleanedCount >= 0;

            // Clean up test reading
            if (this.fallbackMode) {
                const allReadings = this.getAllReadingsFallback();
                delete allReadings[readingId];
                localStorage.setItem(this.storageKey, JSON.stringify(allReadings));
            }

        } catch (error) {
            console.error('Reading storage test failed:', error);
        }

        return testResults;
    }
}

// Initialize global reading storage instance with a delay to ensure dependencies are loaded
setTimeout(() => {
    try {
        window.readingStorage = new ReadingStorageSupabase();
        console.log('ReadingStorageSupabase initialized successfully');
    } catch (error) {
        console.error('Failed to initialize ReadingStorageSupabase:', error);
        // Create a fallback instance that only uses localStorage
        window.readingStorage = new ReadingStorageSupabase();
    }
}, 100);
