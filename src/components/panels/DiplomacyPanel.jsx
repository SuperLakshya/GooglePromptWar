import React, { useState, useRef, useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import { LEADER_PROFILES } from '../../ai/LeaderProfiles';
import { getRelationshipSummary } from '../../ai/DiplomacyEngine';

export default function DiplomacyPanel() {
    const [message, setMessage] = useState('');
    const chatEndRef = useRef(null);
    const activeDiplomacy = useGameStore(s => s.activeDiplomacy);
    const diplomacyChat = useGameStore(s => s.diplomacyChat);
    const diplomacyMemory = useGameStore(s => s.diplomacyMemory);
    const civilizations = useGameStore(s => s.civilizations);
    const sendDiplomacyMessage = useGameStore(s => s.sendDiplomacyMessage);
    const openDiplomacy = useGameStore(s => s.openDiplomacy);
    const setActivePanel = useGameStore(s => s.setActivePanel);

    const aiCivs = civilizations.filter(c => !c.isPlayer);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [diplomacyChat, activeDiplomacy]);

    const handleSend = () => {
        if (!message.trim() || !activeDiplomacy) return;
        sendDiplomacyMessage(message.trim());
        setMessage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Leader selection view
    if (!activeDiplomacy) {
        return (
            <>
                <div className="panel-header">
                    <span className="panel-title">Diplomacy</span>
                    <button className="panel-close" onClick={() => setActivePanel(null)}>✕</button>
                </div>
                <div className="panel-body">
                    <p style={{ fontSize: 13, color: '#9aa0b0', marginBottom: 16 }}>
                        Choose a leader to negotiate with:
                    </p>
                    <div className="leader-list">
                        {aiCivs.map(civ => {
                            const leader = LEADER_PROFILES[civ.leaderId];
                            if (!leader) return null;
                            const rel = getRelationshipSummary(diplomacyMemory, civ.leaderId);
                            const relLabel = rel > 0.2 ? 'Friendly' : rel < -0.2 ? 'Hostile' : 'Neutral';
                            const relClass = rel > 0.2 ? 'positive' : rel < -0.2 ? 'negative' : 'neutral';

                            return (
                                <div key={civ.id} className="leader-card" onClick={() => openDiplomacy(civ.leaderId)}>
                                    <div className="leader-portrait">{leader.portrait}</div>
                                    <div className="leader-card-info">
                                        <h4>{leader.name}</h4>
                                        <div className="leader-personality">{leader.title}</div>
                                        <div className={`leader-relationship ${relClass}`}>
                                            Relationship: {relLabel} ({rel >= 0 ? '+' : ''}{rel.toFixed(1)})
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </>
        );
    }

    // Chat view
    const leader = LEADER_PROFILES[activeDiplomacy];
    const chat = diplomacyChat[activeDiplomacy] || [];
    const rel = getRelationshipSummary(diplomacyMemory, activeDiplomacy);
    const relLabel = rel > 0.2 ? 'Friendly' : rel < -0.2 ? 'Hostile' : 'Neutral';
    const relClass = rel > 0.2 ? 'positive' : rel < -0.2 ? 'negative' : 'neutral';

    return (
        <>
            <div className="panel-header">
                <span className="panel-title">Diplomacy</span>
                <button className="panel-close" onClick={() => setActivePanel(null)}>✕</button>
            </div>

            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* Leader info */}
                <div style={{ padding: 16 }}>
                    <div className="diplomacy-leader" onClick={() => openDiplomacy(null)} style={{ cursor: 'pointer' }}>
                        <div className="leader-portrait">{leader?.portrait}</div>
                        <div className="leader-info">
                            <h3>{leader?.name}</h3>
                            <div className="leader-title">{leader?.title}</div>
                            <div className={`leader-relationship ${relClass}`}>
                                {relLabel} ({rel >= 0 ? '+' : ''}{rel.toFixed(1)})
                            </div>
                        </div>
                    </div>

                    {/* Personality traits */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        {leader && Object.entries(leader.personality).map(([trait, val]) => (
                            <span key={trait} style={{
                                padding: '2px 8px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 4,
                                fontSize: 11,
                                color: val > 0.6 ? '#d4a84b' : '#5a6174',
                            }}>
                                {trait}: {(val * 100).toFixed(0)}%
                            </span>
                        ))}
                    </div>
                </div>

                {/* Chat messages */}
                <div className="chat-messages">
                    {chat.length === 0 && (
                        <p style={{ fontSize: 12, color: '#5a6174', textAlign: 'center', padding: 20 }}>
                            Begin your negotiation. Try: trade offers, alliance proposals, threats, or compliments.
                        </p>
                    )}
                    {chat.map((msg, i) => (
                        <div key={i} className={`chat-message ${msg.sender === 'player' ? 'player' : `ai ${msg.mood || ''}`}`}>
                            {msg.message}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="chat-input-area">
                    <input
                        className="chat-input"
                        placeholder="Speak to the leader..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="chat-send" onClick={handleSend}>SEND</button>
                </div>
            </div>
        </>
    );
}
