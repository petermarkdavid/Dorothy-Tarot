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
            
            console.log('ReadingStorageSupabase initialization:', {
                supabaseClient: !!this.supabase,
                isConfigured: this.isConfigured,
                supabaseUrl: window.SUPABASE_CONFIG?.url,
                tableName: window.SUPABASE_CONFIG?.tables?.readings
            });
        } else {
            console.warn('⚠️ Supabase functions not available, using fallback mode');
            console.warn('Missing functions:', {
                getSupabaseClient: typeof window.getSupabaseClient,
                isSupabaseConfigured: typeof window.isSupabaseConfigured
            });
            this.supabase = null;
            this.isConfigured = false;
        }
        
        this.fallbackMode = !this.isConfigured;
        
        if (this.fallbackMode) {
            console.warn('⚠️ Using localStorage fallback for reading storage - readings will NOT be shareable via links');
            console.warn('To enable Supabase: ensure supabase-config.js is loaded and Supabase is properly configured');
        } else {
            console.log('✅ Supabase configured - readings will be saved to database and shareable');
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
        
        // Get site name from BrandConfig (for multi-site databases)
        const siteName = (window.BrandConfig && window.BrandConfig.siteName) || 'Ask Sian';
        
        // Transform reading data to match database schema
        const reading = {
            id: readingId,
            site_name: siteName, // Track which site this reading belongs to
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
            console.log('💾 Saving reading to Supabase:', {
                id: readingId,
                reading_type: reading.reading_type,
                spread_name: reading.spread_name,
                cards_count: reading.cards.length,
                has_interpretation: !!reading.interpretation,
                is_public: reading.is_public,
                site_name: reading.site_name,
                table: window.SUPABASE_CONFIG?.tables?.readings || 'readings',
                supabaseUrl: window.SUPABASE_CONFIG?.url
            });
            
            // Validate Supabase client
            if (!this.supabase) {
                throw new Error('Supabase client is null - cannot save to database');
            }
            
            const tableName = window.SUPABASE_CONFIG?.tables?.readings || 'readings';
            
            // Ensure ID is in correct format (UUID string should work, but let's be explicit)
            // Supabase should accept UUID strings, but if the column is UUID type, we need to ensure format
            const readingToInsert = {
                ...reading,
                id: reading.id // Keep as string - Supabase will handle conversion if needed
            };
            
            // Log the exact data being sent
            console.log('📤 Inserting reading data:', {
                table: tableName,
                id: readingToInsert.id,
                id_type: typeof readingToInsert.id,
                reading_type: readingToInsert.reading_type,
                is_public: readingToInsert.is_public,
                site_name: readingToInsert.site_name
            });
            
            const { data, error } = await this.supabase
                .from(tableName)
                .insert([readingToInsert])
                .select(); // Return the inserted row

            if (error) {
                console.error('❌ Failed to save reading to Supabase:', error);
                console.error('Error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                console.error('Reading data that failed to save:', {
                    id: reading.id,
                    reading_type: reading.reading_type,
                    spread_name: reading.spread_name,
                    is_public: reading.is_public,
                    site_name: reading.site_name,
                    cards_count: reading.cards?.length
                });
                console.warn('⚠️ Falling back to localStorage - reading will NOT be shareable via link');
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
            console.log('Fetching reading from Supabase:', {
                readingId,
                table: window.SUPABASE_CONFIG.tables.readings,
                supabaseUrl: window.SUPABASE_CONFIG?.url
            });

            // Query with is_public filter first (required by RLS policy)
            // RLS policy only allows SELECT when is_public = true
            // Also check site_name if using multi-site database
            let query = this.supabase
                .from(window.SUPABASE_CONFIG.tables.readings)
                .select('*')
                .eq('id', readingId)
                .eq('is_public', true);
            
            // If using multi-site database, optionally filter by site_name
            // But for shared readings, we want to allow cross-site access, so we'll skip this filter
            // The reading should be accessible if is_public = true regardless of site_name
            
            let { data, error } = await query.single();

            // If not found with is_public filter, try to check if reading exists at all
            // This helps diagnose if the issue is is_public=false or reading doesn't exist
            if (error && error.code === 'PGRST116') {
                console.log('Reading not found with is_public=true filter, checking if reading exists at all...');
                
                // Try to query just basic fields to see if the reading exists
                // Use maybeSingle to avoid error if not found, and select minimal fields
                const checkResult = await this.supabase
                    .from(window.SUPABASE_CONFIG.tables.readings)
                    .select('id, is_public, expires_at, created_at, site_name')
                    .eq('id', readingId)
                    .maybeSingle(); // Use maybeSingle to avoid error if not found
                
                if (checkResult.data) {
                    // Reading exists but might not be public
                    console.warn('Reading exists in database but may not be public:', {
                        readingId,
                        is_public: checkResult.data.is_public,
                        expires_at: checkResult.data.expires_at,
                        site_name: checkResult.data.site_name,
                        created_at: checkResult.data.created_at
                    });
                    
                    // Check if expired
                    if (checkResult.data.expires_at && new Date(checkResult.data.expires_at) < new Date()) {
                        console.warn('Reading has expired:', readingId);
                        return null;
                    }
                    
                    // If is_public is false/null, that's the issue
                    if (checkResult.data.is_public === false || checkResult.data.is_public === null) {
                        console.warn('Reading exists but is_public is false/null. Reading cannot be accessed via shared link:', readingId);
                        // Continue to localStorage fallback in case it was saved there
                    }
                } else if (checkResult.error) {
                    // If we get an RLS error, the reading exists but we can't see it
                    if (checkResult.error.code === '42501' || checkResult.error.message?.includes('permission denied') || checkResult.error.message?.includes('row-level security')) {
                        console.warn('Reading likely exists but RLS is blocking access (reading may not be public):', readingId);
                    } else {
                        console.warn('Error checking if reading exists:', checkResult.error);
                    }
                } else {
                    console.warn('Reading does not exist in database:', readingId);
                }
            }

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned - reading doesn't exist
                    console.warn('Reading not found in Supabase (PGRST116):', {
                        readingId,
                        error: error.message,
                        hint: error.hint
                    });
                    console.log('Trying localStorage fallback...');
                    return this.getReadingFallback(readingId);
                }
                console.error('Failed to get reading from Supabase:', {
                    readingId,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                // Try fallback on any error
                return this.getReadingFallback(readingId);
            }

            if (!data) {
                console.warn('No data returned from Supabase for reading:', readingId);
                console.log('Trying localStorage fallback...');
                return this.getReadingFallback(readingId);
            }

            // Check if reading has expired
            if (data.expires_at) {
                const expiryDate = new Date(data.expires_at);
                const now = new Date();
                if (expiryDate < now) {
                    console.warn('Reading has expired:', {
                        readingId,
                        expires_at: data.expires_at,
                        now: now.toISOString()
                    });
                    return null;
                }
            }

            console.log('✅ Reading found in Supabase:', {
                readingId,
                reading_type: data.reading_type,
                spread_name: data.spread_name,
                is_public: data.is_public,
                expires_at: data.expires_at
            });

            return data;
        } catch (error) {
            console.error('Error getting reading from Supabase:', {
                readingId,
                error: error.message,
                stack: error.stack
            });
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
            // First get the current view count
            const { data: reading, error: fetchError } = await this.supabase
                .from(window.SUPABASE_CONFIG.tables.readings)
                .select('view_count')
                .eq('id', readingId)
                .single();

            if (fetchError) {
                console.warn('Could not fetch current view count, skipping increment:', fetchError);
                return this.incrementViewCountFallback(readingId);
            }

            // Increment the view count
            const newCount = (reading?.view_count || 0) + 1;
            const { error } = await this.supabase
                .from(window.SUPABASE_CONFIG.tables.readings)
                .update({ view_count: newCount })
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
