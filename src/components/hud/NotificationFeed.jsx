/**
 * @module NotificationFeed
 * @description Live notification feed with aria-live for screen reader support.
 * Shows the last 5 undismissed notifications with dismiss buttons.
 */
import React, { memo } from 'react';
import useGameStore from '../../store/gameStore';

function NotificationFeed() {
    const notifications = useGameStore(s => s.notifications);
    const dismissNotification = useGameStore(s => s.dismissNotification);

    const visible = notifications.filter(n => !n.dismissed).slice(-5);

    return (
        <div
            className="notification-feed"
            role="log"
            aria-label="Game notifications"
            aria-live="polite"
            aria-relevant="additions"
        >
            {visible.map(n => (
                <div
                    key={n.id}
                    className={`notification ${n.type}`}
                    role="alert"
                >
                    <span className="notification-message">{n.message}</span>
                    <button
                        className="notification-dismiss"
                        onClick={() => dismissNotification(n.id)}
                        aria-label={`Dismiss notification: ${n.message}`}
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}

export default memo(NotificationFeed);
