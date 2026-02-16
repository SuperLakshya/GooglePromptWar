// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — Procedural Name Generator
// ═══════════════════════════════════════════════════════════════

const prefixes = ['Ael', 'Bor', 'Cal', 'Dra', 'El', 'Fen', 'Gor', 'Hal', 'Ith', 'Kel', 'Lor', 'Mor', 'Nor', 'Oth', 'Pal', 'Ral', 'Sol', 'Tor', 'Val', 'Wyn'];
const suffixes = ['heim', 'haven', 'ford', 'stead', 'wall', 'mere', 'dale', 'moor', 'spire', 'keep', 'hold', 'gate', 'bridge', 'field', 'crest'];

let counter = 0;

export function generateSettlementName() {
    const prefix = prefixes[counter % prefixes.length];
    const suffix = suffixes[Math.floor(counter / prefixes.length) % suffixes.length];
    counter++;
    return prefix + suffix;
}

export function resetNameGenerator() {
    counter = 0;
}
