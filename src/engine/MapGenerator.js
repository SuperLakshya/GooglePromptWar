// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — Procedural Hex Map Generator
// ═══════════════════════════════════════════════════════════════

import { MAP_COLS, MAP_ROWS, TERRAIN } from './constants.js';

// Simple seeded random for deterministic maps
function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

// Simple 2D noise-like function
function noise2D(x, y, rand) {
    // Pre-compute a noise table
    const val = Math.sin(x * 12.9898 + y * 78.233 + rand() * 0.001) * 43758.5453;
    return val - Math.floor(val);
}

export function generateMap(seed = Date.now()) {
    const rand = seededRandom(seed);
    const tiles = [];

    // Pre-generate noise values for smoother terrain
    const noiseGrid = [];
    for (let r = 0; r < MAP_ROWS; r++) {
        noiseGrid[r] = [];
        for (let q = 0; q < MAP_COLS; q++) {
            noiseGrid[r][q] = noise2D(q * 0.3, r * 0.3, rand);
        }
    }

    for (let r = 0; r < MAP_ROWS; r++) {
        for (let q = 0; q < MAP_COLS; q++) {
            const n = noiseGrid[r][q];
            const edgeDist = Math.min(q, r, MAP_COLS - 1 - q, MAP_ROWS - 1 - r);

            let terrain;
            if (edgeDist <= 1 && rand() < 0.4) {
                terrain = TERRAIN.WATER;
            } else if (n < 0.2) {
                terrain = TERRAIN.WATER;
            } else if (n < 0.4) {
                terrain = TERRAIN.PLAINS;
            } else if (n < 0.6) {
                terrain = TERRAIN.FOREST;
            } else if (n < 0.8) {
                terrain = TERRAIN.MOUNTAIN;
            } else {
                terrain = TERRAIN.DESERT;
            }

            tiles.push({
                q,
                r,
                terrain,
                owner: null,
                building: null,
                units: [],
                fogState: 'hidden', // 'hidden', 'explored', 'visible'
                resourcesRemaining: 100 + Math.floor(rand() * 100),
            });
        }
    }

    return tiles;
}

export function getTile(tiles, q, r) {
    if (q < 0 || q >= MAP_COLS || r < 0 || r >= MAP_ROWS) return null;
    return tiles[r * MAP_COLS + q] || null;
}

export function setTile(tiles, q, r, update) {
    const idx = r * MAP_COLS + q;
    if (idx >= 0 && idx < tiles.length) {
        tiles[idx] = { ...tiles[idx], ...update };
    }
}

// Find suitable starting positions (plains, far apart)
export function findStartPositions(tiles, count) {
    const plains = tiles.filter(t => t.terrain.id === 'plains' && t.q > 2 && t.q < MAP_COLS - 3 && t.r > 2 && t.r < MAP_ROWS - 3);
    const positions = [];

    if (plains.length === 0) return [{ q: 5, r: 5 }];

    // First position
    positions.push(plains[Math.floor(Math.random() * plains.length)]);

    // Subsequent positions — maximize distance from existing
    for (let i = 1; i < count; i++) {
        let best = null;
        let bestDist = -1;
        for (const tile of plains) {
            const minDist = Math.min(...positions.map(p =>
                Math.abs(p.q - tile.q) + Math.abs(p.r - tile.r)
            ));
            if (minDist > bestDist) {
                bestDist = minDist;
                best = tile;
            }
        }
        if (best) positions.push(best);
    }

    return positions.map(p => ({ q: p.q, r: p.r }));
}
