// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — AI Leader Personality Profiles
// ═══════════════════════════════════════════════════════════════

export const LEADER_PROFILES = {
    kael: {
        id: 'kael',
        name: 'Kael the Cunning',
        title: 'Master of Coin',
        portrait: '🦊',
        personality: { aggression: 0.3, honor: 0.2, greed: 0.9, trust: 0.4 },
        speechStyle: 'calculating',
        greetings: [
            "Ah, a visitor. I trust you've come with something... profitable?",
            "Every meeting is a transaction. What do you offer?",
            "Words are cheap. Resources are not. Speak quickly.",
        ],
        tradeAccept: [
            "Now that's the kind of deal I like. Consider it done.",
            "You have a merchant's eye. Agreed.",
            "Hmm... acceptable. The gold speaks for itself.",
        ],
        tradeReject: [
            "You insult me with such a paltry offer.",
            "I didn't become rich by accepting bad deals.",
            "Come back when you have something worth my time.",
        ],
        allianceAccept: [
            "An alliance... yes, there's profit in cooperation. For now.",
            "I'll work with you. But know this — I always keep score.",
        ],
        allianceReject: [
            "Trust is expensive. You haven't earned that price yet.",
            "I prefer partnerships with clear terms, not vague promises.",
        ],
        warDeclare: [
            "Your lands have resources I need. Nothing personal.",
            "The cost of peace has exceeded the profit of war.",
        ],
        betrayalResponse: [
            "I should have known. A liar's word is worthless currency.",
            "You'll pay for this — with interest.",
        ],
        peacefulResponse: [
            "A peaceful neighbor is a profitable neighbor.",
            "Perhaps we can find... mutually beneficial arrangements.",
        ],
        threatResponse: [
            "Threaten me? My coffers can hire armies you've never dreamed of.",
            "Interesting. But can you afford the war you're proposing?",
        ],
    },

    seraphina: {
        id: 'seraphina',
        name: 'Seraphina the Just',
        title: 'Shield of the People',
        portrait: '⚖️',
        personality: { aggression: 0.2, honor: 0.9, greed: 0.3, trust: 0.7 },
        speechStyle: 'noble',
        greetings: [
            "Welcome, ruler. I judge all by their deeds, not their words.",
            "Speak with honor, and you shall receive the same.",
            "I greet you in peace. May it remain so.",
        ],
        tradeAccept: [
            "A fair trade strengthens both our peoples. Agreed.",
            "Justice in commerce — this is how civilizations should deal.",
        ],
        tradeReject: [
            "This trade seems unbalanced. I must protect my people's interests.",
            "I seek fairness, and this proposal lacks it.",
        ],
        allianceAccept: [
            "An alliance built on honor will stand the test of time. I accept.",
            "Together we can bring justice to this land. You have my word.",
        ],
        allianceReject: [
            "Your past actions give me pause. Prove your honor first.",
            "I cannot ally with those whose character remains unclear.",
        ],
        warDeclare: [
            "You have left me no choice. Justice demands action.",
            "This war is not wanted, but your crimes against our people cannot stand.",
        ],
        betrayalResponse: [
            "Your betrayal wounds me deeply. I will not forget this dishonor.",
            "You have broken a sacred trust. There will be a reckoning.",
        ],
        peacefulResponse: [
            "Peace is the highest virtue. You have my respect.",
            "May our peoples prosper together in harmony.",
        ],
        threatResponse: [
            "Threats do not sway the just. Stand down, or face righteous defense.",
            "I do not fear threats. I fear only dishonor.",
        ],
    },

    bjoern: {
        id: 'bjoern',
        name: 'Bjoern Ironhand',
        title: 'the Warlord',
        portrait: '⚔️',
        personality: { aggression: 0.8, honor: 0.6, greed: 0.4, trust: 0.3 },
        speechStyle: 'blunt',
        greetings: [
            "Speak. My patience is shorter than my blade.",
            "Another soft ruler seeking words instead of action.",
            "If you're here to fight, good. If not, be brief.",
        ],
        tradeAccept: [
            "Fine. Your resources will strengthen my armies.",
            "A practical deal. I accept.",
        ],
        tradeReject: [
            "I don't trade. I take what I need.",
            "Keep your trinkets. I have no use for them.",
        ],
        allianceAccept: [
            "You want an ally on the battlefield? Then prove your strength.",
            "An alliance between warriors. Show me you can fight.",
        ],
        allianceReject: [
            "The weak seek allies. The strong stand alone.",
            "You're not worth the blade at your side.",
        ],
        warDeclare: [
            "ENOUGH TALK! My armies march at dawn!",
            "The time for words is over. Prepare your defenses.",
        ],
        betrayalResponse: [
            "A coward AND a liar. You will not survive this mistake.",
            "You dare betray Ironhand? Your lands will burn.",
        ],
        peacefulResponse: [
            "Peace... bores me. But I'll tolerate it. For now.",
            "Fine. We have no quarrel. Yet.",
        ],
        threatResponse: [
            "Ha! You threaten ME? I've crushed bigger foes before breakfast.",
            "Bold words for someone with such a tiny army.",
        ],
    },
};

export function getRandomResponse(leader, category) {
    const responses = leader[category];
    if (!responses || responses.length === 0) return "...";
    return responses[Math.floor(Math.random() * responses.length)];
}
