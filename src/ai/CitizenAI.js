// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — Living Civilization / Citizen AI
// Morale, autonomous behavior, and advisor suggestions
// ═══════════════════════════════════════════════════════════════

// ── Morale Calculation ──────────────────────────────────────
export function calculateMorale(civ, buildings) {
    let morale = 50; // Base morale

    // Food supply effect
    const foodPerCapita = civ.resources.food / Math.max(1, civ.units.length);
    if (foodPerCapita > 10) morale += 15;
    else if (foodPerCapita > 5) morale += 5;
    else if (foodPerCapita < 2) morale -= 20;
    else if (foodPerCapita < 5) morale -= 10;

    // Housing effect
    const civBuildings = buildings.filter(b => b.civId === civ.id && b.progress >= 1);
    const houses = civBuildings.filter(b => b.type === 'house').length;
    const popCapacity = 5 + houses * 5; // Town center + houses
    if (civ.units.length > popCapacity) morale -= 15;
    else morale += 5;

    // Temple/Cathedral bonus
    const temples = civBuildings.filter(b => b.type === 'temple' || b.type === 'cathedral');
    for (const t of temples) {
        morale += (t.type === 'cathedral' ? 15 : 8);
    }

    // War weariness
    if (civ.atWar) morale -= 10;
    if (civ.recentCasualties > 0) morale -= Math.min(20, civ.recentCasualties * 3);

    // Victory boost
    if (civ.recentVictories > 0) morale += Math.min(15, civ.recentVictories * 5);

    return Math.max(0, Math.min(100, Math.round(morale)));
}

// ── Citizen Advisor Suggestions ─────────────────────────────
export function generateAdvisorSuggestions(civ, tiles, buildings, enemyData) {
    const suggestions = [];

    // Resource warnings
    if (civ.resources.food < 50) {
        suggestions.push({
            type: 'critical',
            icon: '🌾',
            message: 'Food supplies are dangerously low! Build farms or assign more gatherers.',
            action: 'BUILD_FARM',
        });
    }
    if (civ.resources.wood < 30) {
        suggestions.push({
            type: 'warning',
            icon: '🪓',
            message: 'We need more wood. Consider building a Lumber Camp near forests.',
            action: 'BUILD_LUMBER_CAMP',
        });
    }

    // Population management
    const workers = civ.units.filter(u => u.type === 'worker');
    const military = civ.units.filter(u => u.type !== 'worker' && u.type !== 'scout');
    if (workers.length < 3) {
        suggestions.push({
            type: 'info',
            icon: '👷',
            message: 'We have few workers. Our economy will suffer without more villagers.',
            action: 'TRAIN_VILLAGER',
        });
    }

    // Military advice
    if (military.length === 0 && civ.eraIndex >= 1) {
        suggestions.push({
            type: 'warning',
            icon: '⚔️',
            message: 'We have no military forces! We are vulnerable to attack.',
            action: 'TRAIN_MILITARY',
        });
    }

    // Enemy spotted
    if (enemyData?.nearbyEnemies > 0) {
        suggestions.push({
            type: 'critical',
            icon: '⚠️',
            message: `Enemy scouts spotted near our borders! ${enemyData.nearbyEnemies} hostile units detected.`,
            action: 'ALERT',
        });
    }

    // Era advancement
    if (civ.canAdvanceEra) {
        suggestions.push({
            type: 'opportunity',
            icon: '🏛️',
            message: 'We have the resources to advance to the next age! A new era of prosperity awaits.',
            action: 'ADVANCE_ERA',
        });
    }

    // Expansion suggestions
    const civBuildings = buildings.filter(b => b.civId === civ.id && b.progress >= 1);
    if (civBuildings.length < 3 && civ.resources.wood > 80) {
        suggestions.push({
            type: 'info',
            icon: '🏗️',
            message: 'Our settlement is small. Expand with more buildings to grow our civilization.',
            action: 'EXPAND',
        });
    }

    // Morale warnings
    if (civ.morale < 30) {
        suggestions.push({
            type: 'critical',
            icon: '😠',
            message: 'Our people are deeply unhappy! Civil unrest may follow if morale doesn\'t improve.',
            action: 'IMPROVE_MORALE',
        });
    } else if (civ.morale > 80) {
        suggestions.push({
            type: 'positive',
            icon: '😊',
            message: 'Our people are thriving! High morale is boosting productivity across the settlement.',
            action: null,
        });
    }

    return suggestions;
}

// ── Autonomous Citizen Behavior ─────────────────────────────
export function autoAssignIdleWorkers(units, tiles, buildings, civId) {
    const idleWorkers = units.filter(
        u => u.civId === civId && u.type === 'worker' && (!u.task || u.task === 'idle')
    );

    const assignments = [];

    for (const worker of idleWorkers) {
        // Find nearest resource-rich tile
        let bestTile = null;
        let bestDist = Infinity;
        let bestResource = null;

        for (const tile of tiles) {
            if (tile.terrain.id === 'water' || tile.resourcesRemaining <= 0) continue;
            const dist = Math.abs(tile.q - worker.position.q) + Math.abs(tile.r - worker.position.r);
            if (dist < bestDist && dist < 5) {
                // Prioritize based on what's needed most
                const resources = ['food', 'wood', 'stone', 'gold'];
                for (const res of resources) {
                    if (tile.terrain[res] > 0) {
                        bestTile = tile;
                        bestDist = dist;
                        bestResource = res;
                        break;
                    }
                }
            }
        }

        if (bestTile) {
            assignments.push({
                unitId: worker.id,
                task: 'gather',
                target: { q: bestTile.q, r: bestTile.r },
                resource: bestResource,
            });
        }
    }

    return assignments;
}

// ── Civil Unrest Events ─────────────────────────────────────
export function checkForUnrest(morale, unitCount) {
    if (morale > 40) return null;

    const unrestChance = (40 - morale) / 100; // 0-40% chance
    if (Math.random() < unrestChance) {
        if (morale < 15) {
            return {
                type: 'revolt',
                severity: 'critical',
                message: 'Citizens are revolting! Production has halted and some workers have fled!',
                effect: { productionMod: 0, deserters: Math.ceil(unitCount * 0.1) },
            };
        }
        return {
            type: 'unrest',
            severity: 'warning',
            message: 'Civil unrest! Workers are slowing down in protest.',
            effect: { productionMod: 0.5, deserters: 0 },
        };
    }
    return null;
}

// ── Citizen Skill Growth ────────────────────────────────────
export function growSkills(units) {
    return units.map(u => {
        if (!u.skills) u.skills = { gathering: 0, building: 0, fighting: 0 };
        if (u.task === 'gather') {
            u.skills.gathering = Math.min(10, (u.skills.gathering || 0) + 0.01);
        } else if (u.task === 'build') {
            u.skills.building = Math.min(10, (u.skills.building || 0) + 0.01);
        } else if (u.type !== 'worker') {
            u.skills.fighting = Math.min(10, (u.skills.fighting || 0) + 0.005);
        }
        return u;
    });
}
