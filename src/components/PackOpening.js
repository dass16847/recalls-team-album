import React, { useState } from 'react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import './PackOpening.css';
import { db, auth } from '../firebase';
import { getCardImage } from '../utils/cardImages';

function PackOpening({ userPacks, onPackOpened }) {
  const [isOpening, setIsOpening] = useState(false);
  const [openedCards, setOpenedCards] = useState([]);
  const [showCards, setShowCards] = useState(false);
  const [packQuantity, setPackQuantity] = useState(1);

  // Helper function to get card image URL with proper fallbacks
  const getCardImageUrl = (cardName) => {
    // Special case for Marypaz Mora
    if (cardName === 'MARYPAZ MORA') {
      return '/cards/marypaz-cerdas.png';
    }

    // Use existing getCardImage function
    const cardImage = getCardImage(cardName);
    return cardImage || null;
  };

  // Helper function to get proper styling for AFZ SJO 16 card
  const getCardImageStyle = (cardName) => {
    const baseStyle = {
      maxWidth: '100%',
      maxHeight: '100%',
      width: 'auto',
      height: 'auto',
      objectFit: 'contain',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    };

    // Special handling for AFZ SJO 16 card (horizontal card)
    if (cardName === 'SJO 16 AFZ') {
      return {
        ...baseStyle,
        transform: 'rotate(90deg) scale(0.8)',
        transformOrigin: 'center center'
      };
    }

    return baseStyle;
  };

  const openPack = async () => {
    if (userPacks <= 0 || isOpening || packQuantity > userPacks) return;
    setIsOpening(true);
    setShowCards(false);

    try {
      const cardsSnapshot = await getDocs(collection(db, 'cards'));
      const allCards = cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (allCards.length === 0) {
        alert('No cards available!');
        setIsOpening(false);
        return;
      }

      // Open multiple packs
      const allPackCards = [];
      for (let pack = 0; pack < packQuantity; pack++) {
        const packCards = [];
        for (let i = 0; i < 3; i++) {
          const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
          packCards.push(randomCard);
        }
        allPackCards.push(...packCards);
      }

      // Group duplicate cards and count them
      const cardCounts = {};
      allPackCards.forEach(card => {
        const cardKey = card.id;
        if (cardCounts[cardKey]) {
          cardCounts[cardKey].count++;
        } else {
          cardCounts[cardKey] = {
            ...card,
            count: 1
          };
        }
      });

      // Update database efficiently
      const userId = auth.currentUser.uid;
      const updatePromises = [];

      for (const cardKey in cardCounts) {
        const cardData = cardCounts[cardKey];
        const userCardRef = doc(db, 'userCollections', userId + '_' + cardKey);

        updatePromises.push(
          getDoc(userCardRef).then(async (existingCard) => {
            if (existingCard.exists()) {
              await setDoc(userCardRef, {
                ...existingCard.data(),
                count: existingCard.data().count + cardData.count
              });
            } else {
              await setDoc(userCardRef, {
                userId: userId,
                cardId: cardKey,
                cardData: cardData,
                count: cardData.count,
                dateObtained: new Date()
              });
            }
          })
        );
      }

      // Wait for all database updates to complete
      await Promise.all(updatePromises);

      // Convert back to array format for display, showing stacked duplicates
      const displayCards = Object.values(cardCounts);
      setOpenedCards(displayCards);

setTimeout(() => {
  setShowCards(true);
  setIsOpening(false);
  // Update pack count based on quantity opened - call onPackOpened once per pack
  onPackOpened(packQuantity);
}, 1500);

    } catch (error) {
      console.error('Error:', error);
      alert('Error opening pack');
      setIsOpening(false);
    }
  };

  return (
    <div className="pack-opening-container">
      <div className="pack-opening-header">
        <h2>🎁 Pack Opening</h2>
        <div className="pack-count-display">
          <h3>You have {userPacks} packs available</h3>
        </div>
      </div>

      {!isOpening && !showCards && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '18px', 
              fontWeight: 'bold' 
            }}>
              How many packs do you want to open?
            </label>
            <select
              value={packQuantity}
              onChange={(e) => setPackQuantity(parseInt(e.target.value))}
              style={{
                padding: '10px 15px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #007bff',
                backgroundColor: 'white',
                cursor: 'pointer',
                marginBottom: '15px'
              }}
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num} disabled={num > userPacks}>
                  {num} pack{num > 1 ? 's' : ''} {num > userPacks ? '(Not enough packs)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={openPack}
            disabled={userPacks <= 0 || packQuantity > userPacks}
            className="open-pack-button"
          >
            {userPacks > 0 ? `🎁 Open ${packQuantity} Pack${packQuantity > 1 ? 's' : ''}!` : 'No Packs Available'}
          </button>
        </div>
      )}

      {isOpening && (
        <div className="opening-animation">
          <h3>✨ Opening {packQuantity} pack{packQuantity > 1 ? 's' : ''}...</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            {Array.from({ length: Math.min(packQuantity, 5) }, (_, i) => (
              <div 
                key={i} 
                className="pack-icon" 
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  fontSize: '3rem'
                }}
              >
                🎁
              </div>
            ))}
          </div>
          <p style={{ marginTop: '20px', color: '#666' }}>
            Shuffling cards and checking for duplicates...
          </p>
        </div>
      )}

      {showCards && openedCards.length > 0 && (
        <div className="pack-results">
          <h3>🎉 You opened {packQuantity} pack{packQuantity > 1 ? 's' : ''} and got:</h3>
          <div className="cards-grid">
            {openedCards.map((card, index) => {
  const cardImageUrl = getCardImageUrl(card.name);
  const isStacked = card.count > 1;

  return (
    <div key={index} className="result-card" style={{ position: 'relative' }}>
      {/* Enhanced Stack effect - show multiple card shadows behind */}
      {isStacked && (
        <>
          <div 
            className="card-stack-shadow"
            style={{
              position: 'absolute',
              top: '-6px',
              left: '6px',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(102, 126, 234, 0.4)',
              borderRadius: '15px',
              zIndex: -2,
              border: '2px solid rgba(102, 126, 234, 0.3)'
            }}
          />
          <div 
            className="card-stack-shadow"
            style={{
              position: 'absolute',
              top: '-12px',
              left: '12px',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(102, 126, 234, 0.3)',
              borderRadius: '15px',
              zIndex: -3,
              border: '2px solid rgba(102, 126, 234, 0.2)'
            }}
          />
          {card.count > 2 && (
            <div 
              className="card-stack-shadow"
              style={{
                position: 'absolute',
                top: '-18px',
                left: '18px',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderRadius: '15px',
                zIndex: -4,
                border: '2px solid rgba(102, 126, 234, 0.1)'
              }}
            />
          )}
        </>
      )}

      {/* Stack counter badge */}
      {isStacked && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          backgroundColor: '#ff6b35',
          color: 'white',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 20,
          border: '2px solid white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          x{card.count}
        </div>
      )}

      <div className="card-image-container" style={{ position: 'relative', zIndex: 5 }}>
                    {cardImageUrl ? (
                      <img 
                        src={cardImageUrl} 
                        alt={card.name}
                        style={getCardImageStyle(card.name)}
                        onError={(e) => {
                          console.log('Image failed to load:', card.name);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="card-fallback" 
                      style={{ display: cardImageUrl ? 'none' : 'flex' }}
                    >
                      <h4>{card.name}</h4>
                      <p>{card.team}</p>
                      <span className={`card-rarity rarity-${card.rarity?.toLowerCase() || 'common'}`}>
                        {card.rarity}
                      </span>
                    </div>
                  </div>
                  <div className="card-info">
                    <h4>{card.name}</h4>
                    <p>{card.team}</p>
                    <span className={`card-rarity rarity-${card.rarity?.toLowerCase() || 'common'}`}>
                      {card.rarity}
                    </span>
                    {isStacked && (
                      <p style={{ 
                        color: '#ff6b35', 
                        fontWeight: 'bold', 
                        fontSize: '14px',
                        margin: '5px 0 0 0'
                      }}>
                        Got {card.count} copies! 🎉
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ 
              backgroundColor: '#e8f5e8', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '15px',
              color: '#155724'
            }}>
              🎉 Pack opening complete! You opened {packQuantity} pack{packQuantity > 1 ? 's' : ''} and got {openedCards.reduce((total, card) => total + card.count, 0)} cards total.
              {openedCards.some(card => card.count > 1) && (
                <><br />🔥 You got some duplicates - perfect for trading or you can delete extras in your collection!</>
              )}
            </p>
            <button
              onClick={() => setShowCards(false)}
              className="close-results-button"
            >
              ✨ Close Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PackOpening;