// Tarot Card Data - 78 cards total
const tarotCards = {
    majorArcana: [
        {
            name: "The Fool",
            number: 0,
            suit: "Major Arcana",
            symbol: "🃏",
            keywords: ["new beginnings", "innocence", "spontaneity", "adventure"],
            upright: "A new journey begins. Trust your instincts and embrace the unknown with childlike wonder. This card represents fresh starts, taking leaps of faith, and living in the moment.",
            reversed: "You may be acting recklessly or avoiding responsibility. Take time to consider the consequences of your actions before proceeding."
        },
        {
            name: "The Magician",
            number: 1,
            suit: "Major Arcana",
            symbol: "🪄",
            keywords: ["manifestation", "willpower", "skill", "concentration"],
            upright: "You have all the tools and abilities needed to achieve your goals. Focus your energy and take action. This is a time of great personal power and manifestation.",
            reversed: "You may be misusing your power or feeling powerless. Reconnect with your inner strength and use your abilities wisely."
        },
        {
            name: "The High Priestess",
            number: 2,
            suit: "Major Arcana",
            symbol: "🌙",
            keywords: ["intuition", "mystery", "subconscious", "secrets"],
            upright: "Trust your intuition and inner wisdom. Look beyond the surface to find hidden truths. This card calls for introspection and listening to your inner voice.",
            reversed: "You may be ignoring your intuition or keeping secrets. It's time to trust your inner knowing and be more open about your feelings."
        },
        {
            name: "The Empress",
            number: 3,
            suit: "Major Arcana",
            symbol: "👑",
            keywords: ["fertility", "abundance", "nature", "creativity"],
            upright: "A time of abundance and creativity. Nurture your projects and relationships. This card represents growth, fertility, and the power of creation.",
            reversed: "You may be neglecting self-care or feeling disconnected from your creative side. Focus on nurturing yourself and your creative projects."
        },
        {
            name: "The Emperor",
            number: 4,
            suit: "Major Arcana",
            symbol: "🏛️",
            keywords: ["authority", "structure", "control", "leadership"],
            upright: "Take control of your situation with confidence and authority. Establish structure and order in your life. Leadership qualities are needed now.",
            reversed: "You may be too rigid or controlling. Consider being more flexible and open to others' perspectives."
        },
        {
            name: "The Hierophant",
            number: 5,
            suit: "Major Arcana",
            symbol: "⛪",
            keywords: ["tradition", "spirituality", "learning", "conformity"],
            upright: "Seek guidance from traditional sources or mentors. This is a time for learning and following established practices. Spiritual guidance is available.",
            reversed: "Question traditional beliefs and find your own path. Don't be afraid to break free from conventional thinking."
        },
        {
            name: "The Lovers",
            number: 6,
            suit: "Major Arcana",
            symbol: "💕",
            keywords: ["love", "relationships", "choices", "harmony"],
            upright: "A significant relationship or choice is at hand. Follow your heart while considering all options. This card represents love, harmony, and important decisions.",
            reversed: "You may be facing relationship challenges or difficult choices. Take time to reflect on what truly matters to you."
        },
        {
            name: "The Chariot",
            number: 7,
            suit: "Major Arcana",
            symbol: "🏺",
            keywords: ["determination", "willpower", "victory", "control"],
            upright: "Success through determination and willpower. You have the strength to overcome obstacles and achieve your goals. Stay focused and determined.",
            reversed: "You may be lacking direction or feeling scattered. Focus your energy and regain control of your situation."
        },
        {
            name: "Strength",
            number: 8,
            suit: "Major Arcana",
            symbol: "🦁",
            keywords: ["courage", "patience", "inner strength", "compassion"],
            upright: "True strength comes from within. Show courage and patience in difficult situations. Your inner strength will guide you through challenges.",
            reversed: "You may be doubting yourself or acting from fear. Trust in your inner strength and approach challenges with confidence."
        },
        {
            name: "The Hermit",
            number: 9,
            suit: "Major Arcana",
            symbol: "🕯️",
            keywords: ["introspection", "guidance", "solitude", "wisdom"],
            upright: "A time for introspection and inner guidance. Seek answers within yourself through meditation or quiet reflection. Wisdom comes from within.",
            reversed: "You may be isolating yourself too much or avoiding necessary social connections. Balance solitude with meaningful relationships."
        },
        {
            name: "Wheel of Fortune",
            number: 10,
            suit: "Major Arcana",
            symbol: "🎡",
            keywords: ["change", "cycles", "luck", "destiny"],
            upright: "A significant change is coming. Embrace the cycles of life and trust in the process. Good fortune and new opportunities are on the horizon.",
            reversed: "You may be resisting necessary changes or feeling stuck. Accept that change is inevitable and work with it rather than against it."
        },
        {
            name: "Justice",
            number: 11,
            suit: "Major Arcana",
            symbol: "⚖️",
            keywords: ["balance", "fairness", "truth", "karma"],
            upright: "Balance and fairness are important now. Truth will be revealed, and justice will be served. Make decisions based on what is right and fair.",
            reversed: "You may be dealing with injustice or unfairness. Stay true to your values and seek balance in your life."
        },
        {
            name: "The Hanged Man",
            number: 12,
            suit: "Major Arcana",
            symbol: "🪢",
            keywords: ["sacrifice", "surrender", "new perspective", "waiting"],
            upright: "Sometimes you must let go to gain something greater. A new perspective is needed. This is a time for surrender and patience.",
            reversed: "You may be resisting necessary changes or feeling stuck. Consider what you need to release to move forward."
        },
        {
            name: "Death",
            number: 13,
            suit: "Major Arcana",
            symbol: "💀",
            keywords: ["transformation", "endings", "new beginnings", "change"],
            upright: "A major transformation is occurring. Old patterns must die to make way for new growth. This is a powerful time of change and renewal.",
            reversed: "You may be resisting necessary changes or holding onto what no longer serves you. Embrace transformation and let go of the past."
        },
        {
            name: "Temperance",
            number: 14,
            suit: "Major Arcana",
            symbol: "🍶",
            keywords: ["balance", "moderation", "patience", "harmony"],
            upright: "Find balance and moderation in all areas of life. Patience and harmony are key. This card calls for a measured approach to your situation.",
            reversed: "You may be lacking balance or acting in extremes. Seek moderation and find the middle path."
        },
        {
            name: "The Devil",
            number: 15,
            suit: "Major Arcana",
            symbol: "👹",
            keywords: ["temptation", "bondage", "materialism", "addiction"],
            upright: "You may be trapped by limiting beliefs or unhealthy patterns. Recognize what binds you and take steps to free yourself.",
            reversed: "You are breaking free from limiting patterns and taking control of your life. Liberation and freedom are possible."
        },
        {
            name: "The Tower",
            number: 16,
            suit: "Major Arcana",
            symbol: "🗼",
            keywords: ["sudden change", "revelation", "disruption", "breakthrough"],
            upright: "A sudden and dramatic change is coming. Old structures must fall to make way for new ones. This disruption leads to greater truth.",
            reversed: "You may be avoiding necessary changes or trying to maintain unstable situations. Embrace the transformation that's needed."
        },
        {
            name: "The Star",
            number: 17,
            suit: "Major Arcana",
            symbol: "⭐",
            keywords: ["hope", "inspiration", "guidance", "renewal"],
            upright: "Hope and inspiration are returning. Trust in the universe and follow your inner guidance. This is a time of healing and renewal.",
            reversed: "You may be losing hope or feeling disconnected from your purpose. Remember that guidance is always available to you."
        },
        {
            name: "The Moon",
            number: 18,
            suit: "Major Arcana",
            symbol: "🌙",
            keywords: ["illusion", "intuition", "subconscious", "fear"],
            upright: "Things may not be as they appear. Trust your intuition and look beyond surface appearances. The subconscious mind is active now.",
            reversed: "You may be seeing things clearly now or overcoming illusions. Trust your instincts and move forward with confidence."
        },
        {
            name: "The Sun",
            number: 19,
            suit: "Major Arcana",
            symbol: "☀️",
            keywords: ["joy", "success", "vitality", "optimism"],
            upright: "A time of joy, success, and vitality. Your hard work is paying off. This card brings optimism and positive energy.",
            reversed: "You may be experiencing temporary setbacks or feeling less optimistic. Remember that this is temporary and better times are ahead."
        },
        {
            name: "Judgement",
            number: 20,
            suit: "Major Arcana",
            symbol: "📯",
            keywords: ["rebirth", "awakening", "forgiveness", "renewal"],
            upright: "A time of awakening and renewal. Forgive yourself and others. This is a period of rebirth and new understanding.",
            reversed: "You may be resisting necessary changes or holding onto past grievances. It's time to let go and move forward."
        },
        {
            name: "The World",
            number: 21,
            suit: "Major Arcana",
            symbol: "🌍",
            keywords: ["completion", "achievement", "wholeness", "success"],
            upright: "A cycle is completing successfully. You have achieved your goals and gained wisdom. This is a time of celebration and wholeness.",
            reversed: "You may be close to completion but not quite there yet. Stay focused and don't give up on your goals."
        }
    ],
    minorArcana: {
        cups: [
            {
                name: "Ace of Cups",
                number: 1,
                suit: "Cups",
                symbol: "🏆",
                keywords: ["new love", "emotions", "intuition", "spirituality"],
                upright: "A new emotional beginning. Open your heart to love and new experiences. Trust your feelings and intuition.",
                reversed: "You may be closing yourself off emotionally or ignoring your feelings. It's time to open your heart."
            },
            {
                name: "Two of Cups",
                number: 2,
                suit: "Cups",
                symbol: "💕",
                keywords: ["partnership", "love", "connection", "harmony"],
                upright: "A meaningful connection or partnership is forming. This represents mutual love, respect, and emotional harmony.",
                reversed: "There may be imbalance in a relationship or difficulty connecting with others. Focus on communication and understanding."
            },
            {
                name: "Three of Cups",
                number: 3,
                suit: "Cups",
                symbol: "🎉",
                keywords: ["celebration", "friendship", "joy", "community"],
                upright: "A time of celebration and joy with friends and loved ones. Enjoy the company of others and celebrate your achievements.",
                reversed: "You may be isolating yourself or experiencing conflicts in relationships. Reach out to others for support."
            },
            {
                name: "Four of Cups",
                number: 4,
                suit: "Cups",
                symbol: "😐",
                keywords: ["apathy", "contemplation", "disconnection", "opportunity"],
                upright: "You may be feeling apathetic or disconnected. Look for new opportunities that are being offered to you.",
                reversed: "You're ready to embrace new opportunities and break free from apathy. Take action on what excites you."
            },
            {
                name: "Five of Cups",
                number: 5,
                suit: "Cups",
                symbol: "😢",
                keywords: ["loss", "grief", "disappointment", "regret"],
                upright: "You're focusing on what you've lost rather than what remains. It's time to process grief and move forward.",
                reversed: "You're beginning to heal from loss and see new possibilities. Focus on what you still have and can build upon."
            },
            {
                name: "Six of Cups",
                number: 6,
                suit: "Cups",
                symbol: "🎁",
                keywords: ["nostalgia", "childhood", "innocence", "giving"],
                upright: "A return to innocence and simple pleasures. Reconnect with your inner child and enjoy life's simple gifts.",
                reversed: "You may be stuck in the past or avoiding growth. It's time to move forward while cherishing good memories."
            },
            {
                name: "Seven of Cups",
                number: 7,
                suit: "Cups",
                symbol: "🌈",
                keywords: ["choices", "illusions", "fantasy", "options"],
                upright: "Many options are available, but not all are real. Be careful of illusions and make grounded choices.",
                reversed: "You're gaining clarity about your options and making realistic choices. Trust your judgment."
            },
            {
                name: "Eight of Cups",
                number: 8,
                suit: "Cups",
                symbol: "🚶",
                keywords: ["walking away", "abandonment", "search", "disappointment"],
                upright: "It's time to walk away from something that no longer serves you. This is a necessary but difficult decision.",
                reversed: "You may be returning to something you left behind or reconsidering a past decision. Trust your instincts."
            },
            {
                name: "Nine of Cups",
                number: 9,
                suit: "Cups",
                symbol: "😊",
                keywords: ["satisfaction", "wishes", "contentment", "gratitude"],
                upright: "Your wishes are coming true. This is a time of emotional satisfaction and contentment. Express gratitude for your blessings.",
                reversed: "You may be taking things for granted or feeling unsatisfied despite having much. Practice gratitude and appreciation."
            },
            {
                name: "Ten of Cups",
                number: 10,
                suit: "Cups",
                symbol: "👨‍👩‍👧‍👦",
                keywords: ["happiness", "family", "harmony", "fulfillment"],
                upright: "Complete emotional fulfillment and happiness. This represents harmony in relationships and family life.",
                reversed: "There may be disharmony in relationships or family issues. Focus on communication and understanding."
            },
            {
                name: "Page of Cups",
                number: 11,
                suit: "Cups",
                symbol: "👶",
                keywords: ["creativity", "intuition", "new ideas", "emotional growth"],
                upright: "A new creative or emotional opportunity is presenting itself. Trust your intuition and be open to new experiences.",
                reversed: "You may be ignoring your intuition or feeling emotionally immature. Trust your feelings and inner wisdom."
            },
            {
                name: "Knight of Cups",
                number: 12,
                suit: "Cups",
                symbol: "🏇",
                keywords: ["romance", "charm", "idealism", "pursuit"],
                upright: "A romantic or idealistic pursuit is underway. Follow your heart but stay grounded in reality.",
                reversed: "You may be acting impulsively or being unrealistic in your pursuits. Balance idealism with practicality."
            },
            {
                name: "Queen of Cups",
                number: 13,
                suit: "Cups",
                symbol: "👸",
                keywords: ["compassion", "intuition", "emotional maturity", "wisdom"],
                upright: "Trust your intuition and emotional wisdom. You have the ability to help others through their emotional challenges.",
                reversed: "You may be overly emotional or not trusting your intuition. Find balance between heart and mind."
            },
            {
                name: "King of Cups",
                number: 14,
                suit: "Cups",
                symbol: "👑",
                keywords: ["emotional control", "wisdom", "compassion", "leadership"],
                upright: "You have mastered your emotions and can lead others with compassion and wisdom. Balance emotion with reason.",
                reversed: "You may be struggling with emotional control or being too detached. Find balance between feeling and thinking."
            }
        ],
        wands: [
            {
                name: "Ace of Wands",
                number: 1,
                suit: "Wands",
                symbol: "🔥",
                keywords: ["inspiration", "new opportunities", "creativity", "passion"],
                upright: "A new creative project or opportunity is beginning. Channel your passion and enthusiasm into action.",
                reversed: "You may be lacking inspiration or feeling blocked creatively. Take time to reconnect with your passions."
            },
            {
                name: "Two of Wands",
                number: 2,
                suit: "Wands",
                symbol: "🗺️",
                keywords: ["planning", "future", "personal power", "decisions"],
                upright: "You're planning for the future and have the power to make important decisions. Trust your vision and take action.",
                reversed: "You may be feeling powerless or uncertain about your direction. Focus on what you can control and make small steps forward."
            },
            {
                name: "Three of Wands",
                number: 3,
                suit: "Wands",
                symbol: "⛵",
                keywords: ["expansion", "foresight", "leadership", "progress"],
                upright: "Your plans are expanding and showing progress. You have the foresight to see opportunities ahead.",
                reversed: "You may be experiencing delays or setbacks. Be patient and adjust your plans as needed."
            },
            {
                name: "Four of Wands",
                number: 4,
                suit: "Wands",
                symbol: "🎊",
                keywords: ["celebration", "harmony", "home", "achievement"],
                upright: "A time of celebration and harmony. Your hard work is paying off and bringing joy to your life.",
                reversed: "You may be experiencing temporary setbacks or conflicts. Focus on what you've achieved and stay positive."
            },
            {
                name: "Five of Wands",
                number: 5,
                suit: "Wands",
                symbol: "⚔️",
                keywords: ["competition", "conflict", "rivalry", "challenge"],
                upright: "You're facing competition or conflict. Use this as motivation to improve and prove your worth.",
                reversed: "You may be avoiding necessary conflicts or competition. Sometimes you need to stand up for yourself."
            },
            {
                name: "Six of Wands",
                number: 6,
                suit: "Wands",
                symbol: "🏆",
                keywords: ["victory", "success", "recognition", "leadership"],
                upright: "Success and recognition are coming your way. Your leadership and hard work are being acknowledged.",
                reversed: "You may be experiencing setbacks or lack of recognition. Stay confident in your abilities and keep working toward your goals."
            },
            {
                name: "Seven of Wands",
                number: 7,
                suit: "Wands",
                symbol: "🛡️",
                keywords: ["challenge", "defense", "perseverance", "standing ground"],
                upright: "You're defending your position against challenges. Stand your ground and trust in your abilities.",
                reversed: "You may be feeling overwhelmed by challenges or giving up too easily. Find your inner strength and persevere."
            },
            {
                name: "Eight of Wands",
                number: 8,
                suit: "Wands",
                symbol: "🏹",
                keywords: ["speed", "action", "rapid change", "movement"],
                upright: "Things are moving quickly now. Rapid changes and new opportunities are coming your way. Stay alert and ready to act.",
                reversed: "You may be experiencing delays or feeling stuck. Be patient and use this time to prepare for what's coming."
            },
            {
                name: "Nine of Wands",
                number: 9,
                suit: "Wands",
                symbol: "🪖",
                keywords: ["resilience", "perseverance", "defense", "strength"],
                upright: "You've been through challenges but remain strong. Your resilience and determination will see you through.",
                reversed: "You may be feeling exhausted or ready to give up. Take time to rest and recharge before continuing."
            },
            {
                name: "Ten of Wands",
                number: 10,
                suit: "Wands",
                symbol: "📦",
                keywords: ["burden", "responsibility", "hard work", "overload"],
                upright: "You're carrying a heavy burden or too many responsibilities. Consider what you can delegate or let go of.",
                reversed: "You're learning to manage your responsibilities better or letting go of unnecessary burdens. This is progress."
            },
            {
                name: "Page of Wands",
                number: 11,
                suit: "Wands",
                symbol: "🔥",
                keywords: ["enthusiasm", "new ideas", "creativity", "exploration"],
                upright: "A new creative project or idea is sparking your enthusiasm. Follow your inspiration and explore new possibilities.",
                reversed: "You may be lacking enthusiasm or feeling creatively blocked. Take time to reconnect with what excites you."
            },
            {
                name: "Knight of Wands",
                number: 12,
                suit: "Wands",
                symbol: "🏇",
                keywords: ["action", "adventure", "impulsiveness", "passion"],
                upright: "You're ready to take action and embark on new adventures. Channel your passion into productive action.",
                reversed: "You may be acting too impulsively or without proper planning. Take time to think before you act."
            },
            {
                name: "Queen of Wands",
                number: 13,
                suit: "Wands",
                symbol: "👸",
                keywords: ["confidence", "independence", "creativity", "leadership"],
                upright: "You're confident and independent, ready to lead and inspire others. Your creative energy is strong.",
                reversed: "You may be lacking confidence or feeling dependent on others. Trust in your own abilities and creativity."
            },
            {
                name: "King of Wands",
                number: 14,
                suit: "Wands",
                symbol: "👑",
                keywords: ["leadership", "vision", "charisma", "inspiration"],
                upright: "You have natural leadership abilities and can inspire others with your vision. Lead with confidence and passion.",
                reversed: "You may be struggling with leadership or feeling uninspired. Reconnect with your vision and natural charisma."
            }
        ],
        swords: [
            {
                name: "Ace of Swords",
                number: 1,
                suit: "Swords",
                symbol: "⚔️",
                keywords: ["new ideas", "clarity", "truth", "breakthrough"],
                upright: "A new idea or breakthrough is coming. Clarity and truth are emerging. Use your mental power wisely.",
                reversed: "You may be experiencing mental confusion or blocked thinking. Take time to clear your mind and focus."
            },
            {
                name: "Two of Swords",
                number: 2,
                suit: "Swords",
                symbol: "🤔",
                keywords: ["difficult choices", "indecision", "stalemate", "balance"],
                upright: "You're facing a difficult decision and feeling stuck. Take time to weigh your options carefully.",
                reversed: "You're ready to make a decision or break free from indecision. Trust your judgment and move forward."
            },
            {
                name: "Three of Swords",
                number: 3,
                suit: "Swords",
                symbol: "💔",
                keywords: ["heartbreak", "sorrow", "grief", "pain"],
                upright: "You're experiencing heartbreak or emotional pain. Allow yourself to grieve and heal from this difficult time.",
                reversed: "You're beginning to heal from heartbreak and pain. This is a time of emotional recovery and growth."
            },
            {
                name: "Four of Swords",
                number: 4,
                suit: "Swords",
                symbol: "😴",
                keywords: ["rest", "contemplation", "recovery", "peace"],
                upright: "A time for rest and contemplation. You need to step back and recharge before moving forward.",
                reversed: "You may be avoiding necessary rest or contemplation. Take time to pause and reflect on your situation."
            },
            {
                name: "Five of Swords",
                number: 5,
                suit: "Swords",
                symbol: "⚔️",
                keywords: ["conflict", "defeat", "betrayal", "dishonor"],
                upright: "You may be dealing with conflict or betrayal. Consider whether winning is worth the cost to relationships.",
                reversed: "You're learning from past conflicts and choosing peace over victory. This is a positive change."
            },
            {
                name: "Six of Swords",
                number: 6,
                suit: "Swords",
                symbol: "🚤",
                keywords: ["transition", "moving on", "calm waters", "hope"],
                upright: "You're transitioning to a better place. Leave behind what no longer serves you and move toward calmer waters.",
                reversed: "You may be resisting necessary changes or feeling stuck. Trust that better times are ahead."
            },
            {
                name: "Seven of Swords",
                number: 7,
                suit: "Swords",
                symbol: "🥷",
                keywords: ["deception", "stealth", "strategy", "betrayal"],
                upright: "Someone may be acting deceptively or you may need to be strategic. Be careful of dishonesty around you.",
                reversed: "You're being honest and transparent, or deception is being revealed. Trust your instincts about people's motives."
            },
            {
                name: "Eight of Swords",
                number: 8,
                suit: "Swords",
                symbol: "🔒",
                keywords: ["restriction", "self-imposed", "victim mentality", "trapped"],
                upright: "You may be feeling trapped or restricted, but these limitations may be self-imposed. Look for ways to free yourself.",
                reversed: "You're breaking free from self-imposed limitations and taking control of your life. This is empowering."
            },
            {
                name: "Nine of Swords",
                number: 9,
                suit: "Swords",
                symbol: "😰",
                keywords: ["anxiety", "worry", "nightmares", "mental anguish"],
                upright: "You're experiencing anxiety and worry. These fears may be exaggerated. Seek support and practice self-care.",
                reversed: "You're overcoming anxiety and worry. Your mental state is improving and you're finding peace."
            },
            {
                name: "Ten of Swords",
                number: 10,
                suit: "Swords",
                symbol: "🗡️",
                keywords: ["betrayal", "rock bottom", "endings", "renewal"],
                upright: "You've hit rock bottom, but this is the end of a difficult cycle. New beginnings are possible after this painful ending.",
                reversed: "You're recovering from a difficult ending and beginning to see new possibilities. This is a time of renewal."
            },
            {
                name: "Page of Swords",
                number: 11,
                suit: "Swords",
                symbol: "📖",
                keywords: ["new ideas", "curiosity", "communication", "learning"],
                upright: "A new idea or message is coming your way. Stay curious and open to learning new things.",
                reversed: "You may be feeling mentally scattered or lacking focus. Take time to organize your thoughts and priorities."
            },
            {
                name: "Knight of Swords",
                number: 12,
                suit: "Swords",
                symbol: "🏇",
                keywords: ["action", "impulsiveness", "assertiveness", "communication"],
                upright: "You're ready to take action and communicate your ideas. Be assertive but considerate of others.",
                reversed: "You may be acting too impulsively or aggressively. Take time to think before you speak or act."
            },
            {
                name: "Queen of Swords",
                number: 13,
                suit: "Swords",
                symbol: "👸",
                keywords: ["independence", "clarity", "directness", "wisdom"],
                upright: "You have clear thinking and can see through deception. Trust your judgment and communicate directly.",
                reversed: "You may be too harsh or critical. Balance your directness with compassion and understanding."
            },
            {
                name: "King of Swords",
                number: 14,
                suit: "Swords",
                symbol: "👑",
                keywords: ["authority", "truth", "justice", "leadership"],
                upright: "You have the authority and wisdom to make fair decisions. Lead with truth and justice.",
                reversed: "You may be abusing your authority or being too rigid. Balance authority with compassion and flexibility."
            }
        ],
        pentacles: [
            {
                name: "Ace of Pentacles",
                number: 1,
                suit: "Pentacles",
                symbol: "💰",
                keywords: ["new opportunities", "material gain", "practicality", "manifestation"],
                upright: "A new financial or material opportunity is presenting itself. This is a time for practical action and manifestation.",
                reversed: "You may be missing opportunities or not taking practical action. Stay alert for new possibilities."
            },
            {
                name: "Two of Pentacles",
                number: 2,
                suit: "Pentacles",
                symbol: "⚖️",
                keywords: ["balance", "priorities", "juggling", "adaptability"],
                upright: "You're juggling multiple responsibilities and need to find balance. Stay flexible and prioritize what's most important.",
                reversed: "You may be struggling to balance your responsibilities or feeling overwhelmed. Focus on one thing at a time."
            },
            {
                name: "Three of Pentacles",
                number: 3,
                suit: "Pentacles",
                symbol: "🏗️",
                keywords: ["teamwork", "collaboration", "skill", "planning"],
                upright: "Teamwork and collaboration are key to success. Your skills are being recognized and valued by others.",
                reversed: "You may be working alone when collaboration would be better, or not recognizing others' contributions."
            },
            {
                name: "Four of Pentacles",
                number: 4,
                suit: "Pentacles",
                symbol: "🏦",
                keywords: ["security", "control", "possessiveness", "stability"],
                upright: "You're focused on security and stability, but may be holding onto things too tightly. Find balance between security and generosity.",
                reversed: "You're learning to let go of control and be more generous. This is a positive change in your relationship with material things."
            },
            {
                name: "Five of Pentacles",
                number: 5,
                suit: "Pentacles",
                symbol: "🏥",
                keywords: ["poverty", "isolation", "hardship", "rejection"],
                upright: "You may be experiencing financial hardship or feeling isolated. Remember that help is available if you reach out.",
                reversed: "You're overcoming financial difficulties or finding support. This is a time of recovery and improvement."
            },
            {
                name: "Six of Pentacles",
                number: 6,
                suit: "Pentacles",
                symbol: "🤝",
                keywords: ["generosity", "charity", "sharing", "balance"],
                upright: "You're in a position to help others or receive help. Generosity and sharing bring balance to your life.",
                reversed: "You may be giving too much or not accepting help when you need it. Find balance in giving and receiving."
            },
            {
                name: "Seven of Pentacles",
                number: 7,
                suit: "Pentacles",
                symbol: "🌱",
                keywords: ["patience", "long-term goals", "investment", "growth"],
                upright: "You're investing in long-term goals and need patience. Your efforts will pay off, but it takes time.",
                reversed: "You may be impatient with slow progress or not investing enough in your future. Stay committed to your goals."
            },
            {
                name: "Eight of Pentacles",
                number: 8,
                suit: "Pentacles",
                symbol: "🔨",
                keywords: ["skill development", "hard work", "mastery", "dedication"],
                upright: "You're developing new skills through hard work and dedication. This is a time of growth and mastery.",
                reversed: "You may be lacking focus or not putting in enough effort. Stay committed to your skill development."
            },
            {
                name: "Nine of Pentacles",
                number: 9,
                suit: "Pentacles",
                symbol: "🏡",
                keywords: ["independence", "self-sufficiency", "luxury", "accomplishment"],
                upright: "You've achieved independence and self-sufficiency. Enjoy the fruits of your labor and take pride in your accomplishments.",
                reversed: "You may be feeling dependent on others or not recognizing your achievements. Trust in your own abilities."
            },
            {
                name: "Ten of Pentacles",
                number: 10,
                suit: "Pentacles",
                symbol: "👨‍👩‍👧‍👦",
                keywords: ["wealth", "family", "legacy", "stability"],
                upright: "You've achieved financial stability and can provide for your family. This represents long-term security and legacy.",
                reversed: "You may be experiencing financial instability or family conflicts. Focus on building security and harmony."
            },
            {
                name: "Page of Pentacles",
                number: 11,
                suit: "Pentacles",
                symbol: "📚",
                keywords: ["new opportunities", "learning", "practicality", "ambition"],
                upright: "A new practical opportunity is presenting itself. Stay focused on learning and developing new skills.",
                reversed: "You may be lacking focus or not taking advantage of opportunities. Stay alert and be ready to act."
            },
            {
                name: "Knight of Pentacles",
                number: 12,
                suit: "Pentacles",
                symbol: "🏇",
                keywords: ["reliability", "hard work", "methodical", "perseverance"],
                upright: "You're working steadily toward your goals with reliability and perseverance. This methodical approach will pay off.",
                reversed: "You may be working too slowly or not being reliable. Find a balance between thoroughness and efficiency."
            },
            {
                name: "Queen of Pentacles",
                number: 13,
                suit: "Pentacles",
                symbol: "👸",
                keywords: ["practicality", "nurturing", "abundance", "independence"],
                upright: "You're practical and nurturing, able to create abundance through hard work and care. Trust in your abilities.",
                reversed: "You may be neglecting self-care or not being practical in your approach. Focus on what truly matters."
            },
            {
                name: "King of Pentacles",
                number: 14,
                suit: "Pentacles",
                symbol: "👑",
                keywords: ["abundance", "security", "leadership", "practicality"],
                upright: "You have achieved abundance and security through practical leadership. You can help others achieve their goals.",
                reversed: "You may be too focused on material success or not sharing your abundance. Balance wealth with generosity."
            }
        ]
    }
};

