import React, { useRef, useEffect, useCallback, useState } from 'react';
import useGameStore from '../../store/gameStore';
import { hexToPixel, hexCorners } from '../../utils/hexUtils';
import { MAP_COLS, MAP_ROWS, HEX_SIZE, BUILDINGS } from '../../engine/constants';

export default function GameMap() {
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const tiles = useGameStore(s => s.tiles);
    const camera = useGameStore(s => s.camera);
    const moveCamera = useGameStore(s => s.moveCamera);
    const setZoom = useGameStore(s => s.setZoom);
    const buildings = useGameStore(s => s.buildings);
    const civilizations = useGameStore(s => s.civilizations);
    const selectedTile = useGameStore(s => s.selectedTile);
    const selectTile = useGameStore(s => s.selectTile);
    const buildMode = useGameStore(s => s.buildMode);
    const selectedBuildingType = useGameStore(s => s.selectedBuildingType);
    const placeBuilding = useGameStore(s => s.placeBuilding);
    const tick = useGameStore(s => s.tick);

    // Render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        const { x: camX, y: camY, zoom } = camera;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-camX * zoom + canvas.width / 2, -camY * zoom + canvas.height / 2);
        ctx.scale(zoom, zoom);

        // Draw tiles
        for (const tile of tiles) {
            const { x, y } = hexToPixel(tile.q, tile.r, HEX_SIZE);
            const corners = hexCorners(x, y, HEX_SIZE - 1);

            // Fog of war
            if (tile.fogState === 'hidden') {
                ctx.fillStyle = '#0a0d14';
                ctx.beginPath();
                ctx.moveTo(corners[0].x, corners[0].y);
                for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
                ctx.closePath();
                ctx.fill();
                continue;
            }

            // Terrain color
            ctx.fillStyle = tile.terrain.color;
            ctx.beginPath();
            ctx.moveTo(corners[0].x, corners[0].y);
            for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
            ctx.closePath();
            ctx.fill();

            // Hex border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Owner tint
            if (tile.owner === 'player') {
                ctx.fillStyle = 'rgba(74, 144, 217, 0.15)';
                ctx.fill();
            }

            // Explored but not visible
            if (tile.fogState === 'explored') {
                ctx.fillStyle = 'rgba(10, 13, 20, 0.5)';
                ctx.fill();
            }

            // Selection highlight
            if (selectedTile && selectedTile.q === tile.q && selectedTile.r === tile.r) {
                ctx.strokeStyle = '#d4a84b';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = 'rgba(212, 168, 75, 0.15)';
                ctx.fill();
            }

            // Build mode hover effect
            if (buildMode && tile.terrain.id !== 'water' && tile.terrain.id !== 'mountain') {
                ctx.strokeStyle = 'rgba(212, 168, 75, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Draw buildings
        for (const building of buildings) {
            const { x, y } = hexToPixel(building.position.q, building.position.r, HEX_SIZE);
            const def = BUILDINGS[building.type];

            // Building background
            ctx.fillStyle = building.civId === 'player' ? 'rgba(74, 144, 217, 0.3)' : 'rgba(217, 74, 74, 0.3)';
            ctx.beginPath();
            ctx.arc(x, y, HEX_SIZE * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Icon
            ctx.font = `${HEX_SIZE * 0.6}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def?.icon || '🏠', x, y);

            // Construction progress
            if (building.progress < 1) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.beginPath();
                ctx.arc(x, y, HEX_SIZE * 0.5, 0, Math.PI * 2);
                ctx.fill();

                // Progress arc
                ctx.strokeStyle = '#d4a84b';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, HEX_SIZE * 0.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * building.progress);
                ctx.stroke();

                // Progress text
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${HEX_SIZE * 0.3}px Inter`;
                ctx.fillText(`${Math.floor(building.progress * 100)}%`, x, y);
            }
        }

        // Draw units
        for (const civ of civilizations) {
            for (const unit of civ.units) {
                const { x, y } = hexToPixel(unit.position.q, unit.position.r, HEX_SIZE);
                const isPlayer = civ.id === 'player';

                // Unit dot
                const unitOffset = civ.units.indexOf(unit) * 3;
                const ux = x + HEX_SIZE * 0.3 + (unitOffset % 12);
                const uy = y + HEX_SIZE * 0.2 + Math.floor(unitOffset / 12) * 6;

                ctx.font = `${HEX_SIZE * 0.35}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(unit.icon || '👤', ux, uy);

                // HP bar for damaged units
                if (unit.hp < (unit.maxHp || unit.hp)) {
                    const barW = HEX_SIZE * 0.4;
                    const barH = 3;
                    const hpRatio = unit.hp / (unit.maxHp || unit.hp);
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(ux - barW / 2, uy + 8, barW, barH);
                    ctx.fillStyle = hpRatio > 0.5 ? '#4caf7a' : hpRatio > 0.25 ? '#d98c4a' : '#d94a4a';
                    ctx.fillRect(ux - barW / 2, uy + 8, barW * hpRatio, barH);
                }
            }
        }

        ctx.restore();
    }, [tiles, camera, buildings, civilizations, selectedTile, buildMode, tick]);

    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mouse handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        dragStart.current = { x: e.clientX, y: e.clientY };
        moveCamera(-dx / camera.zoom, -dy / camera.zoom);
    };

    const handleMouseUp = (e) => {
        if (!isDragging) return;
        setIsDragging(false);
    };

    const handleClick = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const { x: camX, y: camY, zoom } = useGameStore.getState().camera;

        // Convert screen coords to world coords
        const worldX = (e.clientX - rect.left - canvas.width / 2) / zoom + camX;
        const worldY = (e.clientY - rect.top - canvas.height / 2) / zoom + camY;

        // Find closest hex
        let closestTile = null;
        let closestDist = Infinity;

        for (const tile of useGameStore.getState().tiles) {
            const { x, y } = hexToPixel(tile.q, tile.r, HEX_SIZE);
            const dist = Math.sqrt((worldX - x) ** 2 + (worldY - y) ** 2);
            if (dist < closestDist && dist < HEX_SIZE) {
                closestDist = dist;
                closestTile = tile;
            }
        }

        if (closestTile) {
            const state = useGameStore.getState();
            if (state.buildMode && state.selectedBuildingType) {
                placeBuilding(closestTile.q, closestTile.r, state.selectedBuildingType);
            } else {
                selectTile(closestTile.q, closestTile.r);
            }
        }
    }, [selectTile, placeBuilding]);

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(camera.zoom + delta);
    };

    return (
        <canvas
            ref={canvasRef}
            className="map-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDragging(false)}
            onClick={handleClick}
            onWheel={handleWheel}
            style={{ width: '100%', height: '100%' }}
        />
    );
}
