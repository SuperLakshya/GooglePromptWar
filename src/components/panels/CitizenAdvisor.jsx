import React from 'react';
import useGameStore from '../../store/gameStore';

export default function CitizenAdvisor() {
    const advisorSuggestions = useGameStore(s => s.advisorSuggestions);
    const civilizations = useGameStore(s => s.civilizations);
    const setActivePanel = useGameStore(s => s.setActivePanel);
    const enterBuildMode = useGameStore(s => s.enterBuildMode);
    const trainUnit = useGameStore(s => s.trainUnit);
    const advanceEra = useGameStore(s => s.advanceEra);

    const playerCiv = civilizations[0];
    if (!playerCiv) return null;

    const workers = playerCiv.units.filter(u => u.type === 'worker');
    const military = playerCiv.units.filter(u => u.type !== 'worker' && u.type !== 'scout');
    const scouts = playerCiv.units.filter(u => u.type === 'scout');

    const handleAction = (action) => {
        switch (action) {
            case 'BUILD_FARM': enterBuildMode('farm'); break;
            case 'BUILD_LUMBER_CAMP': enterBuildMode('lumberCamp'); break;
            case 'TRAIN_VILLAGER': trainUnit('villager'); break;
            case 'TRAIN_MILITARY': enterBuildMode('barracks'); break;
            case 'ADVANCE_ERA': advanceEra(); break;
            case 'EXPAND': setActivePanel('build'); break;
            default: break;
        }
    };

    return (
        <>
            <div className="panel-header">
                <span className="panel-title">Citizen Advisor</span>
                <button className="panel-close" onClick={() => setActivePanel(null)}>✕</button>
            </div>
            <div className="panel-body">
                {/* Population overview */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8,
                    marginBottom: 20,
                    padding: 12,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22 }}>👷</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#e8e4dc' }}>{workers.length}</div>
                        <div style={{ fontSize: 11, color: '#9aa0b0' }}>Workers</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22 }}>⚔️</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#e8e4dc' }}>{military.length}</div>
                        <div style={{ fontSize: 11, color: '#9aa0b0' }}>Military</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22 }}>🏃</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#e8e4dc' }}>{scouts.length}</div>
                        <div style={{ fontSize: 11, color: '#9aa0b0' }}>Scouts</div>
                    </div>
                </div>

                {/* Morale bar */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: '#9aa0b0' }}>Morale</span>
                        <span style={{
                            color: playerCiv.morale >= 70 ? '#4caf7a' : playerCiv.morale >= 40 ? '#d98c4a' : '#d94a4a',
                            fontWeight: 600,
                        }}>
                            {playerCiv.morale}%
                        </span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                        <div
                            className="progress-fill"
                            style={{
                                width: `${playerCiv.morale}%`,
                                background: playerCiv.morale >= 70
                                    ? 'linear-gradient(90deg, #2d8a55, #4caf7a)'
                                    : playerCiv.morale >= 40
                                        ? 'linear-gradient(90deg, #c27a22, #d98c4a)'
                                        : 'linear-gradient(90deg, #b33333, #d94a4a)',
                            }}
                        />
                    </div>
                </div>

                {/* Suggestions */}
                <h4 style={{ fontFamily: 'Cinzel', fontSize: 13, color: '#d4a84b', marginBottom: 12, letterSpacing: 1 }}>
                    Advisor Reports
                </h4>
                <div className="advisor-list">
                    {advisorSuggestions.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#5a6174', textAlign: 'center', padding: 20 }}>
                            All is well in your kingdom, my liege.
                        </p>
                    ) : (
                        advisorSuggestions.map((s, i) => (
                            <div
                                key={i}
                                className={`advisor-item ${s.type}`}
                                onClick={() => s.action && handleAction(s.action)}
                                style={{ cursor: s.action ? 'pointer' : 'default' }}
                            >
                                <span className="advisor-icon">{s.icon}</span>
                                <span className="advisor-message">{s.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
