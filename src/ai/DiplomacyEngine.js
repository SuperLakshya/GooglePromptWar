// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — AI Diplomacy Engine
// Natural language negotiation with personality-driven leaders
// ═══════════════════════════════════════════════════════════════

import { LEADER_PROFILES, getRandomResponse } from './LeaderProfiles.js';

// ── Intent Detection ────────────────────────────────────────
const INTENT_PATTERNS = [
    { intent: 'OFFER_TRADE', keywords: ['trade', 'exchange', 'give you', 'swap', 'offer', 'deal', 'barter', 'sell', 'buy'] },
    { intent: 'REQUEST_ALLIANCE', keywords: ['ally', 'alliance', 'together', 'join forces', 'unite', 'partner', 'friends', 'cooperate'] },
    { intent: 'THREATEN', keywords: ['attack', 'destroy', 'crush', 'war', 'fight', 'burn', 'conquer', 'invade', 'threaten', 'army'] },
    { intent: 'REQUEST_PEACE', keywords: ['peace', 'truce', 'ceasefire', 'stop fighting', 'end war', 'treaty', 'negotiate', 'calm'] },
    { intent: 'COMPLIMENT', keywords: ['respect', 'admire', 'strong', 'wise', 'great', 'impressive', 'honor', 'friend'] },
    { intent: 'INSULT', keywords: ['weak', 'coward', 'fool', 'pathetic', 'worthless', 'stupid', 'useless'] },
    { intent: 'PROPOSE_JOINT_ATTACK', keywords: ['attack together', 'join attack', 'help me attack', 'wage war on', 'fight against', 'take down'] },
    { intent: 'REQUEST_RESOURCES', keywords: ['need', 'spare', 'lend', 'borrow', 'help me', 'give me', 'send me', 'share'] },
    { intent: 'BLUFF', keywords: ['massive army', 'powerful forces', 'unstoppable', 'you cannot win', 'surrender'] },
    { intent: 'GREETING', keywords: ['hello', 'hi', 'greetings', 'good day', 'welcome', 'hey'] },
];

// Detect resource mentions
const RESOURCE_PATTERNS = [
    { resource: 'food', keywords: ['food', 'grain', 'wheat', 'farm'] },
    { resource: 'wood', keywords: ['wood', 'lumber', 'timber', 'trees'] },
    { resource: 'stone', keywords: ['stone', 'rock', 'quarry', 'marble'] },
    { resource: 'gold', keywords: ['gold', 'coin', 'money', 'treasure', 'wealth'] },
];

export function parsePlayerMessage(message) {
    const lower = message.toLowerCase();

    // Detect primary intent
    let detectedIntent = 'GENERAL';
    let bestScore = 0;
    for (const pattern of INTENT_PATTERNS) {
        const score = pattern.keywords.filter(kw => lower.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            detectedIntent = pattern.intent;
        }
    }

    // Detect mentioned resources
    const mentionedResources = [];
    for (const rp of RESOURCE_PATTERNS) {
        if (rp.keywords.some(kw => lower.includes(kw))) {
            mentionedResources.push(rp.resource);
        }
    }

    return { intent: detectedIntent, resources: mentionedResources, raw: message };
}

// ── Leader Decision Making ──────────────────────────────────
export function evaluateDiplomacy(leaderId, parsed, gameState) {
    const profile = LEADER_PROFILES[leaderId];
    if (!profile) return { response: "...", action: null };

    const { personality } = profile;
    const memory = gameState.diplomacyMemory?.[leaderId] || [];
    const relationship = gameState.relationships?.[leaderId] || 0;

    // Calculate trust modifier from memory
    const betrayals = memory.filter(m => m.type === 'betrayal').length;
    const honorsKept = memory.filter(m => m.type === 'honored').length;
    const dynamicTrust = Math.max(0, Math.min(1,
        personality.trust + honorsKept * 0.1 - betrayals * 0.3
    ));

    // Evaluate based on intent
    const result = evaluateIntent(parsed.intent, profile, dynamicTrust, relationship, gameState, parsed);

    return result;
}

