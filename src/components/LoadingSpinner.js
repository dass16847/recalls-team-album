import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  type = 'cards', 
  message = 'Loading...', 
  size = 'medium',
  color = '#007bff' 
}) => {
  const renderAnimation = () => {
    switch (type) {
      case 'cards':
        return (
          <div className={`card-flip-container ${size}`}>
            <div className="card-flip card-1"></div>
            <div className="card-flip card-2"></div>
            <div className="card-flip card-3"></div>
          </div>
        );

      case 'album':
        return (
          <div className={`album-loading ${size}`}>
            <div className="album-book">
              <div className="album-page page-1"></div>
              <div className="album-page page-2"></div>
              <div className="album-page page-3"></div>
            </div>
          </div>
        );

      case 'pack':
        return (
          <div className={`pack-spinner ${size}`}>
            <div className="pack-container">
              <div className="pack-front"></div>
              <div className="pack-back"></div>
            </div>
          </div>
        );

      case 'dots':
        return (
          <div className={`dots-loading ${size}`}>
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
          </div>
        );

      default:
        return (
          <div className={`spinner ${size}`} style={{ borderTopColor: color }}>
          </div>
        );
    }
  };

    return (
    <div className={`loading-container ${size}`}>
        {renderAnimation()}
        {message && (
        <div className="loading-message">
            {message}
        </div>
        )}
    </div>
    );
};

export default LoadingSpinner;