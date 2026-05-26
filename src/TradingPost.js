import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import LoadingSpinner from './components/LoadingSpinner';
import { getCardImage } from './utils/cardImages'; // ADD THIS LINE

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

  // Filter cards based on search term
  useEffect(() => {
    if (wantingCardSearch.trim() === '') {
      setFilteredAllCards(allCards);
    } else {
      const filtered = allCards.filter(card => 
        card.name.toLowerCase().includes(wantingCardSearch.toLowerCase()) ||
        card.team.toLowerCase().includes(wantingCardSearch.toLowerCase()) ||
        card.rarity.toLowerCase().includes(wantingCardSearch.toLowerCase())
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
    if (cardData.name === 'SJO 16 AFZ') {
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
      await addDoc(collection(db, 'trades'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        offeringCard: selectedOfferingCard,
        wantingCard: selectedWantingCard,
        createdAt: new Date()
      });

      alert('✅ Trade offer created successfully!');
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
      // 1. Give the offering card to current user
      await giveCardToUser(currentUserId, trade.offeringCard);

      // 2. Give the wanting card to trade creator
      await giveCardToUser(trade.userId, trade.wantingCard);

      // 3. Remove one card from current user's collection
      await removeCardFromUser(currentUserId, trade.wantingCard);

      // 4. Remove one card from trade creator's collection
      await removeCardFromUser(trade.userId, trade.offeringCard);

      // 5. Delete the trade
      await deleteDoc(doc(db, 'trades', trade.id));

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
    <div style={{ padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>🔄 Trading Post</h2>
        <p>Trade your duplicate cards with other collectors!</p>
      </div>

      {/* User's Available Cards for Trading */}
      <div style={{ marginBottom: '40px' }}>
        <h3>📦 Your Duplicate Cards (Available for Trading)</h3>
        {userCards.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            You don't have any duplicate cards to trade yet. Open more packs to get duplicates!
          </p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            {userCards.map((card) => (
              <div
                key={card.id}
                style={{
                  border: '2px solid #28a745',
                  borderRadius: '10px',
                  padding: '15px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '50%',
                  width: '25px',
                  height: '25px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {card.count}
                </div>

                {/* Fixed Card Image Display */}
                <div style={{ 
                  width: '100%', 
                  height: '120px', 
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {getCardImageUrl(card.cardData) ? (
  <img
    src={getCardImageUrl(card.cardData)}
    alt={card.cardData.name}
    style={getCardImageStyle(card.cardData, 'collection')}
    onError={(e) => {
      console.log('Trading Post image failed to load for:', card.cardData.name);
      e.target.style.display = 'none';
      e.target.nextSibling.style.display = 'flex';
    }}
    onLoad={() => {
      console.log('Trading Post image loaded successfully for:', card.cardData.name);
    }}
  />
) : null}
                  <div style={{
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#e9ecef',
                    color: '#6c757d',
                    fontSize: '12px',
                    textAlign: 'center',
                    flexDirection: 'column'
                  }}>
                    <div>🎴</div>
                    <div>{card.cardData.name}</div>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 8px 0', color: '#28a745' }}>
                  {card.cardData.name}
                </h4>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                  {card.cardData.team}
                </p>
                <p style={{ margin: '4px 0', fontSize: '12px', fontWeight: 'bold', color: '#28a745' }}>
                  {card.cardData.rarity}
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#28a745' }}>
                  {card.count - 1} available for trade
                </p>
              </div>
            ))}
          </div>
        )}

        {userCards.length > 0 && (
          <button
            onClick={() => setShowCreateTrade(!showCreateTrade)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {showCreateTrade ? '❌ Cancel' : '➕ Create New Trade'}
          </button>
        )}
      </div>

      {/* Available Trades from Other Users */}
      <div>
        <h3>🛒 Available Trades from Other Collectors</h3>
        {availableTrades.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No trades available right now. Be the first to post a trade!
          </p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '20px' 
          }}>
            {availableTrades.map((trade) => (
              <div
                key={trade.id}
                style={{
                  border: '2px solid #17a2b8',
                  borderRadius: '10px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#17a2b8' }}>Trade Offer</strong>
                  <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
                    by {trade.userEmail}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>OFFERING</p>
                    <strong style={{ color: '#28a745' }}>{trade.offeringCard}</strong>
                  </div>

                  <div style={{ fontSize: '20px' }}>🔄</div>

                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>WANTS</p>
                    <strong style={{ color: '#dc3545' }}>{trade.wantingCard}</strong>
                  </div>
                </div>

                <button
                  onClick={() => acceptTrade(trade)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginTop: '15px',
                    fontWeight: 'bold'
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
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>Create New Trade</h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                I'm offering:
              </label>
              <select
                value={selectedOfferingCard}
                onChange={(e) => setSelectedOfferingCard(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select a card to offer...</option>
                {userCards.map((card) => (
                  <option key={card.id} value={card.cardData.name}>
                    {card.cardData.name} (You have {card.count})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
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
                  padding: '10px',
                  border: '1px solid #007bff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '10px',
                  backgroundColor: '#f8f9ff'
                }}
              />

              {/* Filtered Dropdown */}
              <select
                value={selectedWantingCard}
                onChange={(e) => setSelectedWantingCard(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  maxHeight: '200px'
                }}
                size={Math.min(filteredAllCards.length + 1, 8)}
              >
                <option value="">
                  {wantingCardSearch ? 
                    `Select from ${filteredAllCards.length} filtered cards...` : 
                    'Select a card you want...'
                  }
                </option>
                {filteredAllCards.map((card) => (
                  <option key={card.id} value={card.name}>
                    {card.name} ({card.team} - {card.rarity})
                  </option>
                ))}
              </select>

              {wantingCardSearch && filteredAllCards.length === 0 && (
                <p style={{ color: '#dc3545', fontSize: '12px', margin: '5px 0' }}>
                  No cards found matching "{wantingCardSearch}"
                </p>
              )}

              {wantingCardSearch && filteredAllCards.length > 0 && (
                <p style={{ color: '#28a745', fontSize: '12px', margin: '5px 0' }}>
                  Found {filteredAllCards.length} card(s) matching "{wantingCardSearch}"
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={createTrade}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
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
                  padding: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
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