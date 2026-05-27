import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import './Album.css';
import LoadingSpinner from './components/LoadingSpinner';
import { getCardImage } from './utils/cardImages';
// Add this after your imports in Album.js
import testRafa from './images/cards/rafa.png';
import testIre from './images/cards/ire-vargas.png';
import testPawel from './images/cards/pawel.png';

console.log('=== DIRECT IMPORT TEST ===');
console.log('Direct RAFA import:', testRafa);
console.log('Direct IRE import:', testIre);
console.log('Direct PAWEL import:', testPawel);

// Import all album page backgrounds
import page00 from './images/album-pages/page-00-cover.png';
import page01 from './images/album-pages/page-01-reprir.png';
import page02 from './images/album-pages/page-02-upper-leadership.png';
import page03 from './images/album-pages/page-03-leadership.png';
import page04 from './images/album-pages/page-04-website-research-1.png';
import page05 from './images/album-pages/page-05-website-research-2.png';
import page06 from './images/album-pages/page-06-rule-writing.png';
import page07 from './images/album-pages/page-07-asin-review.png';
import page08 from './images/album-pages/page-08-asin-suppression-1.png';
import page09 from './images/album-pages/page-09-asin-suppression-2.png';
import page10 from './images/album-pages/page-10-global-recalls.png';
import page11 from './images/album-pages/page-11-warden-adc.png';
import page12 from './images/album-pages/page-12-verification-destruction.png';
import page13 from './images/album-pages/page-13-inventory-removals.png';
import page14 from './images/album-pages/page-14-closing.png';

