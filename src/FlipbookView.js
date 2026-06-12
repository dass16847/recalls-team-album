import React, { useState, useEffect } from 'react';
import './FlipbookView.css';
import { getCardImage } from './utils/cardImages';

const FlipbookView = ({ albumPages, placedCards, getCardImageUrl, getCardImageStyle }) => {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);

  // Create page spreads (pairs of pages)
  const createSpreads = () => {
    const spreads = [];

    // First spread: cover + page 1
    spreads.push({
      leftPage: albumPages[0], // Cover
      rightPage: albumPages[1], // REPRIR
      spreadIndex: 0
    });

    // Remaining spreads: pairs of pages
    for (let i = 2; i < albumPages.length; i += 2) {
      spreads.push({
        leftPage: albumPages[i],
        rightPage: albumPages[i + 1] || null, // Handle odd number of pages
        spreadIndex: spreads.length
      });
    }

    return spreads;
  };

  const spreads = createSpreads();

  const openBook = () => {
    setIsBookOpen(true);
  };

  const closeBook = () => {
    setIsBookOpen(false);
    setCurrentSpread(0);
  };

  const nextSpread = () => {
    if (currentSpread < spreads.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSpread(currentSpread + 1);
        setIsAnimating(false);
      }, 600);
    }
  };

  const prevSpread = () => {
    if (currentSpread > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSpread(currentSpread - 1);
        setIsAnimating(false);
      }, 600);
    }
  };

  const renderPage = (page, isLeft = true) => {
    if (!page) return <div className="flipbook-page empty-page"></div>;

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
                      top: `${slot.position.top * 0.4}px`, // Scale down for flipbook
                      left: `${slot.position.left * 0.4}px`,
                      width: `${slot.position.width * 0.4}px`,
                      height: `${slot.position.height * 0.4}px`
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
                                ...getCardImageStyle(placedCard.cardData.name, 'flipbook'),
                                width: '100%',
                                height: '100%',
                                borderRadius: '4px'
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

      <div className={`flipbook-wrapper ${isBookOpen ? 'book-open' : 'book-closed'}`}>
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
                <div className="cover-title">
                  <h1>REPRIR TEAM</h1>
                  <h2>DIGITAL ALBUM</h2>
                  <p>Click to Open</p>
                </div>
              </div>
            </div>
          ) : (
            // Open book spreads
            <div className={`book-spread ${isAnimating ? 'turning' : ''}`}>
              {renderPage(spreads[currentSpread]?.leftPage, true)}
              {renderPage(spreads[currentSpread]?.rightPage, false)}
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