import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import LoadingSpinner from './components/LoadingSpinner';
import { getCardImage } from './utils/cardImages';
import { createTradeNotification, notifyRelevantUsers } from './TradeNotifications';

const TradingPost = () => {
  const [userCards, setUserCards] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [availableTrades, setAvailableTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTrade, setShowCreateTrade] = useState(false);
  const [selectedOfferingCard, setSelectedOfferingCard] = useState('');
  const [selectedWantingCard, setSelectedWantingCard] = useState('');

  // New state for search functionality
  const [wantingCardSearch, setWantingCardSearch] = useState('');
  const [filteredAllCards, setFilteredAllCards] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadUserCollection(), loadAllCards(), loadAvailableTrades()]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Filter cards based on search term - FIXED
  useEffect(() => {
    if (wantingCardSearch.trim() === '') {
      setFilteredAllCards(allCards);
    } else {
      const filtered = allCards.filter(card => 
        (card.name || '').toLowerCase().includes(wantingCardSearch.toLowerCase()) ||
        (card.team || '').toLowerCase().includes(wantingCardSearch.toLowerCase()) ||
        (card.rarity || '').toLowerCase().includes(wantingCardSearch.toLowerCase())
      );
      setFilteredAllCards(filtered);
    }
  }, [allCards, wantingCardSearch]);

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

      // Only show cards with count > 1 (duplicates available for trade)
      const duplicateCards = cards.filter(card => card.count > 1);
      setUserCards(duplicateCards);
    } catch (error) {
      console.error('Error loading collection:', error);
    }
  };

  const loadAllCards = async () => {
    try {
      const cardsSnapshot = await getDocs(collection(db, 'cards'));
      const cards = cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllCards(cards);
      setFilteredAllCards(cards);
    } catch (error) {
      console.error('Error loading all cards:', error);
    }
  };

  const loadAvailableTrades = async () => {
    try {
      const tradesSnapshot = await getDocs(collection(db, 'trades'));
      const trades = tradesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Don't show current user's own trades
      const otherUserTrades = trades.filter(trade => trade.userId !== auth.currentUser.uid);
      setAvailableTrades(otherUserTrades);
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

// Helper function to get card image URL with proper fallbacks
const getCardImageUrl = (cardData) => {
  if (!cardData) return null;

  console.log('Trading Post - Getting image URL for:', cardData.name);

  // Use the main getCardImage function - it handles all mappings
  const cardImage = getCardImage(cardData.name);

  if (cardImage) {
    console.log('Trading Post - Using getCardImage result:', cardImage);
    return cardImage;
  }

  console.log('Trading Post - No image found for:', cardData.name);
  return null; // Return null if no image found
};

  // Helper function to get card image style with proper sizing for AFZ SJO 16
  const getCardImageStyle = (cardData, containerType = 'default') => {
    const baseStyle = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '8px'
    };

    // Special handling for AFZ SJO 16 card - keep it VERTICAL in trading post
    if (cardData && cardData.name === 'SJO 16 AFZ') {
      // In trading post, keep it vertical (no rotation)
      return {
        ...baseStyle,
        objectFit: 'cover'
        // No transform - stays vertical like other cards
      };
    }

    return baseStyle;
  };

const createTrade = async () => {
  if (!selectedOfferingCard || !selectedWantingCard) {
    alert('Please select both cards for the trade!');
    return;
  }

  if (selectedOfferingCard === selectedWantingCard) {
    alert('You cannot trade a card for itself!');
    return;
  }

  try {
    console.log('Creating trade:', selectedOfferingCard, 'for', selectedWantingCard);

    // Create the trade
    const tradeRef = await addDoc(collection(db, 'trades'), {
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      offeringCard: selectedOfferingCard,
      wantingCard: selectedWantingCard,
      createdAt: new Date()
    });

    console.log('Trade created with ID:', tradeRef.id);

    // Notify relevant users
    await notifyRelevantUsers({
      id: tradeRef.id,
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      offeringCard: selectedOfferingCard,
      wantingCard: selectedWantingCard
    });

    alert('✅ Trade offer created successfully! Users who have that card have been notified.');
    setShowCreateTrade(false);
    setSelectedOfferingCard('');
    setSelectedWantingCard('');
    setWantingCardSearch('');
    await loadAvailableTrades();
  } catch (error) {
    console.error('Error creating trade:', error);
    alert('❌ Error creating trade. Please try again.');
  }
};

const acceptTrade = async (trade) => {
  try {
    const currentUserId = auth.currentUser.uid;
    const currentUserEmail = auth.currentUser.email;

    // Check if current user has the card that the trade wants
    const userCollectionQuery = query(
      collection(db, 'userCollections'),
      where('userId', '==', currentUserId),
      where('cardData.name', '==', trade.wantingCard)
    );

    const userCardSnapshot = await getDocs(userCollectionQuery);

    if (userCardSnapshot.empty) {
      alert(`❌ You don't have ${trade.wantingCard} to trade!`);
      return;
    }

    const userCardDoc = userCardSnapshot.docs[0];
    const userCardData = userCardDoc.data();

    if (userCardData.count < 1) {
      alert(`❌ You don't have enough ${trade.wantingCard} cards to trade!`);
      return;
    }

    // Execute the trade
    await giveCardToUser(currentUserId, trade.offeringCard);
    await giveCardToUser(trade.userId, trade.wantingCard);
    await removeCardFromUser(currentUserId, trade.wantingCard);
    await removeCardFromUser(trade.userId, trade.offeringCard);
    await deleteDoc(doc(db, 'trades', trade.id));

    // Notify both users about the completed trade
    await createTradeNotification(trade.userId, 'trade_completed', {
      traderEmail: currentUserEmail,
      receivedCard: trade.wantingCard,
      givenCard: trade.offeringCard
    });

    await createTradeNotification(currentUserId, 'trade_completed', {
      traderEmail: trade.userEmail,
      receivedCard: trade.offeringCard,
      givenCard: trade.wantingCard
    });

    alert(`✅ Trade completed! You gave ${trade.wantingCard} and received ${trade.offeringCard}!`);

    // Reload data
    const loadData = async () => {
      await Promise.all([loadUserCollection(), loadAllCards(), loadAvailableTrades()]);
      setLoading(false);
    };
    await loadData();
  } catch (error) {
    console.error('Error accepting trade:', error);
    alert('❌ Error completing trade. Please try again.');
  }
};

  const giveCardToUser = async (userId, cardName) => {
    try {
      // Find the card data
      const cardData = allCards.find(card => card.name === cardName);
      if (!cardData) return;

      // Check if user already has this card
      const userCollectionQuery = query(
        collection(db, 'userCollections'),
        where('userId', '==', userId),
        where('cardId', '==', cardData.id)
      );

      const existingCardSnapshot = await getDocs(userCollectionQuery);

      if (!existingCardSnapshot.empty) {
        // User already has this card, increase count
        const existingCardDoc = existingCardSnapshot.docs[0];
        const currentCount = existingCardDoc.data().count || 1;
        await updateDoc(existingCardDoc.ref, { count: currentCount + 1 });
      } else {
        // User doesn't have this card, create new entry
        await addDoc(collection(db, 'userCollections'), {
          userId: userId,
          cardId: cardData.id,
          cardData: cardData,
          count: 1,
          obtainedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error giving card to user:', error);
    }
  };

  const removeCardFromUser = async (userId, cardName) => {
    try {
      const userCollectionQuery = query(
        collection(db, 'userCollections'),
        where('userId', '==', userId),
        where('cardData.name', '==', cardName)
      );

      const userCardSnapshot = await getDocs(userCollectionQuery);

      if (!userCardSnapshot.empty) {
        const userCardDoc = userCardSnapshot.docs[0];
        const currentCount = userCardDoc.data().count || 1;

        if (currentCount > 1) {
          // Decrease count by 1
          await updateDoc(userCardDoc.ref, { count: currentCount - 1 });
        } else {
          // Remove the document if count reaches 0
          await deleteDoc(userCardDoc.ref);
        }
      }
    } catch (error) {
      console.error('Error removing card from user:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="🔄 Loading Trading Post..." size="medium" />;
  }

  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #f0f8ff 0%, #ffffff 50%, #e6f3ff 100%)',
      minHeight: '100vh' 
    }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        backgroundColor: '#1e3a8a',
        padding: '30px',
        borderRadius: '15px',
        border: '3px solid #1e3a8a'
      }}>
        <h2 style={{ 
          color: 'white', 
          margin: '0 0 10px 0',
          fontSize: '2.5rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>🔄 Trading Post</h2>
        <p style={{ 
          color: 'white', 
          margin: 0,
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}>Trade your duplicate cards with other collectors!</p>
      </div>

      {/* User's Available Cards for Trading */}
      <div style={{ 
        marginBottom: '40px',
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '15px',
        border: '3px solid #1e3a8a',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          color: '#1e3a8a', 
          marginBottom: '20px',
          fontSize: '1.8rem',
          textAlign: 'center'
        }}>📦 Your Duplicate Cards (Available for Trading)</h3>
        {userCards.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f0f8ff',
            borderRadius: '10px',
            border: '2px solid #1e3a8a'
          }}>
            <p style={{ 
              color: '#1e3a8a', 
              fontStyle: 'italic',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: 0
            }}>
              You don't have any duplicate cards to trade yet. Open more packs to get duplicates!
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '20px',
            marginBottom: '25px'
          }}>
            {userCards.map((card) => (
              <div
                key={card.id}
                style={{
                  border: '3px solid #1e3a8a',
                  borderRadius: '12px',
                  padding: '18px',
                  backgroundColor: '#f0f8ff',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                  position: 'relative',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: '#1e3a8a',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {card.count}
                </div>

                {/* Fixed Card Image Display */}
                <div style={{ 
                  width: '100%', 
                  height: '140px', 
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '2px solid #1e3a8a'
                }}>
                  {getCardImageUrl(card.cardData) ? (
                    <img
                      src={getCardImageUrl(card.cardData)}
                      alt={card.cardData?.name || 'Card'}
                      style={getCardImageStyle(card.cardData, 'collection')}
                      onError={(e) => {
                        console.log('Trading Post image failed to load for:', card.cardData?.name);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      onLoad={() => {
                        console.log('Trading Post image loaded successfully for:', card.cardData?.name);
                      }}
                    />
                  ) : null}
                  <div style={{
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#1e3a8a',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center',
                    flexDirection: 'column',
                    fontWeight: 'bold'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎴</div>
                    <div>{card.cardData?.name || 'Unknown Card'}</div>
                  </div>
                </div>

                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#1e3a8a',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {card.cardData?.name || 'Unknown Card'}
                </h4>
                <p style={{ 
                  margin: '6px 0', 
                  fontSize: '14px', 
                  color: '#1e3a8a',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  {card.cardData?.team || 'No Team'}
                </p>
                <p style={{ 
                  margin: '6px 0', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  color: '#1e3a8a',
                  textAlign: 'center',
                  backgroundColor: 'rgba(30,58,138,0.1)',
                  padding: '4px 8px',
                  borderRadius: '8px'
                }}>
                  {card.cardData?.rarity || 'Unknown'}
                </p>
                <p style={{ 
                  margin: '10px 0 0 0', 
                  fontSize: '13px', 
                  color: '#1e3a8a',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  {card.count - 1} available for trade
                </p>
              </div>
            ))}
          </div>
        )}

        {userCards.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setShowCreateTrade(!showCreateTrade)}
              style={{
                padding: '15px 30px',
                backgroundColor: showCreateTrade ? '#dc3545' : '#1e3a8a',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
            >
              {showCreateTrade ? '❌ Cancel' : '➕ Create New Trade'}
            </button>
          </div>
        )}
      </div>

      {/* Available Trades from Other Users */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '15px',
        border: '3px solid #1e3a8a',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          color: '#1e3a8a', 
          marginBottom: '20px',
          fontSize: '1.8rem',
          textAlign: 'center'
        }}>🛒 Available Trades from Other Collectors</h3>
        {availableTrades.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f0f8ff',
            borderRadius: '10px',
            border: '2px solid #1e3a8a'
          }}>
            <p style={{ 
              color: '#1e3a8a', 
              fontStyle: 'italic',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: 0
            }}>
              No trades available right now. Be the first to post a trade!
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '25px' 
          }}>
            {availableTrades.map((trade) => (
              <div
                key={trade.id}
                style={{
                  border: '3px solid #1e3a8a',
                  borderRadius: '12px',
                  padding: '25px',
                  backgroundColor: '#f0f8ff',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <strong style={{ 
                    color: '#1e3a8a', 
                    fontSize: '18px',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Trade Offer</strong>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#1e3a8a', 
                    margin: 0,
                    fontWeight: 'bold'
                  }}>
                    by {trade.userEmail}
                  </p>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '10px',
                    border: '2px solid #22c55e'
                  }}>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#1e3a8a', 
                      margin: '0 0 8px 0',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>OFFERING</p>
                    <strong style={{ 
                      color: '#22c55e',
                      fontSize: '16px',
                      display: 'block'
                    }}>{trade.offeringCard}</strong>
                  </div>

                  <div style={{ 
                    fontSize: '24px',
                    color: '#1e3a8a',
                    fontWeight: 'bold'
                  }}>🔄</div>

                  <div style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '10px',
                    border: '2px solid #dc3545'
                  }}>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#1e3a8a', 
                      margin: '0 0 8px 0',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>WANTS</p>
                    <strong style={{ 
                      color: '#dc3545',
                      fontSize: '16px',
                      display: 'block'
                    }}>{trade.wantingCard}</strong>
                  </div>
                </div>

                <button
                  onClick={() => acceptTrade(trade)}
                  style={{
                    width: '100%',
                    padding: '15px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#16a34a';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#22c55e';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  }}
                >
                  ✅ Accept Trade
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Create Trade Form */}
      {showCreateTrade && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(30,58,138,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '35px',
            borderRadius: '20px',
            maxWidth: '650px',
            width: '95%',
            maxHeight: '85vh',
            overflow: 'auto',
            border: '4px solid #1e3a8a',
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ 
              color: '#1e3a8a', 
              textAlign: 'center',
              fontSize: '2rem',
              marginBottom: '25px'
            }}>Create New Trade</h3>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontWeight: 'bold',
                color: '#1e3a8a',
                fontSize: '16px'
              }}>
                I'm offering:
              </label>
              <select
                value={selectedOfferingCard}
                onChange={(e) => setSelectedOfferingCard(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '3px solid #22c55e',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  color: '#1e3a8a',
                  fontWeight: 'bold'
                }}
              >
                <option value="">Select a card to offer...</option>
                {userCards.map((card) => (
                  <option key={card.id} value={card.cardData?.name || 'Unknown'}>
                    {card.cardData?.name || 'Unknown Card'} (You have {card.count})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontWeight: 'bold',
                color: '#1e3a8a',
                fontSize: '16px'
              }}>
                I want:
              </label>

              {/* Search Input */}
              <input
                type="text"
                placeholder="🔍 Search for a card by name, team, or rarity..."
                value={wantingCardSearch}
                onChange={(e) => setWantingCardSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '3px solid #1e3a8a',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '12px',
                  backgroundColor: '#f0f8ff',
                  color: '#1e3a8a',
                  fontWeight: 'bold'
                }}
              />

{/* Filtered Dropdown */}
<select
  value={selectedWantingCard}
  onChange={(e) => {
    console.log('Selected card:', e.target.value); // Debug line
    setSelectedWantingCard(e.target.value);
  }}
  style={{
    width: '100%',
    padding: '12px',
    border: '3px solid #dc3545',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: 'white',
    color: '#1e3a8a',
    fontWeight: 'bold',
    cursor: 'pointer'
  }}
>
  <option value="">
    {wantingCardSearch ? 
      `Select from ${filteredAllCards.length} filtered cards...` : 
      'Select a card you want...'
    }
  </option>
  {filteredAllCards.map((card) => (
    <option key={card.id} value={card.name || 'Unknown'}>
      {card.name || 'Unknown'} ({card.team || 'No Team'} - {card.rarity || 'Unknown'})
    </option>
  ))}
</select>

{/* Show selected card for confirmation */}
{selectedWantingCard && (
  <div style={{
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#e6f3ff',
    border: '2px solid #1e3a8a',
    borderRadius: '8px',
    textAlign: 'center'
  }}>
    <strong style={{ color: '#1e3a8a' }}>
      Selected: {selectedWantingCard}
    </strong>
  </div>
)}

              {wantingCardSearch && filteredAllCards.length === 0 && (
                <p style={{ 
                  color: '#dc3545', 
                  fontSize: '14px', 
                  margin: '8px 0',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: 'rgba(220,53,69,0.1)',
                  padding: '8px',
                  borderRadius: '6px'
                }}>
                  No cards found matching "{wantingCardSearch}"
                </p>
              )}

              {wantingCardSearch && filteredAllCards.length > 0 && (
                <p style={{ 
                  color: '#22c55e', 
                  fontSize: '14px', 
                  margin: '8px 0',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  padding: '8px',
                  borderRadius: '6px'
                }}>
                  Found {filteredAllCards.length} card(s) matching "{wantingCardSearch}"
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={createTrade}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#16a34a';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#22c55e';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ✅ Create Trade
              </button>
              <button
                onClick={() => {
                  setShowCreateTrade(false);
                  setWantingCardSearch('');
                  setSelectedOfferingCard('');
                  setSelectedWantingCard('');
                }}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4b5563';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6b7280';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPost;