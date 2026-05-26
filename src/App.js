import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import PackOpening from './components/PackOpening';
import Album from './Album';
import TradingPost from './TradingPost';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function App() {
  // Define admin users (add your email and other admin emails here)
  const adminEmails = [
    'sotosade@amazon.com',
    'vindai@amazon.com',
    'bolanari@amazon.com',
    'mccerdas@amazon.com',
    'iregonza@amazon.com',
    'rafajaso@amazon.com',
  ];

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPacks, setUserPacks] = useState(0);
  const [activeTab, setActiveTab] = useState('packs');

  // Admin panel states
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [packsToGrant, setPacksToGrant] = useState(1);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserData(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setUserPacks(userDoc.data().packs || 0);
      } else {
        // Create new user document with 3 starter packs
        await setDoc(userDocRef, {
          email: auth.currentUser.email,
          packs: 3,
          createdAt: new Date()
        });
        setUserPacks(3);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadAllUsers = async () => {
    setAdminLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users. Please try again.');
    }
    setAdminLoading(false);
  };

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    if (searchValue.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user => 
        user.email.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleUserSelection = (userId, isSelected) => {
    if (isSelected) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const grantPacksToSelected = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to grant packs to.');
      return;
    }

    if (packsToGrant < 1) {
      alert('Please enter a valid number of packs to grant.');
      return;
    }

    const confirmMessage = `Are you sure you want to grant ${packsToGrant} pack(s) to ${selectedUsers.length} user(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setAdminLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const userId of selectedUsers) {
        try {
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const currentPacks = userDoc.data().packs || 0;
            await updateDoc(userDocRef, { 
              packs: currentPacks + parseInt(packsToGrant) 
            });
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error granting packs to user ${userId}:`, error);
          errorCount++;
        }
      }

      alert(`✅ Successfully granted ${packsToGrant} pack(s) to ${successCount} user(s)!${errorCount > 0 ? ` ${errorCount} failed.` : ''}`);

      setSelectedUsers([]);
      setPacksToGrant(1);
      await loadAllUsers();

    } catch (error) {
      console.error('Error in bulk pack granting:', error);
      alert('❌ Error granting packs. Please try again.');
    }

    setAdminLoading(false);
  };

  const handleLogin = () => {
    // Login handler
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserPacks(0);
      setShowAdminPanel(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handlePackOpened = async () => {
    const newPackCount = Math.max(0, userPacks - 1);
    setUserPacks(newPackCount);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { packs: newPackCount });
    } catch (error) {
      console.error('Error updating pack count:', error);
    }
  };

  const openAdminPanel = async () => {
    setShowAdminPanel(true);
    await loadAllUsers();
  };

  // MAIN LOADING STATE - When app is starting up
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner type="pack" message="🏆 Loading Recalls Team Album..." size="large" />
      </div>
    );
  }

  // LOGIN STATE
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // MAIN APP
  return (
    <div className="App">
      <header style={{ padding: '20px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <h1>🏆 Recalls Team Album</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Welcome, {user.email}!</span>
            <span style={{ backgroundColor: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '14px' }}>
              {userPacks} packs
            </span>
            <button 
              onClick={handleLogout}
              style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav style={{ backgroundColor: '#e9ecef', padding: '10px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px', paddingLeft: '20px' }}>
          <button
            onClick={() => setActiveTab('packs')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'packs' ? '#007bff' : 'transparent',
              color: activeTab === 'packs' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🎁 Open Packs
          </button>
          <button
            onClick={() => setActiveTab('album')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'album' ? '#007bff' : 'transparent',
              color: activeTab === 'album' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📖 Album
          </button>
          <button
            onClick={() => setActiveTab('trading')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'trading' ? '#007bff' : 'transparent',
              color: activeTab === 'trading' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Trading Post
          </button>

          {user && adminEmails.includes(user.email) && (
            <button
              onClick={openAdminPanel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ⚙️ Admin Panel
            </button>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {activeTab === 'packs' && (
          <PackOpening 
            userPacks={userPacks} 
            onPackOpened={handlePackOpened}
          />
        )}

        {activeTab === 'album' && (
          <Album />
        )}

        {activeTab === 'trading' && (
          <TradingPost />
        )}
      </main>

      {/* Admin Panel Modal */}
      {showAdminPanel && (
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
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>⚙️ Admin Panel - Grant Packs</h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold' }}>Packs to grant:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={packsToGrant}
                  onChange={(e) => setPacksToGrant(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '80px'
                  }}
                />
                <button
                  onClick={grantPacksToSelected}
                  disabled={adminLoading || selectedUsers.length === 0}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: selectedUsers.length > 0 ? '#28a745' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: selectedUsers.length > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold'
                  }}
                >
                  {adminLoading ? '⏳ Granting...' : `🎁 Grant to ${selectedUsers.length} user(s)`}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="🔍 Search users by email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  marginBottom: '10px'
                }}
              />
              <button
                onClick={handleSelectAll}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {selectedUsers.length === filteredUsers.length ? '☑️ Deselect All' : '☐ Select All'}
              </button>
              <span style={{ marginLeft: '15px', color: '#666' }}>
                Showing {filteredUsers.length} of {allUsers.length} users
              </span>
            </div>

            {adminLoading ? (
              <LoadingSpinner type="dots" message="⏳ Loading users..." size="medium" />
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '6px' }}>
                {filteredUsers.map((userData) => (
                  <div
                    key={userData.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 15px',
                      borderBottom: '1px solid #eee',
                      backgroundColor: selectedUsers.includes(userData.id) ? '#e3f2fd' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(userData.id)}
                        onChange={(e) => handleUserSelection(userData.id, e.target.checked)}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <div>
                        <strong>{userData.email}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Joined: {userData.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {userData.packs || 0} packs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;