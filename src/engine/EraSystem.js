// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — Era Progression System
// ═══════════════════════════════════════════════════════════════

import { ERAS } from './constants.js';

export function getCurrentEra(eraIndex) {
    return ERAS[Math.min(eraIndex, ERAS.length - 1)];
}

export function getNextEra(eraIndex) {
    if (eraIndex >= ERAS.length - 1) return null;
    return ERAS[eraIndex + 1];
}

export function canAdvanceEra(resources, research, eraIndex) {
    const next = getNextEra(eraIndex);
    if (!next || !next.requirements) return false;

    const reqs = next.requirements;
    if (reqs.food && resources.food < reqs.food) return false;
    if (reqs.wood && resources.wood < reqs.wood) return false;
    if (reqs.stone && resources.stone < reqs.stone) return false;
    if (reqs.gold && resources.gold < reqs.gold) return false;
    if (reqs.research && research < reqs.research) return false;

    return true;
}

export function getAvailableBuildings(eraIndex) {
    const buildings = [];
    for (let i = 0; i <= eraIndex; i++) {
        buildings.push(...ERAS[i].buildings);
    }
    return buildings;
}

export function getAvailableUnits(eraIndex) {
    const units = [];
    for (let i = 0; i <= eraIndex; i++) {
        units.push(...ERAS[i].units);
    }
    return units;
}
