// ChatGPT Integration for Enhanced Tarot Interpretations
class ChatGPTTarotInterpreter {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key') || this.getDefaultApiKey() || '';
        this.baseURL = 'https://api.openai.com/v1/chat/completions';
        this.responseCache = new Map(); // Cache responses to avoid duplicate API calls
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    }

    getSystemPrompt() {
        // Get reader name from brand config, default to "Dorothy"
        const readerName = (window.BrandConfig && window.BrandConfig.readerName) || 'Dorothy';
        const siteName = (window.BrandConfig && window.BrandConfig.siteName) || 'Dorothy Tarot';
        
        return `You are ${readerName}, a warm, experienced, and inclusive tarot reader with decades of wisdom. You provide detailed, compassionate readings that are both insightful and encouraging, specifically designed for the LGBTI community. You create a safe, welcoming space where everyone can explore their path with confidence and pride. Write in a friendly, conversational tone as if speaking to a close friend. Be thorough in your interpretations while remaining practical and supportive. Use "you" language and always end on an encouraging note. Celebrate diversity, acknowledge unique journeys, and provide guidance that honors each person's authentic self.`;
    }

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

    saveApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('openai_api_key', key);
    }

    hasApiKey() {
        return this.apiKey && this.apiKey.trim() !== '';
    }

    generateCacheKey(type, question, cards, spread, userName = null, userStarsign = null) {
        // Create a unique cache key based on the input parameters
        const cardData = cards.map(card => `${card.name}-${card.reversed ? 'R' : 'U'}`).join('|');
        return `${type}-${question || 'general'}-${cardData}-${spread.name}-${userName || ''}-${userStarsign || ''}`;
    }

    getCachedResponse(cacheKey) {
        const cached = this.responseCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.response;
        }
        return null;
    }

    setCachedResponse(cacheKey, response) {
        this.responseCache.set(cacheKey, {
            response: response,
            timestamp: Date.now()
        });
    }

    async generateTarotInterpretation(question, cards, spread, userName = null, userStarsign = null) {
        if (!this.hasApiKey()) {
            throw new Error('No API key provided');
        }

        // Check cache first
        const cacheKey = this.generateCacheKey('tarot', question, cards, spread, userName, userStarsign);
        const cachedResponse = this.getCachedResponse(cacheKey);
        if (cachedResponse) {
            console.log('Using cached response for tarot interpretation');
            return cachedResponse;
        }

        const prompt = this.createTarotPrompt(question, cards, spread, userName, userStarsign);
        
        try {
            console.log('Making API call to OpenAI...');
            console.log('API Key being used:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'None');
            console.log('Prompt length:', prompt.length);
            
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: this.getSystemPrompt()
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 2500, // Increased for much more detailed responses
                    temperature: 0.7 // Balanced for detailed yet coherent responses
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const result = data.choices[0].message.content;
            
            // Cache the response
            this.setCachedResponse(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            throw error;
        }
    }

    createTarotPrompt(question, cards, spread, userName = null, userStarsign = null) {
        const readerName = (window.BrandConfig && window.BrandConfig.readerName) || 'Dorothy';
        let prompt = `You are ${readerName}, a warm and insightful tarot reader with decades of experience, providing inclusive guidance for the LGBTI community. The most important part of this reading is to directly answer this specific question: "${question}"\n`;
        
        if (userName) prompt += `The querent's name is ${userName}.\n`;
        if (userStarsign) prompt += `The querent's star sign is ${userStarsign}.\n`;
        
        prompt += `\nUsing the ${spread.name} spread, here are the cards drawn:\n`;
        cards.forEach((card, index) => {
            const pos = card.position.name;
            const ori = card.isReversed ? 'reversed' : 'upright';
            prompt += `${index + 1}. ${pos}: ${card.name} (${ori})\n`;
        });

        prompt += `\nIMPORTANT: Your primary goal is to directly answer their question: "${question}". Every part of your reading should connect back to this specific question and provide clear, actionable guidance related to what they're asking about.

Please provide a detailed and comprehensive reading that directly addresses their question in this format:

**DIRECT ANSWER TO THEIR QUESTION (3-4 sentences):** Start by directly answering their specific question based on what the cards reveal. Be clear, specific, and directly address what they're asking about.

**OVERALL SUMMARY (4-5 sentences):** Provide a rich summary that captures the essence of the reading as it relates to their question, weaving together the main themes and energies present across all cards.

**DETAILED CARD INTERPRETATIONS (5-6 sentences per card):** For each card, provide an in-depth analysis that specifically connects to their question:
- The card's core meaning and how it answers their question
- How it relates to the position it's in within the context of their question
- What the upright/reversed orientation reveals about their specific situation
- How this energy directly impacts what they're asking about
- Specific examples or scenarios related to their question
- How this card provides guidance for their specific concern

**CARD INTERACTIONS & STORY (4-5 sentences):** Explain how all the cards work together to answer their question:
- The flow of energy between cards as it relates to their question
- How the cards collectively provide a complete answer
- What the overall message is regarding their specific concern
- How different aspects of their question are addressed by different cards

**PRACTICAL GUIDANCE (4-5 sentences):** Provide specific, actionable advice directly related to their question:
- Concrete steps they can take to address their specific concern
- What to focus on and what to avoid regarding their question
- Potential obstacles and how to navigate them in relation to their question
- Timeline considerations for their specific situation
- Daily practices or mindset changes that directly help with their question

**ENCOURAGING CLOSE (3-4 sentences):** End with a warm, empowering message that:
- Directly addresses their question with confidence and hope
- Acknowledges their courage in asking this question
- Reminds them of their inner wisdom and strength
- Offers specific encouragement related to their concern

Write in a warm, conversational tone as if speaking directly to a close friend. Use "you" language throughout. Be encouraging while remaining honest about challenges. Make sure every part of your reading directly relates to and answers their specific question. Do not include section headers - write in flowing, natural paragraphs that create a beautiful, cohesive reading experience.`;

        return prompt;
    }

    async generateGeneralTarotInterpretation(cards, spread, userName = null, userStarsign = null) {
        if (!this.hasApiKey()) {
            throw new Error('No API key provided');
        }

        // Check cache first
        const cacheKey = this.generateCacheKey('general', null, cards, spread, userName, userStarsign);
        const cachedResponse = this.getCachedResponse(cacheKey);
        if (cachedResponse) {
            console.log('Using cached response for general interpretation');
            return cachedResponse;
        }

        const prompt = this.createGeneralTarotPrompt(cards, spread, userName, userStarsign);
        
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: this.getSystemPrompt()
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 2500, // Increased for much more detailed responses
                    temperature: 0.7 // Balanced for detailed yet coherent responses
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const result = data.choices[0].message.content;
            
            // Cache the response
            this.setCachedResponse(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            throw error;
        }
    }

    createGeneralTarotPrompt(cards, spread, userName = null, userStarsign = null) {
        const readerName = (window.BrandConfig && window.BrandConfig.readerName) || 'Dorothy';
        let prompt = `You are ${readerName}, a warm and insightful tarot reader with decades of experience, providing inclusive guidance for the LGBTI community. Provide a detailed, compassionate general life reading`;
        
        if (userName) prompt += ` for ${userName}`;
        if (userStarsign) prompt += ` (${userStarsign})`;
        prompt += `.\n`;
        
        prompt += `\nUsing the ${spread.name} spread, here are the cards drawn:\n`;
        cards.forEach((card, index) => {
            const pos = card.position.name;
            const ori = card.isReversed ? 'reversed' : 'upright';
            prompt += `${index + 1}. ${pos}: ${card.name} (${ori})\n`;
        });

        prompt += `\nPlease provide an extremely detailed and comprehensive general life reading in this format:

**CURRENT LIFE OVERVIEW (5-6 sentences):** Begin with a rich, detailed summary of their current life situation, capturing the major themes, energies, and overall guidance present across all cards. Weave together the main life areas and what the universe is trying to communicate about their journey right now.

**DETAILED CARD INTERPRETATIONS (6-8 sentences per card):** For each card, provide an in-depth analysis including:
- The card's core meaning and symbolism in the context of their life
- How it specifically relates to the position it's in and what life area it represents
- What the upright/reversed orientation reveals about their current situation
- How this energy is manifesting in their daily life and relationships
- Specific examples or scenarios that might apply to their current circumstances
- Emotional, mental, and spiritual aspects of this card's message
- How this card connects to their overall life path and growth

**LIFE STORY & CARD INTERACTIONS (6-7 sentences):** Explain how all the cards work together to tell the story of their current life journey. Discuss:
- The flow of energy between cards and how they influence each other
- The overall narrative arc of their current life phase
- What patterns or themes emerge across different life areas
- How past experiences are influencing present circumstances
- What the cards reveal about their life's direction and purpose
- Contradictions or tensions that create growth opportunities

**COMPREHENSIVE LIFE GUIDANCE (8-10 sentences):** Provide detailed guidance covering all major life areas:
- **Love & Relationships:** Current dynamics, what to focus on, what to release
- **Career & Purpose:** Professional direction, opportunities, challenges to navigate
- **Health & Wellbeing:** Physical, emotional, and mental health considerations
- **Spirituality & Growth:** Soul lessons, spiritual development, inner work needed
- **Finances & Security:** Material stability, abundance, financial guidance
- **Family & Home:** Domestic life, family dynamics, living situation
- **Personal Development:** Skills to develop, habits to cultivate, mindset shifts

**PRACTICAL ACTION STEPS (5-6 sentences):** Provide specific, actionable advice including:
- Concrete steps they can take in the next few weeks and months
- Daily practices, rituals, or mindset changes that would help
- What to focus their energy on and what to release or let go of
- Potential obstacles and how to navigate them with grace
- Timeline considerations and when to expect significant shifts
- Resources, people, or opportunities to seek out

**SPIRITUAL & SOUL GROWTH (4-5 sentences):** Address the deeper meaning and soul-level lessons, including:
- What their soul is trying to learn or express in this lifetime
- How their current situation serves their highest good and evolution
- Inner strengths, gifts, and wisdom they can draw upon
- Areas where they might be holding themselves back or limiting beliefs to release
- Their unique spiritual path and how to honor it

**ENCOURAGING CLOSE (4-5 sentences):** End with a warm, empowering message that:
- Acknowledges their courage, resilience, and the progress they've made
- Reminds them of their inner wisdom, strength, and infinite potential
- Offers hope, confidence, and excitement for their continued journey
- Leaves them feeling deeply supported, understood, and inspired
- Celebrates their unique path and the beautiful soul they are

Write in a warm, conversational tone as if speaking directly to a close friend who trusts you completely. Use "you" language throughout. Be encouraging while remaining honest about challenges. Make it deeply personal, meaningful, and transformative. Focus on their overall life journey, growth, and the beautiful soul they are becoming. Do not include section headers - write in flowing, natural paragraphs that create a beautiful, cohesive reading experience that feels like a loving conversation with a wise friend.`;

        return prompt;
    }

    async generateHoroscopeInterpretation(cards, spread, userName = null, userStarsign = null) {
        if (!this.hasApiKey()) {
            throw new Error('No API key provided');
        }

        // Check cache first
        const cacheKey = this.generateCacheKey('horoscope', null, cards, spread, userName, userStarsign);
        const cachedResponse = this.getCachedResponse(cacheKey);
        if (cachedResponse) {
            console.log('Using cached response for horoscope interpretation');
            return cachedResponse;
        }

        const prompt = this.createHoroscopePrompt(cards, spread, userName, userStarsign);
        
        try {
            console.log('Making API call to OpenAI for horoscope...');
            console.log('API Key being used:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'None');
            console.log('Prompt length:', prompt.length);
            
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: this.getSystemPrompt()
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 2500, // Increased for much more detailed responses
                    temperature: 0.7 // Balanced for detailed yet coherent responses
                })
            });
            
            console.log('API Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const result = data.choices[0].message.content;
            
            // Cache the response
            this.setCachedResponse(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            throw error;
        }
    }

    createHoroscopePrompt(cards, spread, userName = null, userStarsign = null) {
        const today = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const readerName = (window.BrandConfig && window.BrandConfig.readerName) || 'Dorothy';
        let prompt = `You are ${readerName}, a warm and insightful tarot reader with decades of experience, providing inclusive guidance for the LGBTI community. Provide a detailed, compassionate daily horoscope reading for ${today}`;
        
        if (userName) prompt += ` for ${userName}`;
        if (userStarsign) prompt += ` (${userStarsign})`;
        prompt += `.\n`;
        
        prompt += `\nUsing the ${spread.name} spread, here are the cards drawn:\n`;
        cards.forEach((card, index) => {
            const pos = card.position.name;
            const ori = card.isReversed ? 'reversed' : 'upright';
            prompt += `${index + 1}. ${pos}: ${card.name} (${ori})\n`;
        });

        prompt += `\nPlease provide an extremely detailed and comprehensive daily horoscope reading in this format:

**TODAY'S COSMIC OVERVIEW (5-6 sentences):** Begin with a rich, detailed summary of what the universe has in store for them today, capturing the major themes, energies, and cosmic guidance present across all cards. Weave together the main life areas and what the stars are trying to communicate about their day.

**DETAILED CARD INTERPRETATIONS (6-8 sentences per card):** For each card, provide an in-depth analysis including:
- The card's core meaning and symbolism in the context of today's energy
- How it specifically relates to the position it's in and what life area it represents for today
- What the upright/reversed orientation reveals about their current daily situation
- How this energy is manifesting in their day and interactions
- Specific examples or scenarios that might apply to their daily activities
- Emotional, mental, and spiritual aspects of this card's message for today
- How this card connects to their overall daily journey and growth

**DAILY STORY & CARD INTERACTIONS (6-7 sentences):** Explain how all the cards work together to tell the story of their day. Discuss:
- The flow of energy between cards and how they influence each other throughout the day
- The overall narrative arc of their daily journey
- What patterns or themes emerge across different time periods of the day
- How morning energies set up afternoon and evening experiences
- What the cards reveal about their day's purpose and cosmic timing
- Contradictions or tensions that create growth opportunities today

**COMPREHENSIVE DAILY GUIDANCE (8-10 sentences):** Provide detailed guidance covering all major life areas for today:
- **Love & Relationships:** Today's dynamics, what to focus on, what to release
- **Career & Purpose:** Professional direction, opportunities, challenges to navigate today
- **Health & Wellbeing:** Physical, emotional, and mental health considerations for today
- **Spirituality & Growth:** Soul lessons, spiritual development, inner work needed today
- **Finances & Security:** Material stability, abundance, financial guidance for today
- **Family & Home:** Domestic life, family dynamics, living situation today
- **Personal Development:** Skills to develop, habits to cultivate, mindset shifts for today

**PRACTICAL DAILY ACTION STEPS (5-6 sentences):** Provide specific, actionable advice for today including:
- Concrete steps they can take throughout the day
- Daily practices, rituals, or mindset changes that would help today
- What to focus their energy on and what to release or let go of today
- Potential obstacles and how to navigate them with grace today
- Timeline considerations and when to expect significant shifts today
- Resources, people, or opportunities to seek out today

**COSMIC & SPIRITUAL DAILY GROWTH (4-5 sentences):** Address the deeper meaning and soul-level lessons for today, including:
- What their soul is trying to learn or express today
- How today's situation serves their highest good and evolution
- Inner strengths, gifts, and wisdom they can draw upon today
- Areas where they might be holding themselves back or limiting beliefs to release today
- Their unique spiritual path and how to honor it today

**ENCOURAGING DAILY CLOSE (4-5 sentences):** End with a warm, empowering message that:
- Acknowledges their courage, resilience, and the progress they're making today
- Reminds them of their inner wisdom, strength, and infinite potential for today
- Offers hope, confidence, and excitement for their day ahead
- Leaves them feeling deeply supported, understood, and inspired for today
- Celebrates their unique path and the beautiful soul they are, especially today

Write in a warm, conversational tone as if speaking directly to a close friend who trusts you completely. Use "you" language throughout. Be encouraging while remaining honest about challenges. Make it deeply personal, meaningful, and transformative. Focus on their daily journey, growth, and the beautiful soul they are becoming today. Do not include section headers - write in flowing, natural paragraphs that create a beautiful, cohesive reading experience that feels like a loving conversation with a wise friend about their day ahead.`;

        return prompt;
    }

    async generateCardSpecificInterpretation(card, question, userName = null) {
        if (!this.hasApiKey()) {
            throw new Error('No API key provided');
        }

        // Check cache first
        const cacheKey = this.generateCacheKey('card', question, [card], {name: 'Single Card'}, null, userName);
        const cachedResponse = this.getCachedResponse(cacheKey);
        if (cachedResponse) {
            console.log('Using cached response for card interpretation');
            return cachedResponse;
        }

        let prompt = `Single card reading: "${question}"\n`;
        if (userName) prompt += `Name: ${userName}\n`;
        prompt += `Card: ${card.name} (${card.reversed ? 'R' : 'U'})\n`;
        prompt += `Give reading. Start with "QUICK ANSWER: [Yes/No/Maybe] - [1-2 sentences]" then provide guidance. Use "you" language. Be direct.`;

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: this.getSystemPrompt()
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 800, // Increased for more detailed card interpretations
                    temperature: 0.8 // Increased for more creative, friendly responses
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const result = data.choices[0].message.content;
            
            // Cache the response
            this.setCachedResponse(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            throw error;
        }
    }
}