// Spread definitions
const tarotSpreads = {
    single: {
        name: "Single Card",
        description: "A simple one-card reading for quick guidance",
        positions: [
            { name: "Guidance", description: "What you need to know right now" }
        ]
    },
    three: {
        name: "Three Card",
        description: "Past, Present, Future spread",
        positions: [
            { name: "Past", description: "What has led to this situation" },
            { name: "Present", description: "Your current situation" },
            { name: "Future", description: "What's coming your way" }
        ]
    },
    five: {
        name: "Five Card",
        description: "A comprehensive 5-card reading for deeper insight",
        positions: [
            { name: "Situation", description: "The heart of the matter" },
            { name: "Challenge", description: "What's blocking you" },
            { name: "Past", description: "What has led to this" },
            { name: "Future", description: "What's coming" },
            { name: "Advice", description: "What you should do" }
        ]
    },
    twelve: {
        name: "12 Month",
        description: "A year-long journey through 12 months",
        positions: [
            { name: "January", description: "New beginnings and fresh starts" },
            { name: "February", description: "Love, relationships, and partnerships" },
            { name: "March", description: "Communication and mental clarity" },
            { name: "April", description: "Home, family, and emotional security" },
            { name: "May", description: "Creativity, self-expression, and joy" },
            { name: "June", description: "Health, work, and daily routines" },
            { name: "July", description: "Love, romance, and relationships" },
            { name: "August", description: "Transformation and personal power" },
            { name: "September", description: "Higher learning and wisdom" },
            { name: "October", description: "Career, reputation, and achievements" },
            { name: "November", description: "Spirituality and inner growth" },
            { name: "December", description: "Completion and celebration" }
        ]
    }
};
