import React, { useState, useEffect } from 'react';
import './FlipbookView.css';
import { getCardImage } from './utils/cardImages';

const FlipbookView = ({ albumPages, placedCards, getCardImageUrl, getCardImageStyle }) => {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Create page spreads (pairs of pages) - Remove empty pages at the end
  const createSpreads = () => {
    const spreads = [];

    // First spread: cover + page 1
    spreads.push({
      leftPage: albumPages[0], // Cover
      rightPage: albumPages[1], // REPRIR
      spreadIndex: 0
    });

    // Remaining spreads: pairs of pages (skip empty pages)
    for (let i = 2; i < albumPages.length; i += 2) {
      const leftPage = albumPages[i];
      const rightPage = albumPages[i + 1];

      // Only add spread if both pages exist (no empty white pages)
      if (leftPage && rightPage) {
        spreads.push({
          leftPage: leftPage,
          rightPage: rightPage,
          spreadIndex: spreads.length
        });
      } else if (leftPage && !rightPage) {
        // If only left page exists, add it as a single page spread
        spreads.push({
          leftPage: leftPage,
          rightPage: null,
          spreadIndex: spreads.length
        });
      }
    }

    return spreads;
  };

  const spreads = createSpreads();

  const openBook = () => {
    setIsBookOpen(true);
  };

  const closeBook = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsBookOpen(false);
      setCurrentSpread(0);
      setIsClosing(false);
    }, 800);
  };

  const nextSpread = () => {
    if (currentSpread < spreads.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSpread(currentSpread + 1);
        setIsAnimating(false);
      }, 800);
    }
  };

  const prevSpread = () => {
    if (currentSpread > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSpread(currentSpread - 1);
        setIsAnimating(false);
      }, 800);
    }
  };

  const renderPage = (page, isLeft = true) => {
    if (!page) return null;

    return (
      <div className={`flipbook-page ${isLeft ? 'left-page' : 'right-page'}`}>
        <div 
          className="page-content"
          style={{
            backgroundImage: page.backgroundImage ? `url(${page.backgroundImage})` : 'none'
          }}
        >
          {!page.backgroundImage && (
            <div className="page-title">
              <h2>{page.title}</h2>
            </div>
          )}

          {/* Render placed cards */}
          {page.slots && (
            <div className="flipbook-positioned-slots">
              {page.slots.map((slot, index) => {
                const slotKey = `${page.id}-${slot.name}`;
                const placedCard = placedCards[slotKey];

                return (
                  <div
                    key={index}
                    className="flipbook-card-slot"
                    style={{
                      position: 'absolute',
                                           top: `${placedCard && placedCard.cardData.name === 'SJO 16 AFZ' ? 280 : (slot.position.top * 0.67) - 22}px`,
                      left: `${placedCard && placedCard.cardData.name === 'SJO 16 AFZ' ? 25 : (slot.position.left * 0.67) - 20}px`,
                      width: `${slot.position.width * 0.67}px`,
                      height: `${slot.position.height * 0.67}px`
                    }}
                  >
                    {placedCard && (
                      <div className="flipbook-placed-card">
                        {(() => {
                          const cardImageUrl = getCardImageUrl(placedCard.cardData.name);
                          return cardImageUrl ? (
                            <img 
                              src={cardImageUrl} 
                              alt={placedCard.cardData.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '4px',
                                objectFit: placedCard.cardData.name === 'SJO 16 AFZ' ? 'fit' : 'cover',
                                transform: placedCard.cardData.name === 'SJO 16 AFZ' ? 
                                  'rotate(90deg) scale(0.66, 1.7)' : 'none',
                                transformOrigin: 'center center'
                              }}
                            />
                          ) : (
                            <div className="flipbook-card-fallback">
                              <span>{placedCard.cardData.name}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Page number */}
          <div className="page-number">
            {page.id + 1}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flipbook-container">
      <div className="flipbook-header">
        <h2>📖 Flipbook View - REPRIR Team Album</h2>
        <div className="flipbook-progress">
          Spread {currentSpread + 1} of {spreads.length}
        </div>
      </div>

      <div className={`flipbook-wrapper ${isBookOpen ? 'book-open' : 'book-closed'} ${isClosing ? 'book-closing' : ''}`}>
        <div className="flipbook-book">
          {!isBookOpen ? (
            // Closed book cover
            <div className="book-cover" onClick={openBook}>
              <div 
                className="cover-front"
                style={{
                  backgroundImage: albumPages[0].backgroundImage ? `url(${albumPages[0].backgroundImage})` : 'none'
                }}
              >
                <div className="cover-overlay">
                  <div className="cover-title">
                    <h1>REPRIR TEAM</h1>
                    <h2>DIGITAL ALBUM</h2>
                    <p>Click to Open</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Open book spreads
            <div className={`book-spread ${isAnimating ? 'turning' : ''}`}>
              {renderPage(spreads[currentSpread]?.leftPage, true)}
              {spreads[currentSpread]?.rightPage && renderPage(spreads[currentSpread]?.rightPage, false)}
            </div>
          )}
        </div>
      </div>

      {isBookOpen && (
        <div className="flipbook-navigation">
          <button 
            onClick={prevSpread} 
            disabled={currentSpread === 0 || isAnimating}
            className="flipbook-nav-btn"
          >
            ← Previous
          </button>

          <button 
            onClick={closeBook}
            className="flipbook-nav-btn close-btn"
          >
            📖 Close Book
          </button>

          <button 
            onClick={nextSpread} 
            disabled={currentSpread === spreads.length - 1 || isAnimating}
            className="flipbook-nav-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default FlipbookView;