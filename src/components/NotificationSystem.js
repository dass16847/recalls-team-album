import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './NotificationSystem.css';

// Create notification context
const NotificationContext = createContext();

// Custom hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen for real-time trade notifications
    const notificationsQuery = query(
  collection(db, 'tradeNotifications'),
  where('targetUserId', '==', auth.currentUser.uid),
  where('read', '==', false),
  limit(10)
);

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);

      // Show toast for new notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = { id: change.doc.id, ...change.doc.data() };
          showToastNotification(notification);
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const showToastNotification = (notification) => {
    // Create toast notification element
    const toast = document.createElement('div');
    toast.className = 'trade-toast-notification';
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">🔔</div>
        <div class="toast-message">
          <strong>${notification.title}</strong>
          <p>${notification.message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);

    // Play notification sound (optional)
    playNotificationSound();
  };

  const playNotificationSound = () => {
    // Create a simple notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not supported or blocked');
    }
  };

  const markAsRead = async (notificationId) => {
    // We'll implement this in the next step
    console.log('Mark as read:', notificationId);
  };

  const clearAllNotifications = async () => {
    // We'll implement this in the next step
    console.log('Clear all notifications');
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Notification Bell Component
export const NotificationBell = () => {
  const { notifications, unreadCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Trade Notifications</h4>
            <button 
              className="close-dropdown"
              onClick={() => setShowDropdown(false)}
            >
              ×
            </button>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No new notifications</p>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-content">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.createdAt?.toDate()).toLocaleString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};