// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — Game Constants & Balance Numbers
// ═══════════════════════════════════════════════════════════════

export const TICK_RATE = 4; // ticks per second
export const TICK_MS = 1000 / TICK_RATE;

// ── Map ──────────────────────────────────────────────────────
export const MAP_COLS = 30;
export const MAP_ROWS = 20;
export const HEX_SIZE = 36;

export const TERRAIN = {
    PLAINS: { id: 'plains', color: '#4a7c59', name: 'Plains', food: 2, wood: 0, stone: 0, gold: 0, moveCost: 1 },
    FOREST: { id: 'forest', color: '#2d5a27', name: 'Forest', food: 1, wood: 3, stone: 0, gold: 0, moveCost: 1.5 },
    MOUNTAIN: { id: 'mountain', color: '#6b6b6b', name: 'Mountain', food: 0, wood: 0, stone: 3, gold: 1, moveCost: 3 },
    WATER: { id: 'water', color: '#2a6496', name: 'Water', food: 3, wood: 0, stone: 0, gold: 0, moveCost: 99 },
    DESERT: { id: 'desert', color: '#c2a645', name: 'Desert', food: 0, wood: 0, stone: 1, gold: 2, moveCost: 2 },
};

// ── Resources ────────────────────────────────────────────────
export const STARTING_RESOURCES = { food: 150, wood: 150, stone: 100, gold: 50 };

// ── Eras ─────────────────────────────────────────────────────
export const ERAS = [
    {
        id: 'stone',
        name: 'Stone Age',
        index: 0,
        color: '#8B7355',
        requirements: null,
        buildings: ['townCenter', 'house', 'farm', 'lumberCamp', 'quarry'],
        units: ['villager', 'scout', 'militia'],
    },
    {
        id: 'bronze',
        name: 'Bronze Age',
        index: 1,
        color: '#CD853F',
        requirements: { food: 400, wood: 200, research: 100 },
        buildings: ['barracks', 'market', 'granary', 'wall'],
        units: ['infantry', 'archer', 'cavalry'],
    },
    {
        id: 'iron',
        name: 'Iron Age',
        index: 2,
        color: '#708090',
        requirements: { food: 800, wood: 500, stone: 300, research: 250 },
        buildings: ['fortress', 'temple', 'siegeWorkshop', 'tower'],
        units: ['swordsman', 'crossbowman', 'knight', 'siegeRam'],
    },
    {
        id: 'medieval',
        name: 'Medieval Age',
        index: 3,
        color: '#4682B4',
        requirements: { food: 1500, wood: 1000, stone: 800, gold: 400, research: 500 },
        buildings: ['castle', 'university', 'cathedral'],
        units: ['heavyKnight', 'longbowman', 'trebuchet'],
    },
    {
        id: 'renaissance',
        name: 'Renaissance',
        index: 4,
        color: '#DAA520',
        requirements: { food: 3000, wood: 2000, stone: 1500, gold: 1000, research: 1000 },
        buildings: ['palace', 'academy', 'arsenal'],
        units: ['musketeer', 'cannon', 'eliteGuard'],
    },
];

// ── Buildings ────────────────────────────────────────────────
export const BUILDINGS = {
    townCenter: { name: 'Town Center', cost: { wood: 0, stone: 0 }, hp: 500, buildTime: 0, produces: ['villager'], gatherBonus: {}, icon: '🏛️' },
    house: { name: 'House', cost: { wood: 30 }, hp: 100, buildTime: 15, produces: [], popBonus: 5, icon: '🏠' },
    farm: { name: 'Farm', cost: { wood: 60 }, hp: 80, buildTime: 20, produces: [], gatherBonus: { food: 3 }, icon: '🌾' },
    lumberCamp: { name: 'Lumber Camp', cost: { wood: 40, stone: 10 }, hp: 100, buildTime: 15, produces: [], gatherBonus: { wood: 3 }, icon: '🪓' },
    quarry: { name: 'Quarry', cost: { wood: 40, stone: 10 }, hp: 120, buildTime: 15, produces: [], gatherBonus: { stone: 3 }, icon: '⛏️' },
    barracks: { name: 'Barracks', cost: { wood: 120, stone: 50 }, hp: 250, buildTime: 30, produces: ['infantry', 'archer'], icon: '⚔️' },
    market: { name: 'Market', cost: { wood: 100, gold: 30 }, hp: 150, buildTime: 25, produces: [], gatherBonus: { gold: 2 }, icon: '🏪' },
    granary: { name: 'Granary', cost: { wood: 80 }, hp: 120, buildTime: 20, produces: [], gatherBonus: { food: 2 }, icon: '🏗️' },
    wall: { name: 'Wall', cost: { stone: 20 }, hp: 300, buildTime: 10, produces: [], icon: '🧱' },
    fortress: { name: 'Fortress', cost: { wood: 200, stone: 300 }, hp: 600, buildTime: 50, produces: ['swordsman', 'knight'], icon: '🏰' },
    temple: { name: 'Temple', cost: { wood: 100, stone: 150, gold: 50 }, hp: 200, buildTime: 35, produces: [], moraleBonus: 10, icon: '⛪' },
    siegeWorkshop: { name: 'Siege Workshop', cost: { wood: 200, stone: 100 }, hp: 200, buildTime: 40, produces: ['siegeRam'], icon: '🔧' },
    tower: { name: 'Watch Tower', cost: { stone: 80 }, hp: 250, buildTime: 25, produces: [], visionBonus: 3, icon: '🗼' },
    castle: { name: 'Castle', cost: { stone: 500, gold: 200 }, hp: 1000, buildTime: 80, produces: ['heavyKnight', 'trebuchet'], icon: '🏯' },
    university: { name: 'University', cost: { wood: 200, gold: 100 }, hp: 200, buildTime: 40, produces: [], researchBonus: 2, icon: '📚' },
    cathedral: { name: 'Cathedral', cost: { stone: 300, gold: 200 }, hp: 400, buildTime: 60, produces: [], moraleBonus: 20, icon: '⛪' },
    palace: { name: 'Palace', cost: { stone: 400, gold: 400 }, hp: 800, buildTime: 100, produces: ['eliteGuard'], icon: '👑' },
    academy: { name: 'Academy', cost: { wood: 300, gold: 200 }, hp: 250, buildTime: 50, produces: [], researchBonus: 3, icon: '🎓' },
    arsenal: { name: 'Arsenal', cost: { wood: 200, stone: 200, gold: 100 }, hp: 350, buildTime: 60, produces: ['musketeer', 'cannon'], icon: '💣' },
};

// ── Units ────────────────────────────────────────────────────
export const UNITS = {
    villager: { name: 'Villager', cost: { food: 50 }, hp: 25, atk: 3, def: 0, speed: 1, range: 1, type: 'worker', icon: '👷' },
    scout: { name: 'Scout', cost: { food: 30 }, hp: 30, atk: 2, def: 0, speed: 2, range: 1, type: 'scout', icon: '🏃' },
    militia: { name: 'Militia', cost: { food: 40, wood: 20 }, hp: 40, atk: 6, def: 2, speed: 1, range: 1, type: 'infantry', icon: '🗡️' },
    infantry: { name: 'Infantry', cost: { food: 60, gold: 15 }, hp: 60, atk: 10, def: 4, speed: 1, range: 1, type: 'infantry', icon: '⚔️' },
    archer: { name: 'Archer', cost: { food: 40, wood: 30 }, hp: 35, atk: 8, def: 1, speed: 1, range: 3, type: 'ranged', icon: '🏹' },
    cavalry: { name: 'Cavalry', cost: { food: 80, gold: 40 }, hp: 70, atk: 12, def: 3, speed: 2.5, range: 1, type: 'cavalry', icon: '🐴' },
    swordsman: { name: 'Swordsman', cost: { food: 80, gold: 30 }, hp: 80, atk: 14, def: 6, speed: 1, range: 1, type: 'infantry', icon: '⚔️' },
    crossbowman: { name: 'Crossbowman', cost: { food: 50, gold: 40 }, hp: 40, atk: 12, def: 2, speed: 1, range: 4, type: 'ranged', icon: '🎯' },
    knight: { name: 'Knight', cost: { food: 100, gold: 60 }, hp: 100, atk: 16, def: 6, speed: 2, range: 1, type: 'cavalry', icon: '🛡️' },
    siegeRam: { name: 'Siege Ram', cost: { wood: 150, gold: 50 }, hp: 150, atk: 30, def: 2, speed: 0.5, range: 1, type: 'siege', icon: '🪵' },
    heavyKnight: { name: 'Heavy Knight', cost: { food: 150, gold: 100 }, hp: 150, atk: 22, def: 10, speed: 1.5, range: 1, type: 'cavalry', icon: '⚜️' },
    longbowman: { name: 'Longbowman', cost: { food: 60, gold: 50 }, hp: 40, atk: 14, def: 1, speed: 1, range: 5, type: 'ranged', icon: '🏹' },
    trebuchet: { name: 'Trebuchet', cost: { wood: 200, gold: 100 }, hp: 80, atk: 40, def: 0, speed: 0.3, range: 6, type: 'siege', icon: '🏗️' },
    musketeer: { name: 'Musketeer', cost: { food: 80, gold: 60 }, hp: 50, atk: 20, def: 3, speed: 1, range: 4, type: 'ranged', icon: '🔫' },
    cannon: { name: 'Cannon', cost: { wood: 150, gold: 150 }, hp: 100, atk: 50, def: 1, speed: 0.3, range: 7, type: 'siege', icon: '💥' },
    eliteGuard: { name: 'Elite Guard', cost: { food: 120, gold: 80 }, hp: 120, atk: 20, def: 12, speed: 1, range: 1, type: 'infantry', icon: '🛡️' },
};

// ── Combat Type Advantages ──────────────────────────────────
export const TYPE_ADVANTAGE = {
    infantry: { cavalry: 0.7, ranged: 1.3, siege: 1.2, infantry: 1.0 },
    ranged: { cavalry: 0.8, infantry: 0.9, siege: 0.6, ranged: 1.0 },
    cavalry: { ranged: 1.5, infantry: 1.2, siege: 1.0, cavalry: 1.0 },
    siege: { infantry: 0.5, ranged: 0.8, cavalry: 0.4, siege: 1.0 },
};

// ── Civilization Names ──────────────────────────────────────
export const CIV_NAMES = [
    'Aethoria', 'Valdris', 'Kaelthon', 'Myrradin', 'Solhaven',
    'Drakenmoor', 'Ironhelm', 'Sunspire', 'Thornwall', 'Ashenmere',
];

export const LEADER_NAMES = [
    { name: 'Kael the Cunning', personality: { aggression: 0.3, honor: 0.2, greed: 0.9, trust: 0.4 } },
    { name: 'Seraphina the Just', personality: { aggression: 0.2, honor: 0.9, greed: 0.3, trust: 0.7 } },
    { name: 'Bjoern Ironhand', personality: { aggression: 0.8, honor: 0.6, greed: 0.4, trust: 0.3 } },
    { name: 'Lady Yumiko', personality: { aggression: 0.4, honor: 0.7, greed: 0.5, trust: 0.6 } },
    { name: 'Rattok the Deceiver', personality: { aggression: 0.6, honor: 0.1, greed: 0.8, trust: 0.2 } },
];
