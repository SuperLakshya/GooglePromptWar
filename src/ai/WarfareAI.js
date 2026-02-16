// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — Adaptive AI Warfare System
// Learns and counters player strategies in real-time
// ═══════════════════════════════════════════════════════════════

import { UNITS } from '../engine/constants.js';

// ── Player Pattern Tracker ──────────────────────────────────
export function createWarfareTracker() {
    return {
        // Unit composition tracking
        unitHistory: [],
        cavalryCount: 0,
        infantryCount: 0,
        rangedCount: 0,
        siegeCount: 0,
        totalMilitary: 0,

        // Strategy pattern scores (0-1)
        aggressionScore: 0.5,
        turtleScore: 0.5,
        rushScore: 0.5,
        economyFocusScore: 0.5,

        // Attack timing
        attackTimings: [],
        lastAttackTick: 0,

        // Counter-strategy currently in use
        currentStrategy: 'balanced',
        strategyConfidence: 0,
    };
}

// ── Observation: Track player actions ───────────────────────
export function observePlayerUnits(tracker, playerUnits, currentTick) {
    const military = playerUnits.filter(u => u.type !== 'worker' && u.type !== 'scout');

    tracker.cavalryCount = military.filter(u => u.unitType === 'cavalry').length;
    tracker.infantryCount = military.filter(u => u.unitType === 'infantry').length;
    tracker.rangedCount = military.filter(u => u.unitType === 'ranged').length;
    tracker.siegeCount = military.filter(u => u.unitType === 'siege').length;
    tracker.totalMilitary = military.length;

    // Record snapshot every 40 ticks (10 seconds)
    if (currentTick % 40 === 0) {
        tracker.unitHistory.push({
            tick: currentTick,
            cavalry: tracker.cavalryCount,
            infantry: tracker.infantryCount,
            ranged: tracker.rangedCount,
            siege: tracker.siegeCount,
            total: tracker.totalMilitary,
        });

        // Keep last 30 snapshots
        if (tracker.unitHistory.length > 30) {
            tracker.unitHistory = tracker.unitHistory.slice(-30);
        }
    }

    return tracker;
}

export function observePlayerAttack(tracker, position, tick) {
    tracker.attackTimings.push(tick);
    tracker.lastAttackTick = tick;

    // Calculate aggression score
    const recentAttacks = tracker.attackTimings.filter(t => tick - t < 400); // last ~100 seconds
    tracker.aggressionScore = Math.min(1, recentAttacks.length / 5);

    // Rush detection (attacks before tick 200)
    if (tick < 200 && recentAttacks.length > 0) {
        tracker.rushScore = Math.min(1, tracker.rushScore + 0.2);
    }

    return tracker;
}

// ── Analysis: Detect player strategy ────────────────────────
export function analyzePlayerStrategy(tracker) {
    const { cavalryCount, infantryCount, rangedCount, siegeCount, totalMilitary } = tracker;

    if (totalMilitary === 0) {
        tracker.turtleScore = Math.min(1, tracker.turtleScore + 0.05);
        tracker.economyFocusScore = Math.min(1, tracker.economyFocusScore + 0.05);
        return tracker;
    }

    const cavalryRatio = cavalryCount / totalMilitary;
    const infantryRatio = infantryCount / totalMilitary;
    const rangedRatio = rangedCount / totalMilitary;
    const siegeRatio = siegeCount / totalMilitary;

    // Determine dominant strategy
    let dominant = 'balanced';
    let confidence = 0;

    if (cavalryRatio > 0.5) {
        dominant = 'cavalry_heavy';
        confidence = cavalryRatio;
    } else if (infantryRatio > 0.5) {
        dominant = 'infantry_heavy';
        confidence = infantryRatio;
    } else if (rangedRatio > 0.5) {
        dominant = 'ranged_heavy';
        confidence = rangedRatio;
    } else if (siegeRatio > 0.3) {
        dominant = 'siege_focused';
        confidence = siegeRatio;
    }

    // Turtle detection
    if (tracker.aggressionScore < 0.2 && totalMilitary < 5) {
        dominant = 'turtle';
        tracker.turtleScore = Math.min(1, tracker.turtleScore + 0.1);
        confidence = 0.6;
    }

    // Rush detection
    if (tracker.rushScore > 0.5) {
        dominant = 'rusher';
        confidence = tracker.rushScore;
    }

    tracker.currentStrategy = dominant;
    tracker.strategyConfidence = confidence;

    return tracker;
}

// ── Counter-Strategy: AI Response ───────────────────────────
export function getCounterStrategy(tracker) {
    const { currentStrategy, strategyConfidence } = tracker;

    // Only activate counter-strategies when confidence is high enough
    if (strategyConfidence < 0.4) {
        return {
            strategy: 'balanced',
            unitPriority: ['infantry', 'archer', 'cavalry'],
            buildPriority: ['barracks', 'wall'],
            description: 'Maintaining balanced forces while studying the enemy.',
        };
    }

    switch (currentStrategy) {
        case 'cavalry_heavy':
            return {
                strategy: 'anti_cavalry',
                unitPriority: ['infantry', 'swordsman'],  // Infantry beats cavalry
                buildPriority: ['barracks', 'wall', 'tower'],
                description: 'Detected heavy cavalry composition. Building spearmen and fortifications.',
                notification: '⚔️ Enemy AI has adapted: Heavy anti-cavalry defenses observed!',
            };

        case 'infantry_heavy':
            return {
                strategy: 'ranged_kite',
                unitPriority: ['archer', 'crossbowman', 'cavalry'],
                buildPriority: ['barracks', 'tower'],
                description: 'Detected infantry focus. Deploying ranged units and fast cavalry flankers.',
                notification: '🏹 Enemy AI has adapted: Ranged units deployed to counter your infantry!',
            };

        case 'ranged_heavy':
            return {
                strategy: 'cavalry_rush',
                unitPriority: ['cavalry', 'knight'],
                buildPriority: ['barracks'],
                description: 'Detected ranged composition. Training fast cavalry to close the gap.',
                notification: '🐴 Enemy AI has adapted: Fast cavalry units are being deployed!',
            };

        case 'siege_focused':
            return {
                strategy: 'aggressive_raid',
                unitPriority: ['cavalry', 'infantry'],
                buildPriority: ['barracks'],
                description: 'Detected siege buildup. Launching raids to destroy siege before deployment.',
                notification: '⚡ Enemy AI has adapted: Aggressive raiding parties targeting your siege!',
            };

        case 'turtle':
            return {
                strategy: 'economic_pressure',
                unitPriority: ['archer', 'siegeRam'],
                buildPriority: ['market', 'siegeWorkshop'],
                description: 'Detected defensive tactics. Building economy and siege to break defenses.',
                notification: '🏗️ Enemy AI has adapted: Economic buildup and siege preparations underway!',
            };

        case 'rusher':
            return {
                strategy: 'early_defense',
                unitPriority: ['militia', 'infantry'],
                buildPriority: ['wall', 'tower', 'barracks'],
                description: 'Detected rush tactics. Fortifying early and building defensive units.',
                notification: '🧱 Enemy AI has adapted: Early fortifications being constructed!',
            };

        default:
            return {
                strategy: 'balanced',
                unitPriority: ['infantry', 'archer', 'cavalry'],
                buildPriority: ['barracks', 'wall'],
                description: 'Maintaining balanced forces.',
            };
    }
}

// ── AI Army Management ──────────────────────────────────────
export function decideAIActions(aiCiv, counterStrategy, gameState) {
    const actions = [];
    const { unitPriority, buildPriority } = counterStrategy;

    // Train priority units if can afford
    for (const unitType of unitPriority) {
        const def = UNITS[unitType];
        if (!def) continue;

        const canAfford = Object.entries(def.cost).every(
            ([res, amt]) => (aiCiv.resources[res] || 0) >= amt
        );
        if (canAfford) {
            actions.push({ type: 'TRAIN_UNIT', unitType, cost: def.cost });
            break; // One unit per tick
        }
    }

    // Should AI attack?
    const militaryStrength = aiCiv.units.filter(u => u.type !== 'worker').length;
    if (militaryStrength >= 5 && counterStrategy.strategy !== 'early_defense') {
        if (Math.random() < 0.02) { // Low chance per tick, builds up
            actions.push({ type: 'LAUNCH_ATTACK' });
        }
    }

    return actions;
}
