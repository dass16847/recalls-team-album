import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
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
    // Create toast notification element with FIFA colors
    const toast = document.createElement('div');
    toast.className = 'trade-toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #6100E9 0%, #304FFF 100%);
      border: 3px solid #64FEDA;
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 8px 24px rgba(97,0,233,0.3);
      z-index: 10000;
      min-width: 300px;
      max-width: 400px;
      animation: slideInRight 0.3s ease-out;
    `;

    toast.innerHTML = `
      <div class="toast-content" style="
        display: flex;
        align-items: center;
        padding: 20px;
        gap: 15px;
        position: relative;
      ">
        <div class="toast-icon" style="
          font-size: 24px;
          background: #AFEA00;
          color: #1A1A2E;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">🔔</div>
        <div class="toast-message" style="
          flex: 1;
          color: white;
        ">
          <strong style="
            display: block;
            font-size: 16px;
            margin-bottom: 5px;
            color: white;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          ">${notification.title}</strong>
          <p style="
            margin: 0;
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            line-height: 1.4;
          ">${notification.message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()" style="
          position: absolute;
          top: 8px;
          right: 8px;
          background: #FF3D00;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        " onmouseover="this.style.backgroundColor='#D20100'; this.style.transform='scale(1.1)'" onmouseout="this.style.backgroundColor='#FF3D00'; this.style.transform='scale(1)'">×</button>
      </div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
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
  try {
    await updateDoc(doc(db, 'tradeNotifications', notificationId), {
      read: true
    });
    console.log('Marked notification as read:', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

  const clearAllNotifications = async () => {
  try {
    const promises = notifications.map(notification => 
      updateDoc(doc(db, 'tradeNotifications', notification.id), {
        read: true
      })
    );
    await Promise.all(promises);
    console.log('All notifications marked as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
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
  const { notifications, unreadCount, clearAllNotifications } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          fontSize: '24px',
          color: 'white',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(100,254,218,0.2)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.transform = 'scale(1)';
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#FF3D00',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'white',
            border: '3px solid #6100E9',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(97,0,233,0.3)',
            minWidth: '320px',
            maxWidth: '400px',
            zIndex: 1000,
            animation: 'dropdownSlide 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              background: 'linear-gradient(135deg, #6100E9 0%, #304FFF 100%)',
              borderRadius: '8px 8px 0 0',
              borderBottom: '2px solid #64FEDA'
            }}>
              <h4 style={{ 
                margin: 0, 
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}>🔔 Trade Notifications</h4>
              <button 
                onClick={() => setShowDropdown(false)}
                style={{
                  background: '#FF3D00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#D20100';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#FF3D00';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ×
              </button>
            </div>

            {/* Notification List */}
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                padding: notifications.length === 0 ? '40px 20px' : '10px 0'
              }}>
              {notifications.length === 0 ? (
                <div style={{ 
                  textAlign: 'center',
                  color: '#4A4A6A'
                }}>
                  <div style={{ 
                    fontSize: '48px', 
                    marginBottom: '15px',
                    opacity: 0.5
                  }}>🔕</div>
                  <p style={{ 
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>No new notifications</p>
                  <p style={{ 
                    margin: '8px 0 0 0',
                    fontSize: '14px',
                    opacity: 0.7
                  }}>You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
  <div key={notification.id} style={{
    padding: '20px',
    borderBottom: index < notifications.length - 1 ? '1px solid #E6F9F5' : 'none',
    backgroundColor: 'white',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
    display: 'block',
    width: '100%'
  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F0F4FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <div style={{
                        backgroundColor: '#64FEDA',
                        color: '#1A1A2E',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        flexShrink: 0,
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(100,254,218,0.2)'
                      }}>
                        🔄
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ 
                          display: 'block',
                          color: '#1A1A2E',
                          fontSize: '16px',
                          marginBottom: '5px',
                          fontWeight: 'bold'
                        }}>{notification.title}</strong>
                        <p style={{ 
                          margin: '0 0 8px 0',
                          color: '#4A4A6A',
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>{notification.message}</p>
                        <small style={{ 
                          color: '#8888AA',
                          fontSize: '12px',
                          fontStyle: 'italic'
                        }}>
                          {notification.createdAt?.toDate ? 
                            new Date(notification.createdAt.toDate()).toLocaleString() : 
                            'Just now'
                          }
                        </small>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer (if there are notifications) */}
            {notifications.length > 0 && (
              <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #F0F4FF 0%, #E6F9F5 100%)',
                borderRadius: '0 0 8px 8px',
                borderTop: '1px solid #B288FD',
                textAlign: 'center'
              }}>
                <button style={{
                  background: '#6100E9',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#304FFF';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6100E9';
                  e.target.style.transform = 'translateY(0)';
                }}
                onClick={clearAllNotifications}>
                  Mark All as Read
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};