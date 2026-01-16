// ChatGPT Integration for Enhanced Tarot Interpretations
class ChatGPTTarotInterpreter {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key') || this.getDefaultApiKey() || '';
        this.baseURL = 'https://api.openai.com/v1/chat/completions';
        this.responseCache = new Map(); // Cache responses to avoid duplicate API calls
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        
    }

    getDefaultApiKey() {
        // Check BrandConfig first (for Dorothy Tarot), then AskSianConfig for backward compatibility
        if (window.BrandConfig && window.BrandConfig.openai && window.BrandConfig.openai.defaultApiKey) {
            const configuredKey = window.BrandConfig.openai.defaultApiKey.trim();
            if (!this.isPlaceholderApiKey(configuredKey)) {
                return configuredKey;
            }
        }
        if (window.AskSianConfig && window.AskSianConfig.openai && window.AskSianConfig.openai.defaultApiKey) {
            const configuredKey = window.AskSianConfig.openai.defaultApiKey.trim();
            if (!this.isPlaceholderApiKey(configuredKey)) {
                return configuredKey;
            }
        }
        // Legacy support for direct defaultApiKey property
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
                            content: 'You are Sian, a bold and insightful tarot reader with decades of experience who isn\'t afraid to tell it like it is. You combine mystical wisdom with real-world honesty, delivering readings that are both profound and refreshingly direct. You have a gift for seeing through the noise and getting to the heart of what people need to hear—even when it\'s uncomfortable. Write with personality, passion, and a touch of mystique. Be warm but not saccharine, honest but not harsh, and always fascinating. Use vivid language, memorable metaphors, and insights that make people think. You\'re the kind of reader people remember because you don\'t just tell them what they want to hear—you tell them what they need to know. Use "you" language and make every reading feel like a compelling conversation with someone who truly sees them.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 2500, // Increased for much more detailed responses
                    temperature: 0.85 // Higher temperature for more creative, engaging, and interesting responses
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const result = data.choices[0].message.content;
            
            // Cache the response
            this.setCachedResponse(cacheKey, result);
            
            return result;
        } catch (error) {
            // Handle CORS and network errors gracefully
            if (error.message && error.message.includes('CORS')) {
                console.error('ChatGPT API CORS Error: OpenAI API cannot be called directly from the browser due to CORS restrictions. Consider using a backend proxy or Supabase edge function.');
                throw new Error('AI interpretation is currently unavailable due to browser security restrictions. Please use a standard tarot reading instead.');
            }
            if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                console.error('ChatGPT API Network Error:', error);
                throw new Error('Unable to connect to AI service. Please check your internet connection or use a standard tarot reading.');
            }
            console.error('ChatGPT API Error:', error);
            throw error;
        }
    }

    createTarotPrompt(question, cards, spread, userName = null, userStarsign = null) {
        let prompt = `You are Sian, a warm and insightful tarot reader with decades of experience. The most important part of this reading is to directly answer this specific question: "${question}"\n`;
        
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

**DIRECT ANSWER TO THEIR QUESTION (3-4 sentences):** Start with a bold, memorable answer that directly addresses their question. Be clear, specific, and don't hold back—give them the real answer the cards are showing, even if it's not what they might expect. Make it compelling and make it count.

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

**ENCOURAGING CLOSE (3-4 sentences):** End with a powerful, memorable message that:
- Directly addresses their question with boldness and genuine insight (not just hope, but real confidence in what they can do)
- Acknowledges their courage and what it really means to ask this question
- Reminds them of their actual power and what they're capable of (be specific, not generic)
- Offers real encouragement that sticks—something they'll remember, something that actually helps

Write with personality, passion, and intrigue. Use vivid language, powerful metaphors, and insights that grab attention. Be direct and honest—don\'t sugarcoat, but also don\'t be cruel. Make bold observations, call out patterns others might miss, and deliver insights that feel both mystical and refreshingly real. Use "you" language throughout. Make it compelling, memorable, and genuinely interesting. Don\'t be generic—be specific, be bold, be the kind of reading that sticks with someone. Do not include section headers - write in flowing, natural paragraphs that create a captivating, cohesive reading experience that feels like a conversation with someone who truly sees the deeper truth.`;

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
                            content: 'You are Sian, a bold and insightful tarot reader with decades of experience who isn\'t afraid to tell it like it is. You combine mystical wisdom with real-world honesty, delivering readings that are both profound and refreshingly direct. You have a gift for seeing through the noise and getting to the heart of what people need to hear—even when it\'s uncomfortable. Write with personality, passion, and a touch of mystique. Be warm but not saccharine, honest but not harsh, and always fascinating. Use vivid language, memorable metaphors, and insights that make people think. You\'re the kind of reader people remember because you don\'t just tell them what they want to hear—you tell them what they need to know. Use "you" language and make every reading feel like a compelling conversation with someone who truly sees them.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 2500, // Increased for much more detailed responses
                    temperature: 0.85 // Higher temperature for more creative, engaging, and interesting responses
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
        let prompt = `You are Sian, a warm and insightful tarot reader with decades of experience. Provide a detailed, compassionate general life reading`;
        
        if (userName) prompt += ` for ${userName}`;
        if (userStarsign) prompt += ` (${userStarsign})`;
        prompt += `.\n`;
        
        prompt += `\nIMPORTANT: This is a GENERAL reading - there is NO specific question being asked. Do NOT mention "your question" or refer to any question in your response. This is a general life guidance reading, not a question-based reading.\n`;
        
        prompt += `\nUsing the ${spread.name} spread, here are the cards drawn:\n`;
        cards.forEach((card, index) => {
            const pos = card.position.name;
            const ori = card.isReversed ? 'reversed' : 'upright';
            prompt += `${index + 1}. ${pos}: ${card.name} (${ori})\n`;
        });

        prompt += `\nPlease provide an extremely detailed and comprehensive general life reading in this format:

**CURRENT LIFE OVERVIEW (5-6 sentences):** Begin with a bold, compelling summary that captures the real energy of their current situation. Don't just describe—reveal. What's really happening beneath the surface? What patterns are they missing? What truth needs to be spoken? Make it vivid, memorable, and genuinely insightful. Weave together the main life areas and what the universe is really trying to communicate—not the safe version, but the real one.

**DETAILED CARD INTERPRETATIONS (6-8 sentences per card):** For each card, provide a bold, insightful analysis that goes beyond the surface:
- The card's core meaning and what it's really trying to tell them (not the generic interpretation, but what it means for THEM specifically)
- How it specifically relates to the position and what this reveals about their situation (be specific, not vague)
- What the upright/reversed orientation reveals—what are they avoiding? What are they embracing? What's the real story here?
- How this energy is actually manifesting (call out patterns, behaviors, or situations they might not see)
- Specific, vivid examples or scenarios that apply (make it real, make it relatable, make it memorable)
- The deeper emotional, mental, and spiritual truth this card is pointing to (what's the uncomfortable truth? What's the beautiful truth?)
- How this card connects to their bigger picture—what's the real lesson? What's the real opportunity?

**LIFE STORY & CARD INTERACTIONS (6-7 sentences):** Tell the real story the cards are revealing. Don't just explain—narrate. What's the actual plot unfolding? Discuss:
- The flow of energy between cards—what's the real dynamic? What's creating tension? What's creating harmony?
- The overall narrative arc—where are they in their story? What chapter is this? What's the real theme?
- What patterns or themes emerge—what keeps showing up? What are they not seeing? What's the thread connecting everything?
- How past experiences are actually influencing the present—what's the real connection? What needs to be acknowledged?
- What the cards reveal about their direction—not the safe answer, but the real one. Where are they actually headed?
- Contradictions or tensions—what's the real conflict? What's the real opportunity? What needs to be resolved?

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

**ENCOURAGING CLOSE (4-5 sentences):** End with a powerful, memorable message that:
- Acknowledges their actual courage and what they've really accomplished (be specific, not generic)
- Reminds them of their real power and what they're actually capable of (not just "infinite potential" but what that means for THEM)
- Offers genuine hope and excitement—not just platitudes, but real reasons to feel confident about their path
- Leaves them feeling seen, understood, and genuinely inspired (make it personal, make it stick)
- Celebrates their unique path with authenticity—not just "beautiful soul" but what makes them actually special

Write with boldness, personality, and genuine intrigue. Use vivid, memorable language that paints pictures and creates moments of recognition. Be direct and honest—call out what needs to be called out, celebrate what deserves celebration, and don\'t shy away from the uncomfortable truths that lead to real growth. Make it deeply personal, meaningful, and genuinely transformative. Use powerful metaphors, striking observations, and insights that make people think "wow, that\'s exactly it." Don\'t be generic or safe—be specific, be bold, be the kind of reading that changes how someone sees themselves. Use "you" language throughout. Make it compelling, memorable, and genuinely interesting—the kind of reading people want to share because it\'s that good. 

CRITICAL: This is a GENERAL reading with NO specific question. NEVER mention "your question" or refer to any question in your response. Focus on general life guidance, current energies, and overall life themes. Do not include section headers - write in flowing, natural paragraphs that create a captivating, cohesive reading experience that feels like a conversation with someone who truly sees the deeper truth and isn\'t afraid to share it.`;

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
                            content: 'You are Sian, a bold and insightful tarot reader with decades of experience who isn\'t afraid to tell it like it is. You combine mystical wisdom with real-world honesty, delivering readings that are both profound and refreshingly direct. You have a gift for seeing through the noise and getting to the heart of what people need to hear—even when it\'s uncomfortable. Write with personality, passion, and a touch of mystique. Be warm but not saccharine, honest but not harsh, and always fascinating. Use vivid language, memorable metaphors, and insights that make people think. You\'re the kind of reader people remember because you don\'t just tell them what they want to hear—you tell them what they need to know. Use "you" language and make every reading feel like a compelling conversation with someone who truly sees them.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 2500, // Increased for much more detailed responses
                    temperature: 0.85 // Higher temperature for more creative, engaging, and interesting responses
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
        
        let prompt = `You are Sian, a warm and insightful tarot reader with decades of experience. Provide a detailed, compassionate daily horoscope reading for ${today}`;
        
        if (userName) prompt += ` for ${userName}`;
        if (userStarsign) prompt += ` (${userStarsign})`;
        prompt += `.\n`;
        
        prompt += `\nIMPORTANT: This is a DAILY HOROSCOPE reading - there is NO specific question being asked. Do NOT mention "your question" or refer to any question in your response. This is a general daily guidance reading based on cosmic energies.\n`;
        
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

**ENCOURAGING DAILY CLOSE (4-5 sentences):** End with a powerful, energizing message that:
- Acknowledges what they're actually dealing with today and their real strength (be specific)
- Reminds them of their actual power and what they can do today (not just potential, but real capability)
- Offers genuine excitement and confidence—give them real reasons to feel good about today
- Leaves them feeling seen, supported, and genuinely inspired (make it personal, make it memorable)
- Celebrates what makes today special for them—not generic praise, but what's actually significant

Write with energy, personality, and cosmic intrigue. Use vivid language, powerful metaphors, and insights that make the day feel significant. Be direct and honest about what the cards reveal—don\'t just paint a pretty picture, show them the real energy at play. Make it deeply personal, meaningful, and genuinely transformative. Use striking observations, bold predictions, and insights that make people think "this is exactly what I needed to hear today." Don\'t be generic—be specific, be bold, be the kind of daily reading that actually changes how someone approaches their day. Use "you" language throughout. Make it compelling, memorable, and genuinely interesting—the kind of reading that makes someone excited to see what unfolds. 

CRITICAL: This is a DAILY HOROSCOPE reading with NO specific question. NEVER mention "your question" or refer to any question in your response. Focus on daily cosmic energies, what the day holds, and general daily guidance. Do not include section headers - write in flowing, natural paragraphs that create a captivating, cohesive reading experience that feels like a conversation with someone who truly sees the cosmic currents at play and isn\'t afraid to share the real story.`;

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
        prompt += `Give a bold, insightful reading. Start with "QUICK ANSWER: [Yes/No/Maybe] - [1-2 punchy sentences]" then provide guidance that's direct, memorable, and genuinely interesting. Use "you" language. Be specific, be bold, be the kind of answer that sticks with them. Don't be generic—make it count.`;

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
                            content: 'You are Sian, a bold and insightful tarot reader with decades of experience who isn\'t afraid to tell it like it is. You combine mystical wisdom with real-world honesty, delivering readings that are both profound and refreshingly direct. You have a gift for seeing through the noise and getting to the heart of what people need to hear—even when it\'s uncomfortable. Write with personality, passion, and a touch of mystique. Be warm but not saccharine, honest but not harsh, and always fascinating. Use vivid language, memorable metaphors, and insights that make people think. You\'re the kind of reader people remember because you don\'t just tell them what they want to hear—you tell them what they need to know. Use "you" language and make every reading feel like a compelling conversation with someone who truly sees them.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 800, // Increased for more detailed card interpretations
                    temperature: 0.9 // Higher temperature for more creative, bold, and engaging responses
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
