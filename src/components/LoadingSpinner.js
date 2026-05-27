import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  type = 'cards', 
  message = 'Loading...', 
  size = 'medium',
  color = '#2A398D' // Changed default to FIFA Hermes Blue
}) => {
  const renderAnimation = () => {
    switch (type) {
      case 'cards':
        return (
          <div className={`card-flip-container ${size}`} style={{
            '--primary-color': '#2A398D',
            '--secondary-color': '#3CAC3B',
            '--accent-color': '#E61D25'
          }}>
            <div className="card-flip card-1" style={{
              backgroundColor: '#2A398D',
              border: '2px solid #474A4A',
              borderRadius: '8px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: size === 'large' ? '24px' : size === 'medium' ? '18px' : '14px',
                fontWeight: 'bold'
              }}>🎴</div>
            </div>
            <div className="card-flip card-2" style={{
              backgroundColor: '#3CAC3B',
              border: '2px solid #474A4A',
              borderRadius: '8px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: size === 'large' ? '24px' : size === 'medium' ? '18px' : '14px',
                fontWeight: 'bold'
              }}>🎴</div>
            </div>
            <div className="card-flip card-3" style={{
              backgroundColor: '#E61D25',
              border: '2px solid #474A4A',
              borderRadius: '8px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: size === 'large' ? '24px' : size === 'medium' ? '18px' : '14px',
                fontWeight: 'bold'
              }}>🎴</div>
            </div>
          </div>
        );

      case 'album':
        return (
          <div className={`album-loading ${size}`}>
            <div className="album-book" style={{
              backgroundColor: '#474A4A',
              border: '3px solid #2A398D',
              borderRadius: '8px',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <div className="album-page page-1" style={{
                backgroundColor: '#D1D4D1',
                border: '1px solid #2A398D'
              }}></div>
              <div className="album-page page-2" style={{
                backgroundColor: '#D1D4D1',
                border: '1px solid #3CAC3B'
              }}></div>
              <div className="album-page page-3" style={{
                backgroundColor: '#D1D4D1',
                border: '1px solid #E61D25'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: size === 'large' ? '32px' : size === 'medium' ? '24px' : '18px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}>📖</div>
            </div>
          </div>
        );

      case 'pack':
        return (
          <div className={`pack-spinner ${size}`}>
            <div className="pack-container" style={{
              position: 'relative'
            }}>
              <div className="pack-front" style={{
                backgroundColor: '#2A398D',
                border: '3px solid #474A4A',
                borderRadius: '12px',
                position: 'relative',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: size === 'large' ? '48px' : size === 'medium' ? '36px' : '24px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}>🎁</div>
              </div>
              <div className="pack-back" style={{
                backgroundColor: '#3CAC3B',
                border: '3px solid #474A4A',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}></div>
            </div>
          </div>
        );

      case 'dots':
        return (
          <div className={`dots-loading ${size}`} style={{
            display: 'flex',
            gap: size === 'large' ? '12px' : size === 'medium' ? '8px' : '6px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div className="dot dot-1" style={{
              width: size === 'large' ? '16px' : size === 'medium' ? '12px' : '8px',
              height: size === 'large' ? '16px' : size === 'medium' ? '12px' : '8px',
              backgroundColor: '#2A398D',
              borderRadius: '50%',
              animation: 'dotPulse 1.4s ease-in-out infinite both',
              animationDelay: '0s'
            }}></div>
            <div className="dot dot-2" style={{
              width: size === 'large' ? '16px' : size === 'medium' ? '12px' : '8px',
              height: size === 'large' ? '16px' : size === 'medium' ? '12px' : '8px',
              backgroundColor: '#3CAC3B',
              borderRadius: '50%',
              animation: 'dotPulse 1.4s ease-in-out infinite both',
              animationDelay: '0.2s'
            }}></div>
            <div className="dot dot-3" style={{
              width: size === 'large' ? '16px' : size === 'medium' ? '12px' : '8px',
              height: size === 'large' ? '16px' : size === 'medium' ? '12px' : '8px',
              backgroundColor: '#E61D25',
              borderRadius: '50%',
              animation: 'dotPulse 1.4s ease-in-out infinite both',
              animationDelay: '0.4s'
            }}></div>
          </div>
        );

      default:
        return (
          <div 
            className={`spinner ${size}`} 
            style={{ 
              width: size === 'large' ? '60px' : size === 'medium' ? '40px' : '24px',
              height: size === 'large' ? '60px' : size === 'medium' ? '40px' : '24px',
              border: `${size === 'large' ? '6px' : size === 'medium' ? '4px' : '3px'} solid #D1D4D1`,
              borderTop: `${size === 'large' ? '6px' : size === 'medium' ? '4px' : '3px'} solid ${color}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          >
          </div>
        );
    }
  };

  return (
    <div className={`loading-container ${size}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: size === 'large' ? '40px' : size === 'medium' ? '30px' : '20px',
      backgroundColor: 'rgba(71, 74, 74, 0.1)',
      borderRadius: '15px',
      border: '2px solid #D1D4D1',
      minHeight: size === 'large' ? '200px' : size === 'medium' ? '150px' : '100px'
    }}>
      {renderAnimation()}
      {message && (
        <div className="loading-message" style={{
          marginTop: size === 'large' ? '25px' : size === 'medium' ? '20px' : '15px',
          fontSize: size === 'large' ? '18px' : size === 'medium' ? '16px' : '14px',
          fontWeight: 'bold',
          color: '#474A4A',
          textAlign: 'center',
          textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
        }}>
          {message}
        </div>
      )}

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes dotPulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes cardFlip {
          0%, 100% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(180deg);
          }
        }

        @keyframes pageFlip {
          0%, 100% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(-15deg);
          }
        }

        @keyframes packBounce {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
        }

        .card-flip {
          animation: cardFlip 2s ease-in-out infinite;
        }

        .card-1 {
          animation-delay: 0s;
        }

        .card-2 {
          animation-delay: 0.3s;
        }

        .card-3 {
          animation-delay: 0.6s;
        }

        .album-page {
          animation: pageFlip 2.5s ease-in-out infinite;
        }

        .page-1 {
          animation-delay: 0s;
        }

        .page-2 {
          animation-delay: 0.4s;
        }

        .page-3 {
          animation-delay: 0.8s;
        }

        .pack-container {
          animation: packBounce 1.5s ease-in-out infinite;
        }

        .card-flip-container {
          display: flex;
          gap: ${size === 'large' ? '15px' : size === 'medium' ? '10px' : '8px'};
        }

        .card-flip {
          width: ${size === 'large' ? '60px' : size === 'medium' ? '40px' : '30px'};
          height: ${size === 'large' ? '80px' : size === 'medium' ? '60px' : '45px'};
        }

        .album-book {
          width: ${size === 'large' ? '80px' : size === 'medium' ? '60px' : '45px'};
          height: ${size === 'large' ? '60px' : size === 'medium' ? '45px' : '35px'};
        }

        .album-page {
          position: absolute;
          width: 90%;
          height: 90%;
          top: 5%;
          left: 5%;
          border-radius: 4px;
        }

        .pack-container {
          width: ${size === 'large' ? '70px' : size === 'medium' ? '50px' : '40px'};
          height: ${size === 'large' ? '90px' : size === 'medium' ? '70px' : '55px'};
          position: relative;
        }

        .pack-front, .pack-back {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .pack-back {
          transform: translateZ(-10px);
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;