const Album = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [placedCards, setPlacedCards] = useState({});
  const [userCards, setUserCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Helper function to get card image URL with proper fallbacks
  const getCardImageUrl = (cardName) => {
    console.log('Getting image URL for:', cardName);

    // Use the main getCardImage function - it handles all mappings
    const cardImage = getCardImage(cardName);

    if (cardImage) {
      console.log('Using getCardImage result:', cardImage);
      return cardImage;
    }

    console.log('No image found for:', cardName);
    return null; // Return null if no image found
  };

// Helper function to get proper styling for cards
const getCardImageStyle = (cardName, context = 'album') => {
  const baseStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '8px'
  };

  // Special handling for AFZ SJO 16 card
  if (cardName === 'SJO 16 AFZ') {
    if (context === 'album') {
      // In album slot: rotate 90 degrees and scale with specific ratios
      return {
        ...baseStyle,
        objectFit: 'fit', // FIXED: was 'fit', now 'contain'
        transform: 'rotate(90deg) scale(0.62, 1.70)', // Your preferred scaling
        transformOrigin: 'center center'
      };
    } else {
      // In collection, packs, trading: keep vertical (NO rotation)
      return {
        ...baseStyle,
        objectFit: 'cover'
        // No transform - stays vertical
      };
    }
  }

  return {
    ...baseStyle,
    objectFit: 'cover'
  };
};

  // Define your album structure with exact Canva positions
  const albumPages = [
    { 
      id: 0, 
      title: "Cover Page", 
      type: "cover",
      slots: [],
      backgroundImage: page00
    },
    { 
      id: 1, 
      title: "REPRIR ALBUM", 
      type: "special", 
      backgroundImage: page01,
      slots: [
        { name: "JEFF BEZOS", position: { top: 43, left: 750, width: 296, height: 388 } },
        { name: "SJO 16 AFZ", position: { top: 454, left: 74, width: 638, height: 388 } },
        { name: "ANDY JASSY", position: { top: 447, left: 750, width: 296, height: 388 } }
      ]
    },
   { 
  id: 2, 
  title: "Upper Leadership Team", 
  type: "team",
  backgroundImage: page02,
  slots: [
    { name: "JP", position: { top: 447, left: 135, width: 296, height: 388 } },
    { name: "RAFA", position: { top: 447, left: 680, width: 296, height: 388 } },
    { name: "IRE", position: { top: 864, left: 135, width: 296, height: 388 } },
    { name: "PAWEL", position: { top: 864, left: 680, width: 296, height: 388 } }
  ]
},
    { 
      id: 3, 
      title: "Leadership Team", 
      type: "team",
      backgroundImage: page03,
      slots: [
        { name: "ANDREY SOTO", position: { top: 43, left: 750, width: 296, height: 388 } },
        { name: "ISMA VINDAS", position: { top: 447, left: 74, width: 296, height: 388 } },
        { name: "ARIEL BOLANOS", position: { top: 447, left: 412, width: 296, height: 388 } },
        { name: "EIMY TORRES", position: { top: 447, left: 750, width: 296, height: 388 } },
        { name: "MARYPAZ MORA", position: { top: 864, left: 74, width: 296, height: 388 } },
        { name: "DARIO CAMPOS", position: { top: 864, left: 413, width: 296, height: 388 } },
        { name: "JULIAN HERNANDEZ", position: { top: 864, left: 750, width: 296, height: 388 } }
      ]
    },
    { 
      id: 4, 
      title: "Website Research", 
      type: "team",
      backgroundImage: page04,
      slots: [
        { name: "STEVEN GONZALEZ", position: { top: 447, left: 74, width: 296, height: 388 } },
        { name: "DANIEL GUADAMUZ", position: { top: 447, left: 412, width: 296, height: 388 } },
        { name: "JORGE BRENES", position: { top: 447, left: 750, width: 296, height: 388 } },
        { name: "NICK NOVA", position: { top: 864, left: 74, width: 296, height: 388 } },
        { name: "VERO DURAN", position: { top: 864, left: 413, width: 296, height: 388 } },
        { name: "JOSE REYES", position: { top: 864, left: 750, width: 296, height: 388 } }
      ]
    },
    { 
      id: 5, 
      title: "Website Research", 
      type: "team",
      backgroundImage: page05,
      slots: [
        { name: "PAULETTE RUIZ", position: { top: 447, left: 74, width: 296, height: 388 } },
        { name: "JOSE MONGE", position: { top: 447, left: 412, width: 296, height: 388 } },
        { name: "NATHALIE GONZALEZ", position: { top: 447, left: 750, width: 296, height: 388 } },
        { name: "BRAYAN SALAZAR", position: { top: 864, left: 74, width: 296, height: 388 } },
        { name: "YANIFEL ALVARADO", position: { top: 864, left: 413, width: 296, height: 388 } }
      ]
    },
    { 
      id: 6, 
      title: "Rule Writing", 
      type: "team",
      backgroundImage: page06,
      slots: [
        { name: "VALERIA CUBERO", position: { top: 43, left: 750, width: 296, height: 388 } },
        { name: "ANTONIO AMEZ", position: { top: 447, left: 74, width: 296, height: 388 } },
        { name: "GREIVIN MEZA", position: { top: 447, left: 412, width: 296, height: 388 } },
        { name: "PAOLA JIMENEZ", position: { top: 447, left: 750, width: 296, height: 388 } },
        { name: "NATALIA ABARCA", position: { top: 864, left: 74, width: 296, height: 388 } },
        { name: "ISAAC AVILA", position: { top: 864, left: 413, width: 296, height: 388 } },
        { name: "ANDREINA CASTILLO", position: { top: 864, left: 750, width: 296, height: 388 } }
      ]
    },
    { 
      id: 7, 
      title: "ASIN Review", 
      type: "team",
      backgroundImage: page07,
      slots: [
        { name: "WILBERT CEDENO", position: { top: 43, left: 750, width: 296, height: 388 } },
        { name: "RAQUEL FERNANDEZ", position: { top: 447, left: 74, width: 296, height: 388 } },
        { name: "FERGIE MONCADA", position: { top: 447, left: 412, width: 296, height: 388 } },
        { name: "TOMAS SOLEY", position: { top: 447, left: 750, width: 296, height: 388 } },
        { name: "MARIANELLA PEREZ", position: { top: 864, left: 74, width: 296, height: 388 } },
        { name: "ALLAN HIDALGO", position: { top: 864, left: 413, width: 296, height: 388 } },
        { name: "KATHERINE MORERA", position: { top: 864, left: 750, width: 296, height: 388 } }
      ]
    },
    { 
      id: 8, 
      title: "ASIN Suppression", 
      type: "team",
      backgroundImage: page08,
      slots: [
        { name: "DANIELA JIMENEZ", position: { top: 447, left: 74, width: 296, height: 388 } },
        { name: "PILAR HERNANDEZ", position: { top: 447, left: 412, width: 296, height: 388 } },
        { name: "MAIKOL DIAZ", position: { top: 447, left: 750, width: 296, height: 388 } },
        { name: "RAQUEL BLANCO", position: { top: 864, left: 74, width: 296, height: 388 } },
        { name: "TAYRON DURAN", position: { top: 864, left: 413, width: 296, height: 388 } },
        { name: "STEPH ANGULO", position: { top: 864, left: 750, width: 296, height: 388 } }
      ]
    },
    { 
      id: 9, 
      title: "ASIN Suppression", 
      type: "team",
      backgroundImage: page09,
      slots: [
        { name: "GABRIELA GOMEZ", position: { top: 447, left: 74, width: 296, height: 388 } },
        { name: "RAMIRO CHACON", position: { top: 447, left: 412, width: 296, height: 388 } },
        { name: "HENRY RODRIGUEZ", position: { top: 447, left: 750, width: 296, height: 388 } },
        { name: "NATALIA BLANCO", position: { top: 864, left: 74, width: 296, height: 388 } },
        { name: "YEYLAN AGUIRRE", position: { top: 864, left: 413, width: 296, height: 388 } },
        { name: "LY ANN HERRERA", position: { top: 864, left: 750, width: 296, height: 388 } }
      ]
    },
    { 
      id: 10, 
      title: "Global Recalls", 
      type: "team",
      backgroundImage: page10,
      slots: [
        { name: "PABLO DELGADO", position: { top: 447, left: 74, width: 296, height: 388 } },
        { name: "DAVID GONZALEZ", position: { top: 447, left: 412, width: 296, height: 388 } },
        { name: "ARIANA ALCAZAR", position: { top: 447, left: 750, width: 296, height: 388 } },
        { name: "PAOLA QUIROS", position: { top: 864, left: 74, width: 296, height: 388 } },
        { name: "SHARON UMANA", position: { top: 864, left: 413, width: 296, height: 388 } },
        { name: "DAVID LOAIZA", position: { top: 864, left: 750, width: 296, height: 388 } }
      ]
    },
    { 
      id: 11, 
      title: "Warden ADC", 
      type: "team",
      backgroundImage: page11,
      slots: [
        { name: "LAURA MUNOZ", position: { top: 447, left: 135, width: 296, height: 388 } },
        { name: "HENRY MOLINA", position: { top: 447, left: 680, width: 296, height: 388 } },
        { name: "ESTEBAN VALERIO", position: { top: 864, left: 135, width: 296, height: 388 } },
        { name: "JENSI PEINADO", position: { top: 864, left: 680, width: 296, height: 388 } }
      ]
    },
    { 
      id: 12, 
      title: "Verification of Destruction", 
      type: "team",
      backgroundImage: page12,
      slots: [
        { name: "DAVID SEITZ", position: { top: 447, left: 135, width: 296, height: 388 } },
        { name: "JAZMIN DELGADO", position: { top: 447, left: 680, width: 296, height: 388 } },
        { name: "JOSE MASIS", position: { top: 864, left: 135, width: 296, height: 388 } },
        { name: "MARIA PANA", position: { top: 864, left: 680, width: 296, height: 388 } }
      ]
    },
    { 
      id: 13, 
      title: "Inventory Removals", 
      type: "team",
      backgroundImage: page13,
      slots: [
        { name: "JORDAN MORA", position: { top: 447, left: 74, width: 296, height: 388 } },
        { name: "ADRIANA CRUZ", position: { top: 447, left: 412, width: 296, height: 388 } },
        { name: "SHARON QUESADA", position: { top: 447, left: 750, width: 296, height: 388 } },
        { name: "MITZY HERNANDEZ", position: { top: 864, left: 74, width: 296, height: 388 } },
        { name: "KEVIN HIDALGO", position: { top: 864, left: 413, width: 296, height: 388 } },
        { name: "MAYCOL MOREIRA", position: { top: 864, left: 750, width: 296, height: 388 } }
      ]
    },
    { 
      id: 14, 
      title: "Closing Page", 
      type: "closing",
      backgroundImage: page14,
      slots: []
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadPlacedCards(), loadUserCollection()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const loadPlacedCards = async () => {
    try {
      const userId = auth.currentUser.uid;
      const albumDocRef = doc(db, 'userAlbums', userId);
      const albumDoc = await getDoc(albumDocRef);

      if (albumDoc.exists()) {
        setPlacedCards(albumDoc.data().placedCards || {});
      }
    } catch (error) {
      console.error('Error loading placed cards:', error);
    }
  };

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
    } catch (error) {
      console.error('Error loading collection:', error);
    }
  };

  const savePlacedCards = async (newPlacedCards) => {
    try {
      const userId = auth.currentUser.uid;
      const albumDocRef = doc(db, 'userAlbums', userId);
      await setDoc(albumDocRef, { placedCards: newPlacedCards }, { merge: true });
    } catch (error) {
      console.error('Error saving placed cards:', error);
    }
  };

  const decreaseCardCount = async (userCardId) => {
    try {
      const userCardRef = doc(db, 'userCollections', userCardId);
      const userCardDoc = await getDoc(userCardRef);

      if (userCardDoc.exists()) {
        const currentCount = userCardDoc.data().count || 1;

        if (currentCount > 1) {
          await updateDoc(userCardRef, { count: currentCount - 1 });
        } else {
          await deleteDoc(userCardRef);
        }
      }
    } catch (error) {
      console.error('Error decreasing card count:', error);
    }
  };

  // NEW: Delete card function for duplicate management
  const deleteCard = async (userCardId, cardName, currentCount) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete one copy of "${cardName}"?\n\n` +
      `Current count: ${currentCount}\n` +
      `After deletion: ${currentCount - 1}\n\n` +
      `This action cannot be undone!`
    );

    if (!confirmDelete) return;

    try {
      const userCardRef = doc(db, 'userCollections', userCardId);
      const userCardDoc = await getDoc(userCardRef);

      if (userCardDoc.exists()) {
        const newCount = currentCount - 1;

        if (newCount > 0) {
          // Update count if more than 0 remaining
          await updateDoc(userCardRef, { count: newCount });
        } else {
          // Delete the document if no cards remaining
          await deleteDoc(userCardRef);
        }

        // Reload the collection to show updated counts
        await loadUserCollection();

        alert(`✅ Successfully deleted one copy of "${cardName}"!`);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('❌ Error deleting card. Please try again.');
    }
  };

  // Completion tracking functions
  const calculateTotalSlots = () => {
    return albumPages.reduce((total, page) => {
      return total + (page.slots ? page.slots.length : 0);
    }, 0);
  };

  const calculateFilledSlots = () => {
    return Object.keys(placedCards).length;
  };

  const calculateCompletionPercentage = () => {
    const total = calculateTotalSlots();
    const filled = calculateFilledSlots();
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  const calculatePageCompletion = (pageId) => {
    const page = albumPages.find(p => p.id === pageId);
    if (!page || !page.slots) return 0;

    const pageSlots = page.slots.length;
    const filledSlots = page.slots.filter(slot => {
      const slotKey = `${pageId}-${slot.name}`;
      return placedCards[slotKey];
    }).length;

    return pageSlots > 0 ? Math.round((filledSlots / pageSlots) * 100) : 0;
  };

  const checkForCompletion = () => {
    if (calculateCompletionPercentage() === 100) {
      setTimeout(() => {
        alert('🎉 CONGRATULATIONS! 🎉\n\nYou have completed the entire REPRIR Team Album!\n\nYou collected all team members! 🏆');
      }, 500);
    }
  };

const handleDrop = async (e, slotName, pageId) => {
  e.preventDefault();

  try {
    const cardData = JSON.parse(e.dataTransfer.getData('application/json'));

    // CREATE A NAME NORMALIZATION FUNCTION
    const normalizeCardName = (name) => {
      const nameMap = {
        'RAFA AGUERO': 'RAFA',
        'PAWEL PUDLIK': 'PAWEL', 
        'IRE VARGAS': 'IRE'
      };
      return nameMap[name.toUpperCase()] || name.toUpperCase();
    };

    // USE NORMALIZED NAMES FOR COMPARISON
    const normalizedCardName = normalizeCardName(cardData.cardData.name);
    const normalizedSlotName = normalizeCardName(slotName);

    if (normalizedCardName === normalizedSlotName) {
      const slotKey = `${pageId}-${slotName}`;

      if (placedCards[slotKey]) {
        alert(`❌ This slot already has a card placed!`);
        return;
      }

      const newPlacedCards = {
        ...placedCards,
        [slotKey]: cardData
      };

      setPlacedCards(newPlacedCards);
      await savePlacedCards(newPlacedCards);
      await decreaseCardCount(cardData.userCardId);
      await loadUserCollection();

      // REMOVED: alert(`✅ ${cardData.cardData.name} placed successfully!`);
      checkForCompletion();
    } else {
      alert(`❌ This card doesn't belong in the ${slotName} slot!`);
    }
  } catch (error) {
    console.error('Error handling drop:', error);
    alert('❌ Error placing card. Please try again.');
  }
};

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragStart = (e, userCard) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      cardId: userCard.cardId,
      cardData: userCard.cardData,
      userCardId: userCard.id
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const currentPageData = albumPages[currentPage];

  const nextPage = () => {
    if (currentPage < albumPages.length - 1 && !isAnimating) {
      setIsAnimating(true);

      const albumPage = document.querySelector('.album-page');
      const container = document.querySelector('.album-container');

      if (albumPage && container) {
        container.classList.add('animating');
        albumPage.classList.add('flipping-next');

        setTimeout(() => {
          setCurrentPage(currentPage + 1);
        }, 200);

        setTimeout(() => {
          albumPage.classList.remove('flipping-next');
          container.classList.remove('animating');
          setIsAnimating(false);
        }, 400);
      } else {
        setIsAnimating(false);
      }
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isAnimating) {
      setIsAnimating(true);

      const albumPage = document.querySelector('.album-page');
      const container = document.querySelector('.album-container');

      if (albumPage && container) {
        container.classList.add('animating');
        albumPage.classList.add('flipping-prev');

        setTimeout(() => {
          setCurrentPage(currentPage - 1);
        }, 200);

        setTimeout(() => {
          albumPage.classList.remove('flipping-prev');
          container.classList.remove('animating');
          setIsAnimating(false);
        }, 400);
      } else {
        setIsAnimating(false);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner type="pack" message="🎁 Opening Your Album..." size="large" />;
  }

  return (
    <div className="album-container">
      <div className="album-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>Team Album</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {calculateCompletionPercentage()}% Complete
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {calculateFilledSlots()} of {calculateTotalSlots()} cards
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#e9ecef',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '10px'
        }}>
          <div style={{
            width: `${calculateCompletionPercentage()}%`,
            height: '100%',
            backgroundColor: calculateCompletionPercentage() === 100 ? '#28a745' : '#007bff',
            transition: 'width 0.5s ease',
            borderRadius: '10px'
          }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>Page {currentPage + 1} of {albumPages.length}</p>
          {currentPageData.slots && currentPageData.slots.length > 0 && (
            <p style={{ 
              color: 'white',
              fontWeight: 'bold'
            }}>
              This page: {calculatePageCompletion(currentPageData.id)}% 
              ({currentPageData.slots.filter(slot => placedCards[`${currentPageData.id}-${slot.name}`]).length}/{currentPageData.slots.length})
            </p>
          )}
        </div>
      </div>

      <div 
        className={`album-page ${currentPageData.backgroundImage ? 'album-page-with-background' : ''}`}
        style={{
          backgroundImage: currentPageData.backgroundImage ? `url(${currentPageData.backgroundImage})` : 'none'
        }}
      >
        {!currentPageData.backgroundImage && <h3>{currentPageData.title}</h3>}

        {currentPageData.type === "cover" && !currentPageData.backgroundImage && (
          <div className="cover-page">
            <h1>RECALLS TEAM</h1>
            <h2>DIGITAL ALBUM</h2>
            <p>Collect all team members!</p>
          </div>
        )}

        {currentPageData.type === "closing" && !currentPageData.backgroundImage && (
          <div className="closing-page">
            <h2>Congratulations!</h2>
            <p>You've completed the album!</p>
          </div>
        )}

        {(currentPageData.type === "team" || currentPageData.type === "special") && currentPageData.slots && (
          <div className="positioned-slots">
            {currentPageData.slots.map((slot, index) => {
              const slotKey = `${currentPageData.id}-${slot.name}`;
              const placedCard = placedCards[slotKey];

              return (
                <div 
                  key={index} 
                  className="positioned-card-slot"
                  style={{
                    position: 'absolute',
                    top: `${slot.position.top}px`,
                    left: `${slot.position.left}px`,
                    width: `${slot.position.width}px`,
                    height: `${slot.position.height}px`
                  }}
                  onDrop={(e) => handleDrop(e, slot.name, currentPageData.id)}
                  onDragOver={handleDragOver}
                >
                  {placedCard ? (
                    <div className="placed-card-with-image">
                      {(() => {
                        const cardImageUrl = getCardImageUrl(placedCard.cardData.name);
                        console.log('Rendering card in album:', placedCard.cardData.name, 'URL:', cardImageUrl);

                        return cardImageUrl ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <img 
                              src={cardImageUrl} 
                              alt={placedCard.cardData.name}
                              style={getCardImageStyle(placedCard.cardData.name, 'album')}
                              onError={(e) => {
                                console.log('Image failed to load for:', placedCard.cardData.name, 'URL:', cardImageUrl);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully for:', placedCard.cardData.name);
                              }}
                            />
                            <div style={{
                              display: 'none',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(145deg, #e8f5e8, #d4edda)',
                              border: '2px solid #28a745',
                              borderRadius: '8px',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              color: '#155724',
                              position: 'relative'
                            }}>
                              <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>
                                {placedCard.cardData.name}
                              </h4>
                              <p style={{ margin: '2px 0', fontSize: '0.8em' }}>
                                {placedCard.cardData.team}
                              </p>
                              <p style={{ margin: '2px 0', fontSize: '0.7em', fontWeight: 'bold' }}>
                                {placedCard.cardData.rarity}
                              </p>
                            </div>
                            <div className="placed-indicator">✅</div>
                          </div>
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(145deg, #e8f5e8, #d4edda)',
                            border: '2px solid #28a745',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#155724',
                            position: 'relative'
                          }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>
                              {placedCard.cardData.name}
                            </h4>
                            <p style={{ margin: '2px 0', fontSize: '0.8em' }}>
                              {placedCard.cardData.team}
                            </p>
                            <p style={{ margin: '2px 0', fontSize: '0.7em', fontWeight: 'bold' }}>
                              {placedCard.cardData.rarity}
                            </p>
                            <div className="placed-indicator">✅</div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="invisible-drop-zone">
                      {/* Invisible drop zone - shows on hover */}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="album-navigation">
        <button onClick={prevPage} disabled={currentPage === 0 || isAnimating}>
          ← Previous
        </button>
        <span>{currentPage + 1} / {albumPages.length}</span>
        <button onClick={nextPage} disabled={currentPage === albumPages.length - 1 || isAnimating}>
          Next →
        </button>
      </div>

      {/* Collection Section at Bottom */}
      <div className="collection-section">
        <h3>📚 Your Collection - Drag cards to album slots above</h3>
        <p style={{ 
          color: '#666', 
          fontSize: '14px', 
          marginBottom: '15px',
          fontStyle: 'italic'
        }}>
          💡 Tip: Cards with duplicates show a 🗑️ button to delete extras you don't want to trade
        </p>

        {loading ? (
          <LoadingSpinner type="pack" message="🎁 Loading your collection..." size="medium" />
        ) : userCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#666', fontSize: '16px' }}>
              No cards collected yet. Go to "Open Packs" to start collecting!
            </p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '10px 20px', 
                background: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              🔄 Refresh Data
            </button>
          </div>
        ) : (
          <div className="collection-grid">
            {userCards.map((userCard) => {
              const cardImageUrl = getCardImageUrl(userCard.cardData.name);
              console.log('Rendering card in collection:', userCard.cardData.name, 'URL:', cardImageUrl);

              return (
                <div
                  key={userCard.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, userCard)}
                  className="collection-card"
                  style={{
                    position: 'relative',
                    cursor: 'grab',
                    transition: 'all 0.3s ease',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    padding: '0'
                  }}
                >
                  {userCard.count > 1 && (
                    <div className="card-count">{userCard.count}</div>
                  )}
                  <div className="drag-label">DRAG ME</div>

                  {/* Delete button for duplicate cards */}
                  {userCard.count > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent drag from starting
                        deleteCard(userCard.id, userCard.cardData.name, userCard.count);
                      }}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        left: '5px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '25px',
                        height: '25px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#c82333';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#dc3545';
                        e.target.style.transform = 'scale(1)';
                      }}
                      title={`Delete one copy of ${userCard.cardData.name}`}
                    >
                      🗑️
                    </button>
                  )}

                  {cardImageUrl ? (
                    <img 
                      src={cardImageUrl} 
                      alt={userCard.cardData.name}
                      style={{
                        ...getCardImageStyle(userCard.cardData.name, 'collection'),
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                      onError={(e) => {
                        console.log('Collection image failed to load for:', userCard.cardData.name, 'URL:', cardImageUrl);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      onLoad={() => {
                        console.log('Collection image loaded successfully for:', userCard.cardData.name);
                      }}
                    />
                  ) : null}

                  <div style={{
                    aspectRatio: '241/305',
                    background: '#007bff',
                    display: cardImageUrl ? 'none' : 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    padding: '15px'
                  }}>
                    <h4>{userCard.cardData.name}</h4>
                    <p>{userCard.cardData.team}</p>
                    <p className="card-rarity">{userCard.cardData.rarity}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Album;