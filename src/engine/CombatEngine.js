// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — Combat Engine
// ═══════════════════════════════════════════════════════════════

import { TYPE_ADVANTAGE, TERRAIN } from './constants.js';

export function resolveCombat(attacker, defender, attackerTerrain, defenderTerrain) {
    // Type advantage multiplier
    const advantage = TYPE_ADVANTAGE[attacker.unitType]?.[defender.unitType] || 1.0;

    // Terrain defense bonus
    const terrainBonus = getTerrainDefBonus(defenderTerrain);

    // Calculate damage
    const atkDamage = Math.max(1, Math.floor(
        attacker.atk * advantage - defender.def * terrainBonus
    ));
    const defDamage = Math.max(1, Math.floor(
        defender.atk * (1 / advantage) * 0.6 - attacker.def * 0.5
    ));

    // Apply damage
    const result = {
        attackerDamage: defDamage,
        defenderDamage: atkDamage,
        attackerSurvived: attacker.hp - defDamage > 0,
        defenderSurvived: defender.hp - atkDamage > 0,
        attackerHp: Math.max(0, attacker.hp - defDamage),
        defenderHp: Math.max(0, defender.hp - atkDamage),
    };

    return result;
}

function getTerrainDefBonus(terrain) {
    if (!terrain) return 1;
    switch (terrain.id) {
        case 'forest': return 1.3;
        case 'mountain': return 1.5;
        case 'plains': return 1.0;
        case 'desert': return 0.9;
        default: return 1.0;
    }
}

// Resolve all pending combats in a tick
export function processAllCombat(civilizations, tiles) {
    const combatResults = [];

    // Find all tiles where units from different civs coexist
    const tileUnits = {};
    for (const civ of civilizations) {
        for (const unit of civ.units) {
            if (unit.unitType === 'worker' || unit.unitType === 'scout') continue;
            const key = `${unit.position.q},${unit.position.r}`;
            if (!tileUnits[key]) tileUnits[key] = [];
            tileUnits[key].push({ ...unit, civId: civ.id });
        }
    }

    for (const [key, units] of Object.entries(tileUnits)) {
        const civIds = [...new Set(units.map(u => u.civId))];
        if (civIds.length < 2) continue;

        // Combat happens! Pair up units
        const attackers = units.filter(u => u.civId === civIds[0]);
        const defenders = units.filter(u => u.civId === civIds[1]);

        const [q, r] = key.split(',').map(Number);
        const tile = tiles.find(t => t.q === q && t.r === r);
        const terrain = tile?.terrain;

        for (let i = 0; i < Math.min(attackers.length, defenders.length); i++) {
            const result = resolveCombat(attackers[i], defenders[i], terrain, terrain);
            combatResults.push({
                attackerId: attackers[i].id,
                defenderId: defenders[i].id,
                attackerCivId: attackers[i].civId,
                defenderCivId: defenders[i].civId,
                ...result,
                position: { q, r },
            });
        }
    }

    return combatResults;
}
