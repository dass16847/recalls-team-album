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
    <div className="pack-opening-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '20px' }}>
      <div className="pack-opening-header" style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#474A4A',
        borderRadius: '15px',
        border: '3px solid #2A398D'
      }}>
        <h2 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '2.5rem' }}>🎁 Pack Opening</h2>
        <div className="pack-count-display">
          <h3 style={{ 
            color: 'white', 
            margin: 0,
            fontSize: '1.5rem',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>
            You have <span style={{ 
              color: '#3CAC3B', 
              fontWeight: 'bold',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '5px 10px',
              borderRadius: '8px'
            }}>{userPacks}</span> packs available
          </h3>
        </div>
      </div>

      {!isOpening && !showCards && (
        <div style={{ 
          textAlign: 'center',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          border: '3px solid #2A398D',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '15px', 
              fontSize: '20px', 
              fontWeight: 'bold',
              color: '#474A4A'
            }}>
              How many packs do you want to open?
            </label>
            <select
              value={packQuantity}
              onChange={(e) => setPackQuantity(parseInt(e.target.value))}
              style={{
                padding: '15px 20px',
                fontSize: '18px',
                borderRadius: '10px',
                border: '3px solid #2A398D',
                backgroundColor: 'white',
                cursor: 'pointer',
                marginBottom: '20px',
                color: '#474A4A',
                fontWeight: 'bold',
                minWidth: '200px'
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
            style={{
              padding: '20px 40px',
              fontSize: '20px',
              fontWeight: 'bold',
              borderRadius: '12px',
              border: 'none',
              cursor: userPacks > 0 && packQuantity <= userPacks ? 'pointer' : 'not-allowed',
              backgroundColor: userPacks > 0 && packQuantity <= userPacks ? '#2A398D' : '#474A4A',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              if (userPacks > 0 && packQuantity <= userPacks) {
                e.target.style.backgroundColor = '#1e2a6b';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (userPacks > 0 && packQuantity <= userPacks) {
                e.target.style.backgroundColor = '#2A398D';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }
            }}
          >
            {userPacks > 0 ? `🎁 Open ${packQuantity} Pack${packQuantity > 1 ? 's' : ''}!` : 'No Packs Available'}
          </button>
        </div>
      )}

      {isOpening && (
        <div className="opening-animation" style={{
          textAlign: 'center',
          backgroundColor: 'white',
          padding: '60px 40px',
          borderRadius: '15px',
          border: '3px solid #3CAC3B',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            color: '#2A398D', 
            fontSize: '2rem', 
            marginBottom: '30px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            ✨ Opening {packQuantity} pack{packQuantity > 1 ? 's' : ''}...
          </h3>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
            {Array.from({ length: Math.min(packQuantity, 5) }, (_, i) => (
              <div 
                key={i} 
                className="pack-icon" 
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  fontSize: '4rem',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }}
              >
                🎁
              </div>
            ))}
          </div>
          <p style={{ 
            marginTop: '30px', 
            color: '#474A4A',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            Shuffling cards and checking for duplicates...
          </p>
        </div>
      )}

      {showCards && openedCards.length > 0 && (
        <div className="pack-results" style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          border: '3px solid #3CAC3B',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            textAlign: 'center', 
            color: '#2A398D', 
            fontSize: '2rem',
            marginBottom: '30px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            🎉 You opened {packQuantity} pack{packQuantity > 1 ? 's' : ''} and got:
          </h3>
          <div className="cards-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '25px',
            marginBottom: '30px'
          }}>
            {openedCards.map((card, index) => {
              const cardImageUrl = getCardImageUrl(card.name);
              const isStacked = card.count > 1;

              return (
                <div key={index} className="result-card" style={{ 
                  position: 'relative',
                  backgroundColor: '#D1D4D1',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '3px solid #2A398D',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                }}>
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
                          backgroundColor: 'rgba(42, 57, 141, 0.4)',
                          borderRadius: '15px',
                          zIndex: -2,
                          border: '2px solid rgba(42, 57, 141, 0.3)'
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
                          backgroundColor: 'rgba(42, 57, 141, 0.3)',
                          borderRadius: '15px',
                          zIndex: -3,
                          border: '2px solid rgba(42, 57, 141, 0.2)'
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
                            backgroundColor: 'rgba(42, 57, 141, 0.2)',
                            borderRadius: '15px',
                            zIndex: -4,
                            border: '2px solid rgba(42, 57, 141, 0.1)'
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
                      backgroundColor: '#f0f8ff',
                      color: '#1e3a8a',
                      borderRadius: '50%',
                      width: '35px',
                      height: '35px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      zIndex: 20,
                      border: '2px solid #1e3a8a',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      x{card.count}
                    </div>
                  )}

                  <div className="card-image-container" style={{ 
                    position: 'relative', 
                    zIndex: 5,
                    marginBottom: '15px',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa', // Changed from white to light gray-blue
                    borderRadius: '10px',
                    border: '2px solid #D1D4D1', // Changed from #474A4A to lighter border
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' // Added subtle inset shadow
                  }}>
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
                      style={{ 
                        display: cardImageUrl ? 'none' : 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#474A4A'
                      }}
                    >
                      <h4 style={{ margin: '0 0 10px 0', color: '#2A398D' }}>{card.name}</h4>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>{card.team}</p>
                      <span className={`card-rarity rarity-${card.rarity?.toLowerCase() || 'common'}`} style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        backgroundColor: '#f8f9fa', // Changed to light background
                        color: '#2A398D', // Changed to dark blue text
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '2px solid #2A398D' // Added border
                      }}>
                        {card.rarity}
                      </span>
                    </div>
                  </div>
                  <div className="card-info" style={{ textAlign: 'center' }}>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      color: '#2A398D',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>{card.name}</h4>
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      color: '#474A4A',
                      fontWeight: 'bold'
                    }}>{card.team}</p>
                    <span className={`card-rarity rarity-${card.rarity?.toLowerCase() || 'common'}`} style={{
                      padding: '6px 12px',
                      borderRadius: '15px',
                      backgroundColor: '#f8f9fa', // Changed to light background
                      color: '#2A398D', // Changed to dark blue text
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      border: '2px solid #2A398D' // Added border for definition
                    }}>
                      {card.rarity}
                    </span>
                    {isStacked && (
                      <p style={{ 
                        color: '#1e3a8a', 
                        fontWeight: 'bold', 
                        fontSize: '16px',
                        margin: '10px 0 0 0',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        Got {card.count} copies! 🎉
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <p style={{ 
              backgroundColor: '#3CAC3B', 
              padding: '20px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              border: '3px solid #2A398D',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              🎉 Pack opening complete! You opened {packQuantity} pack{packQuantity > 1 ? 's' : ''} and got {openedCards.reduce((total, card) => total + card.count, 0)} cards total.
              {openedCards.some(card => card.count > 1) && (
                <><br />🔥 You got some duplicates - perfect for trading or you can delete extras in your collection!</>
              )}
            </p>
            <button
              onClick={() => setShowCards(false)}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#2A398D',
                color: 'white',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1e2a6b';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2A398D';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
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