import React, { useRef, useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import { hexToPixel } from '../../utils/hexUtils';
import { MAP_COLS, MAP_ROWS, HEX_SIZE } from '../../engine/constants';

export default function MiniMap() {
    const canvasRef = useRef(null);
    const tiles = useGameStore(s => s.tiles);
    const buildings = useGameStore(s => s.buildings);
    const camera = useGameStore(s => s.camera);
    const civilizations = useGameStore(s => s.civilizations);
    const moveCamera = useGameStore(s => s.moveCamera);
    const tick = useGameStore(s => s.tick);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = 200;
        const h = 130;
        canvas.width = w;
        canvas.height = h;

        const scaleX = w / (MAP_COLS * 3);
        const scaleY = h / (MAP_ROWS * 3);
        const scale = Math.min(scaleX, scaleY);

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, w, h);

        // Draw tiles
        for (const tile of tiles) {
            if (tile.fogState === 'hidden') continue;

            const px = tile.q * 2.5 * scale + 10;
            const py = (tile.r * 3 + (tile.q % 2) * 1.5) * scale + 10;

            ctx.fillStyle = tile.terrain.color;
            ctx.fillRect(px, py, 2 * scale, 2 * scale);

            // Owner overlay
            if (tile.owner === 'player') {
                ctx.fillStyle = 'rgba(74, 144, 217, 0.4)';
                ctx.fillRect(px, py, 2 * scale, 2 * scale);
            }
        }

        // Draw buildings
        for (const b of buildings) {
            const px = b.position.q * 2.5 * scale + 10;
            const py = (b.position.r * 3 + (b.position.q % 2) * 1.5) * scale + 10;
            ctx.fillStyle = b.civId === 'player' ? '#4a90d9' : '#d94a4a';
            ctx.fillRect(px, py, 3, 3);
        }

        // Camera viewport indicator
        const vpW = 80 / camera.zoom;
        const vpH = 50 / camera.zoom;
        const vpX = camera.x * scale / HEX_SIZE + 10;
        const vpY = camera.y * scale / HEX_SIZE + 10;
        ctx.strokeStyle = '#d4a84b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(vpX - vpW / 2, vpY - vpH / 2, vpW, vpH);
    }, [tiles, buildings, camera, civilizations, tick]);

    const handleClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const scaleX = 200 / (MAP_COLS * 3);
        const scaleY = 130 / (MAP_ROWS * 3);
        const scale = Math.min(scaleX, scaleY);

        const targetX = (mx - 10) * HEX_SIZE / scale;
        const targetY = (my - 10) * HEX_SIZE / scale;

        useGameStore.setState({
            camera: { ...camera, x: targetX, y: targetY },
        });
    };

    return (
        <div className="minimap-container">
            <div className="minimap">
                <canvas ref={canvasRef} onClick={handleClick} />
            </div>
        </div>
    );
}
