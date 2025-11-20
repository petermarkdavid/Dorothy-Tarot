// Zodiac Sign Data
const zodiacSigns = {
    'Aries': {
        element: 'Fire',
        symbol: '♈',
        dates: { start: [3, 21], end: [4, 19] },
        traits: ['bold', 'energetic', 'pioneering', 'impulsive', 'confident'],
        tarotConnection: 'The Emperor - represents leadership and taking initiative',
        personality: 'Natural leaders who charge ahead with confidence and energy'
    },
    'Taurus': {
        element: 'Earth',
        symbol: '♉',
        dates: { start: [4, 20], end: [5, 20] },
        traits: ['practical', 'reliable', 'stubborn', 'sensual', 'patient'],
        tarotConnection: 'The Hierophant - represents tradition and practical wisdom',
        personality: 'Grounded individuals who value stability and material comfort'
    },
    'Gemini': {
        element: 'Air',
        symbol: '♊',
        dates: { start: [5, 21], end: [6, 20] },
        traits: ['curious', 'communicative', 'adaptable', 'restless', 'intellectual'],
        tarotConnection: 'The Lovers - represents choices and communication',
        personality: 'Quick-witted communicators who thrive on variety and mental stimulation'
    },
    'Cancer': {
        element: 'Water',
        symbol: '♋',
        dates: { start: [6, 21], end: [7, 22] },
        traits: ['intuitive', 'nurturing', 'emotional', 'protective', 'moody'],
        tarotConnection: 'The Chariot - represents emotional control and determination',
        personality: 'Deeply emotional and intuitive, with strong protective instincts'
    },
    'Leo': {
        element: 'Fire',
        symbol: '♌',
        dates: { start: [7, 23], end: [8, 22] },
        traits: ['dramatic', 'generous', 'proud', 'creative', 'loyal'],
        tarotConnection: 'Strength - represents inner power and courage',
        personality: 'Natural performers who lead with warmth and generosity'
    },
    'Virgo': {
        element: 'Earth',
        symbol: '♍',
        dates: { start: [8, 23], end: [9, 22] },
        traits: ['analytical', 'practical', 'perfectionist', 'helpful', 'critical'],
        tarotConnection: 'The Hermit - represents introspection and seeking perfection',
        personality: 'Detail-oriented perfectionists who serve others through practical help'
    },
    'Libra': {
        element: 'Air',
        symbol: '♎',
        dates: { start: [9, 23], end: [10, 22] },
        traits: ['diplomatic', 'charming', 'indecisive', 'fair', 'social'],
        tarotConnection: 'Justice - represents balance and fairness',
        personality: 'Natural peacemakers who seek harmony and balance in all relationships'
    },
    'Scorpio': {
        element: 'Water',
        symbol: '♏',
        dates: { start: [10, 23], end: [11, 21] },
        traits: ['intense', 'passionate', 'secretive', 'transformative', 'loyal'],
        tarotConnection: 'Death - represents transformation and rebirth',
        personality: 'Intense individuals who experience life deeply and transform through challenges'
    },
    'Sagittarius': {
        element: 'Fire',
        symbol: '♐',
        dates: { start: [11, 22], end: [12, 21] },
        traits: ['adventurous', 'optimistic', 'philosophical', 'honest', 'restless'],
        tarotConnection: 'Temperance - represents balance and higher learning',
        personality: 'Free-spirited adventurers who seek truth and meaning in life'
    },
    'Capricorn': {
        element: 'Earth',
        symbol: '♑',
        dates: { start: [12, 22], end: [1, 19] },
        traits: ['ambitious', 'disciplined', 'practical', 'reserved', 'responsible'],
        tarotConnection: 'The Devil - represents ambition and material success',
        personality: 'Ambitious achievers who build lasting success through discipline'
    },
    'Aquarius': {
        element: 'Air',
        symbol: '♒',
        dates: { start: [1, 20], end: [2, 18] },
        traits: ['independent', 'innovative', 'humanitarian', 'eccentric', 'detached'],
        tarotConnection: 'The Star - represents hope and humanitarian ideals',
        personality: 'Visionary individuals who march to their own beat and help humanity'
    },
    'Pisces': {
        element: 'Water',
        symbol: '♓',
        dates: { start: [2, 19], end: [3, 20] },
        traits: ['intuitive', 'compassionate', 'artistic', 'escapist', 'spiritual'],
        tarotConnection: 'The Moon - represents intuition and the subconscious',
        personality: 'Highly intuitive and compassionate, often artistic and spiritually inclined'
    }
};

// Function to get zodiac sign from birth date
function getZodiacSign(birthDate) {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const day = date.getDate();
    
    for (const [sign, data] of Object.entries(zodiacSigns)) {
        const { start, end } = data.dates;
        
        // Handle signs that cross year boundary (Capricorn)
        if (start[0] === 12 && end[0] === 1) {
            if ((month === 12 && day >= start[1]) || (month === 1 && day <= end[1])) {
                return { sign, ...data };
            }
        } else {
            if ((month === start[0] && day >= start[1]) || (month === end[0] && day <= end[1])) {
                return { sign, ...data };
            }
        }
    }
    
    return null;
}

// Function to get element traits
function getElementTraits(element) {
    const elementTraits = {
        'Fire': {
            description: 'Passionate, energetic, and action-oriented',
            tarotConnection: 'Wands suit - represents creativity, passion, and drive',
            personality: 'Natural leaders who inspire others through their enthusiasm'
        },
        'Earth': {
            description: 'Practical, grounded, and material-focused',
            tarotConnection: 'Pentacles suit - represents material matters and practical concerns',
            personality: 'Reliable individuals who build lasting foundations'
        },
        'Air': {
            description: 'Intellectual, communicative, and social',
            tarotConnection: 'Swords suit - represents thoughts, communication, and challenges',
            personality: 'Quick thinkers who excel at communication and ideas'
        },
        'Water': {
            description: 'Emotional, intuitive, and deeply feeling',
            tarotConnection: 'Cups suit - represents emotions, relationships, and intuition',
            personality: 'Highly intuitive individuals who feel deeply and care for others'
        }
    };
    
    return elementTraits[element] || null;
}
