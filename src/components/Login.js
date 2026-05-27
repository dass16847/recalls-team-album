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
      background: 'linear-gradient(135deg, #474A4A 0%, #2A398D 50%, #474A4A 100%)',
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
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '4px solid #3CAC3B'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '35px' 
        }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '15px',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
          }}>🏆</div>
          <h2 style={{ 
            color: '#2A398D',
            fontSize: '2.2rem',
            margin: '0 0 8px 0',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>Recalls Team Album</h2>
          <p style={{ 
            color: '#474A4A',
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
              color: '#474A4A',
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
                border: '3px solid #D1D4D1',
                borderRadius: '10px',
                backgroundColor: '#f8f9fa',
                color: '#474A4A',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2A398D';
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(42,57,141,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#D1D4D1';
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              color: '#474A4A',
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
                border: '3px solid #D1D4D1',
                borderRadius: '10px',
                backgroundColor: '#f8f9fa',
                color: '#474A4A',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2A398D';
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(42,57,141,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#D1D4D1';
                e.target.style.backgroundColor = '#f8f9fa';
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
              backgroundColor: isLoading ? '#474A4A' : '#2A398D',
              color: 'white', 
              border: 'none', 
              borderRadius: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#1e2a6b';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#2A398D';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
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
                  border: '3px solid #D1D4D1',
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
          backgroundColor: '#D1D4D1',
          borderRadius: '12px',
          border: '2px solid #474A4A'
        }}>
          <p style={{ 
            color: '#474A4A',
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
              border: '2px solid #3CAC3B', 
              color: '#3CAC3B',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#3CAC3B';
              e.target.style.color = 'white';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#3CAC3B';
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
            backgroundColor: 'rgba(230,29,37,0.1)',
            border: '2px solid #E61D25',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '24px',
              marginBottom: '8px'
            }}>⚠️</div>
            <p style={{ 
              color: '#E61D25',
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
          backgroundColor: 'rgba(60,172,59,0.1)',
          borderRadius: '12px',
          border: '2px solid #3CAC3B'
        }}>
          <div style={{ 
            fontSize: '32px',
            marginBottom: '10px'
          }}>🎴</div>
          <p style={{ 
            color: '#474A4A',
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