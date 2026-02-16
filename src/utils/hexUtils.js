// ═══════════════════════════════════════════════════════════════
// SOVEREIGN — Hex Grid Utilities
// ═══════════════════════════════════════════════════════════════

// Axial coordinate helpers for flat-top hex grid

export function hexToPixel(q, r, size) {
    const x = size * (3 / 2 * q);
    const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
    return { x, y };
}

export function pixelToHex(x, y, size) {
    const q = (2 / 3 * x) / size;
    const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / size;
    return hexRound(q, r);
}

export function hexRound(q, r) {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);
    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds) rr = -rq - rs;
    return { q: rq, r: rr };
}

export function hexDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function hexNeighbors(q, r) {
    return [
        { q: q + 1, r: r },
        { q: q - 1, r: r },
        { q: q, r: r + 1 },
        { q: q, r: r - 1 },
        { q: q + 1, r: r - 1 },
        { q: q - 1, r: r + 1 },
    ];
}

export function hexCorners(cx, cy, size) {
    const corners = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i);
        corners.push({
            x: cx + size * Math.cos(angle),
            y: cy + size * Math.sin(angle),
        });
    }
    return corners;
}

export function isValidHex(q, r, cols, rows) {
    return q >= 0 && q < cols && r >= 0 && r < rows;
}
