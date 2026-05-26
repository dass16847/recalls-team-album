import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getCardImage } from '../utils/cardImages';

function Collection() {
  const [userCards, setUserCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserCollection();
  }, []);

  const loadUserCollection = async () => {
    try {
      const userId = auth.currentUser.uid;
      const userCollectionQuery = query(
        collection(db, 'userCollections'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(userCollectionQuery);
      const cards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUserCards(cards);
      setLoading(false);
    } catch (error) {
      console.error('Error loading collection:', error);
      setLoading(false);
    }
  };

  // Handle drag start
  const handleDragStart = (e, userCard) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      cardId: userCard.cardId,
      cardData: userCard.cardData,
      userCardId: userCard.id
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📚 Loading your collection...</h2>
      </div>
    );
  }

  if (userCards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📚 My Collection</h2>
        <p>You haven't collected any cards yet!</p>
        <p>Go to "Open Packs" to start collecting! 🎁</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>📚 My Collection</h2>
        <p>You have collected <strong>{userCards.length}</strong> different cards!</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          💡 Drag cards to the Album to place them in their designated spots!
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {userCards.map((userCard) => {
          const cardImage = getCardImage(userCard.cardData.name);

          return (
            <div
              key={userCard.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, userCard)}
              style={{
                position: 'relative',
                cursor: 'grab',
                transition: 'all 0.3s ease',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px) scale(1.02)';
                e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onDragStart={(e) => {
                e.currentTarget.style.cursor = 'grabbing';
                e.currentTarget.style.opacity = '0.7';
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.cursor = 'grab';
                e.currentTarget.style.opacity = '1';
              }}
            >
              {/* Card Count Badge */}
              {userCard.count > 1 && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  zIndex: 2,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  {userCard.count}
                </div>
              )}

              {/* Drag Label */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: '#17a2b8',
                color: 'white',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                zIndex: 2,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}>
                DRAG ME
              </div>

              {/* Card Image */}
              {cardImage ? (
                <img 
                  src={cardImage} 
                  alt={userCard.cardData.name}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    aspectRatio: '241/305'
                  }}
                />
              ) : (
                // Fallback if image not found
                <div style={{
                  aspectRatio: '241/305',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em' }}>
                    {userCard.cardData.name}
                  </h3>
                  <p style={{ margin: '5px 0', fontSize: '0.9em' }}>
                    {userCard.cardData.team}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '0.8em', fontWeight: 'bold' }}>
                    {userCard.cardData.rarity}
                  </p>
                </div>
              )}

              {/* Duplicate Count Info */}
              {userCard.count > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(40, 167, 69, 0.9)',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  You have {userCard.count} copies
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Collection;