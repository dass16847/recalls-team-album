import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #E6F9F5 25%, #F5F0FF 50%, #E6F9F5 75%, #F0F4FF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '450px', 
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(97,0,233,0.2)',
        border: '4px solid #64FEDA'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '35px' 
        }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '15px',
            filter: 'drop-shadow(0 4px 8px rgba(97,0,233,0.2))'
          }}>🏆</div>
          <h2 style={{ 
            color: '#1A1A2E',
            fontSize: '2.2rem',
            margin: '0 0 8px 0',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
          }}>Recalls Team Album</h2>
          <p style={{ 
            color: '#4A4A6A',
            fontSize: '16px',
            margin: 0,
            fontWeight: 'bold'
          }}>Collect, Trade & Complete Your Album</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              color: '#1A1A2E',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '15px', 
                fontSize: '16px',
                border: '3px solid #B288FD',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #F0F4FF 0%, #ffffff 100%)',
                color: '#1A1A2E',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6100E9';
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(97,0,233,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#B288FD';
                e.target.style.backgroundColor = '#F0F4FF';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              color: '#1A1A2E',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '15px', 
                fontSize: '16px',
                border: '3px solid #B288FD',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #F0F4FF 0%, #ffffff 100%)',
                color: '#1A1A2E',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6100E9';
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(97,0,233,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#B288FD';
                e.target.style.backgroundColor = '#F0F4FF';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '18px', 
              fontSize: '18px', 
              backgroundColor: isLoading ? '#8888AA' : '#6100E9',
              color: 'white', 
              border: 'none', 
              borderRadius: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 16px rgba(97,0,233,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#304FFF';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(97,0,233,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#6100E9';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 16px rgba(97,0,233,0.2)';
              }
            }}
          >
            {isLoading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid #E6F9F5',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </div>
            ) : (
              <>
                {isSignUp ? '🎉 Create Account' : '🚀 Sign In'}
              </>
            )}
          </button>
        </form>

        {/* Toggle Sign Up/Login */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '25px',
          padding: '20px',
          background: 'linear-gradient(135deg, #F0F4FF 0%, #E6F9F5 100%)',
          borderRadius: '12px',
          border: '2px solid #B288FD'
        }}>
          <p style={{ 
            color: '#1A1A2E',
            fontSize: '16px',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={{ 
              background: 'transparent',
              border: '2px solid #64FEDA', 
              color: '#1A1A2E',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#64FEDA';
              e.target.style.color = '#1A1A2E';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(100,254,218,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#1A1A2E';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {isSignUp ? '← Back to Login' : '✨ Create New Account'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(255,61,0,0.1)',
            border: '2px solid #FF3D00',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '24px',
              marginBottom: '8px'
            }}>⚠️</div>
            <p style={{ 
              color: '#FF3D00',
              fontSize: '16px',
              margin: 0,
              fontWeight: 'bold'
            }}>
              {error}
            </p>
          </div>
        )}

        {/* Info Section */}
        <div style={{ 
          marginTop: '30px',
          textAlign: 'center',
          padding: '20px',
          backgroundColor: 'rgba(175,234,0,0.1)',
          borderRadius: '12px',
          border: '2px solid #AFEA00'
        }}>
          <div style={{ 
            fontSize: '32px',
            marginBottom: '10px'
          }}>🎴</div>
          <p style={{ 
            color: '#1A1A2E',
            fontSize: '14px',
            margin: 0,
            fontWeight: 'bold',
            lineHeight: '1.5'
          }}>
            Join the Recalls Team Album experience!<br />
            Collect cards, trade with colleagues, and complete your album.
          </p>
        </div>
      </div>

      {/* Add CSS animation for loading spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Login;