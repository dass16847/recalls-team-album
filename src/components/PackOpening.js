import React, { useState } from 'react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import './PackOpening.css';
import { db, auth } from '../firebase';
import { getCardImage } from '../utils/cardImages';

function PackOpening({ userPacks, onPackOpened }) {
  const [isOpening, setIsOpening] = useState(false);
  const [openedCards, setOpenedCards] = useState([]);
  const [showCards, setShowCards] = useState(false);

  const openPack = async () => {
    if (userPacks <= 0 || isOpening) return;
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

      const packCards = [];
      for (let i = 0; i < 3; i++) {
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
        packCards.push(randomCard);
      }

      const userId = auth.currentUser.uid;
      for (const card of packCards) {
        const userCardRef = doc(db, 'userCollections', userId + '_' + card.id);
        const existingCard = await getDoc(userCardRef);

        if (existingCard.exists()) {
          await setDoc(userCardRef, {
            ...existingCard.data(),
            count: existingCard.data().count + 1
          });
        } else {
          await setDoc(userCardRef, {
            userId: userId,
            cardId: card.id,
            cardData: card,
            count: 1,
            dateObtained: new Date()
          });
        }
      }

      setOpenedCards(packCards);
      setTimeout(() => {
        setShowCards(true);
        setIsOpening(false);
        onPackOpened();
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
          <button
            onClick={openPack}
            disabled={userPacks <= 0}
            className="open-pack-button"
          >
            {userPacks > 0 ? '🎁 Open Pack!' : 'No Packs Available'}
          </button>
        </div>
      )}

      {isOpening && (
        <div className="opening-animation">
          <h3>✨ Opening pack...</h3>
          <div className="pack-icon">🎁</div>
        </div>
      )}

      {showCards && openedCards.length > 0 && (
        <div className="pack-results">
          <h3>🎉 You got these cards:</h3>
          <div className="cards-grid">
  {openedCards.map((card, index) => {
    const cardImage = getCardImage(card.name);
    console.log('Card name:', card.name, 'Image found:', !!cardImage); // Debug line

    return (
      <div key={index} className="result-card">
        <div className="card-image-container">
          {cardImage ? (
            <img 
              src={cardImage} 
              alt={card.name}
              className="card-image"
              onError={(e) => {
                console.log('Image failed to load:', card.name);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="card-fallback" 
            style={{ display: cardImage ? 'none' : 'flex' }}
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
        </div>
      </div>
    );
  })}
          </div>
          <button
            onClick={() => setShowCards(false)}
            className="close-results-button"
          >
            ✨ Close Results
          </button>
        </div>
      )}
    </div>
  );
}

export default PackOpening;