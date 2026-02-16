// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — Resource Manager
// ═══════════════════════════════════════════════════════════════

import { BUILDINGS } from './constants.js';

export function gatherResources(civ, tiles, allBuildings) {
    const bonuses = { food: 0, wood: 0, stone: 0, gold: 0 };

    // Calculate building bonuses
    const civBuildings = allBuildings.filter(b => b.civId === civ.id && b.progress >= 1);
    for (const b of civBuildings) {
        const def = BUILDINGS[b.type];
        if (def?.gatherBonus) {
            for (const [res, amt] of Object.entries(def.gatherBonus)) {
                bonuses[res] = (bonuses[res] || 0) + amt;
            }
        }
    }

    // Count workers and their assignments
    const workers = civ.units.filter(u => u.type === 'worker' && u.task === 'gather');
    const moraleMod = civ.morale / 100; // 0-1 multiplier

    const gathered = { food: 0, wood: 0, stone: 0, gold: 0 };

    for (const worker of workers) {
        const tile = tiles.find(t => t.q === worker.position.q && t.r === worker.position.r);
        if (!tile || tile.resourcesRemaining <= 0) continue;

        const terrain = tile.terrain;
        const resources = ['food', 'wood', 'stone', 'gold'];
        for (const res of resources) {
            if (terrain[res] > 0) {
                const base = terrain[res];
                const bonus = bonuses[res] || 0;
                const skillMod = 1 + (worker.skills?.gathering || 0) * 0.1;
                const amount = (base + bonus) * moraleMod * skillMod;
                gathered[res] += amount;
            }
        }

        // Deplete tile resources slightly
        tile.resourcesRemaining = Math.max(0, tile.resourcesRemaining - 1);
    }

    // Passive food from farms (regardless of worker assignment)
    const farms = civBuildings.filter(b => b.type === 'farm');
    gathered.food += farms.length * 2 * moraleMod;

    return gathered;
}

export function canAfford(resources, cost) {
    for (const [res, amount] of Object.entries(cost)) {
        if ((resources[res] || 0) < amount) return false;
    }
    return true;
}

export function spendResources(resources, cost) {
    const result = { ...resources };
    for (const [res, amount] of Object.entries(cost)) {
        result[res] = (result[res] || 0) - amount;
    }
    return result;
}

export function addResources(resources, gathered) {
    const result = { ...resources };
    for (const [res, amount] of Object.entries(gathered)) {
        result[res] = (result[res] || 0) + amount;
    }
    return result;
}

// Food consumption: each unit eats
export function consumeFood(resources, unitCount) {
    const consumption = unitCount * 0.3;
    return {
        ...resources,
        food: Math.max(0, resources.food - consumption),
    };
}