function evaluateIntent(intent, profile, trust, relationship, gameState, parsed) {
    const p = profile.personality;
    const playerStrength = gameState.playerMilitaryStrength || 0;
    const aiStrength = gameState.aiMilitaryStrength || 0;
    const strengthRatio = playerStrength / Math.max(1, aiStrength);

    switch (intent) {
        case 'GREETING':
            return {
                response: getRandomResponse(profile, 'greetings'),
                action: null,
                mood: 'neutral',
            };

        case 'OFFER_TRADE': {
            // Greedy leaders want good deals; honorable ones accept fair trades
            const acceptChance = p.greed < 0.5 ? 0.7 : (trust > 0.5 ? 0.6 : 0.3);
            const accepts = Math.random() < acceptChance + relationship * 0.2;
            return {
                response: getRandomResponse(profile, accepts ? 'tradeAccept' : 'tradeReject'),
                action: accepts ? { type: 'TRADE_ACCEPTED', resources: parsed.resources } : null,
                mood: accepts ? 'positive' : 'negative',
            };
        }

        case 'REQUEST_ALLIANCE': {
            const acceptChance = trust * 0.5 + (1 - p.aggression) * 0.3 + relationship * 0.2;
            const accepts = Math.random() < acceptChance;
            return {
                response: getRandomResponse(profile, accepts ? 'allianceAccept' : 'allianceReject'),
                action: accepts ? { type: 'ALLIANCE_FORMED' } : null,
                mood: accepts ? 'positive' : 'cautious',
            };
        }

        case 'THREATEN': {
            // Aggressive leaders respond with aggression; fearful ones may cower
            if (p.aggression > 0.6 || strengthRatio < 1.5) {
                return {
                    response: getRandomResponse(profile, 'threatResponse'),
                    action: p.aggression > 0.7 ? { type: 'DECLARE_WAR' } : null,
                    mood: 'hostile',
                };
            }
            return {
                response: "Perhaps... we can discuss this calmly.",
                action: null,
                mood: 'fearful',
            };
        }

        case 'REQUEST_PEACE': {
            const acceptChance = p.honor * 0.4 + (1 - p.aggression) * 0.3 + trust * 0.3;
            const accepts = Math.random() < acceptChance;
            return {
                response: accepts
                    ? getRandomResponse(profile, 'peacefulResponse')
                    : `My armies are already in motion. Your pleas come too late.`,
                action: accepts ? { type: 'PEACE_ACCEPTED' } : null,
                mood: accepts ? 'positive' : 'hostile',
            };
        }

        case 'PROPOSE_JOINT_ATTACK': {
            const acceptChance = p.aggression * 0.5 + trust * 0.3 + (relationship > 0 ? 0.2 : 0);
            const accepts = Math.random() < acceptChance;
            return {
                response: accepts
                    ? `An intriguing proposal. Let us strike together — but know that I claim my share of the spoils.`
                    : `I won't risk my people on your schemes.`,
                action: accepts ? { type: 'JOINT_ATTACK_AGREED' } : null,
                mood: accepts ? 'aggressive' : 'cautious',
            };
        }

        case 'COMPLIMENT':
            return {
                response: getRandomResponse(profile, 'peacefulResponse'),
                action: { type: 'RELATIONSHIP_BOOST', amount: 0.05 },
                mood: 'positive',
            };

        case 'INSULT':
            return {
                response: getRandomResponse(profile, 'threatResponse'),
                action: { type: 'RELATIONSHIP_DROP', amount: -0.1 },
                mood: 'hostile',
            };

        case 'BLUFF': {
            // Smart leaders see through bluffs
            const seesThrough = (1 - p.greed) * 0.5 + (trust < 0.4 ? 0.3 : 0);
            if (Math.random() < seesThrough) {
                return {
                    response: `Your bluster doesn't fool me. I see the truth in your supply lines.`,
                    action: { type: 'RELATIONSHIP_DROP', amount: -0.05 },
                    mood: 'skeptical',
                };
            }
            return {
                response: `...I see. Perhaps we should... reconsider our position.`,
                action: null,
                mood: 'fearful',
            };
        }

        case 'REQUEST_RESOURCES': {
            const willHelp = trust > 0.5 && p.greed < 0.6 && relationship > -0.1;
            return {
                response: willHelp
                    ? `Very well. I'll send what I can spare. Remember this generosity.`
                    : getRandomResponse(profile, 'tradeReject'),
                action: willHelp ? { type: 'RESOURCES_GIFTED', resources: parsed.resources } : null,
                mood: willHelp ? 'positive' : 'negative',
            };
        }

        default:
            return {
                response: getRandomResponse(profile, 'greetings'),
                action: null,
                mood: 'neutral',
            };
    }
}

// ── Memory Management ───────────────────────────────────────
export function recordDiplomacyEvent(memory, leaderId, event) {
    if (!memory[leaderId]) memory[leaderId] = [];
    memory[leaderId].push({
        ...event,
        timestamp: Date.now(),
    });
    // Keep last 20 events
    if (memory[leaderId].length > 20) {
        memory[leaderId] = memory[leaderId].slice(-20);
    }
    return memory;
}

export function getRelationshipSummary(memory, leaderId) {
    const events = memory[leaderId] || [];
    let score = 0;
    for (const e of events) {
        switch (e.type) {
            case 'betrayal': score -= 0.3; break;
            case 'honored': score += 0.1; break;
            case 'trade': score += 0.05; break;
            case 'war': score -= 0.5; break;
            case 'peace': score += 0.2; break;
            case 'gift': score += 0.15; break;
            case 'insult': score -= 0.1; break;
            case 'compliment': score += 0.05; break;
        }
    }
    return Math.max(-1, Math.min(1, score));
}
