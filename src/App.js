import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import PackOpening from './components/PackOpening';
import Album from './Album';
import TradingPost from './TradingPost';
import LoadingSpinner from './components/LoadingSpinner';
import { NotificationProvider, NotificationBell } from './components/NotificationSystem';
import { TradeHistoryDashboard } from './components/TradeHistoryDashboard';
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

  // New admin states for user management
  const [showUserDetails, setShowUserDetails] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPacks, setNewUserPacks] = useState(3);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToModify, setUserToModify] = useState(null);
  const [modifyPacks, setModifyPacks] = useState(0);
  const [adminView, setAdminView] = useState('grant'); // 'grant', 'manage', or 'analytics'

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  // New admin functions for user management
  const addNewUser = async () => {
    if (!newUserEmail.trim()) {
      alert('Please enter a valid email address.');
      return;
    }

    if (allUsers.find(user => user.email === newUserEmail)) {
      alert('User with this email already exists.');
      return;
    }

    setAdminLoading(true);
    try {
      // Create a new user document
      const newUserId = `user_${Date.now()}`;
      await setDoc(doc(db, 'users', newUserId), {
        email: newUserEmail,
        packs: parseInt(newUserPacks),
        createdAt: new Date(),
        addedBy: 'admin'
      });

      alert(`✅ User ${newUserEmail} added successfully with ${newUserPacks} packs!`);
      setNewUserEmail('');
      setNewUserPacks(3);
      setShowAddUser(false);
      await loadAllUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      alert('❌ Error adding user. Please try again.');
    }
    setAdminLoading(false);
  };

  const deleteUser = async (userId, userEmail) => {
    const confirmText = prompt(
      `⚠️ WARNING: This will permanently delete ${userEmail} and ALL their data including:\n\n` +
      `• User account\n• Card collection\n• Album progress\n• Trading history\n\n` +
      `This action CANNOT be undone!\n\nType "DELETE" to confirm:`
    );

    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled.');
      return;
    }

    setAdminLoading(true);
    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));

      // Delete user's collection
      const userCollectionQuery = query(
        collection(db, 'userCollections'),
        where('userId', '==', userId)
      );
      const collectionSnapshot = await getDocs(userCollectionQuery);
      const deleteCollectionPromises = collectionSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteCollectionPromises);

      // Delete user's album progress
      try {
        const albumDocRef = doc(db, 'userAlbums', userId);
        await deleteDoc(albumDocRef);
      } catch (error) {
        // Album document might not exist, that's okay
      }

      // Delete user's trades
      const tradesQuery = query(
        collection(db, 'trades'),
        where('userId', '==', userId)
      );
      const tradesSnapshot = await getDocs(tradesQuery);
      const deleteTradesPromises = tradesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteTradesPromises);

      alert(`✅ User ${userEmail} and all their data has been permanently deleted.`);
      await loadAllUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Error deleting user. Please try again.');
    }
    setAdminLoading(false);
    setUserToDelete(null);
  };

  const modifyUserPacks = async (userId, userEmail, newPackCount) => {
    if (newPackCount < 0) {
      alert('Pack count cannot be negative.');
      return;
    }

    setAdminLoading(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { packs: parseInt(newPackCount) });

      alert(`✅ Updated ${userEmail}'s packs to ${newPackCount}`);
      setUserToModify(null);
      setModifyPacks(0);
      await loadAllUsers();
    } catch (error) {
      console.error('Error modifying user packs:', error);
      alert('❌ Error updating user. Please try again.');
    }
    setAdminLoading(false);
  };

  const resetUserProgress = async (userId, userEmail) => {
    const confirmReset = window.confirm(
      `⚠️ This will reset ALL progress for ${userEmail}:\n\n` +
      `• Delete all collected cards\n• Clear album progress\n• Cancel active trades\n\n` +
      `User will keep their pack count.\n\nContinue?`
    );

    if (!confirmReset) return;

    setAdminLoading(true);
    try {
      // Delete user's collection
      const userCollectionQuery = query(
        collection(db, 'userCollections'),
        where('userId', '==', userId)
      );
      const collectionSnapshot = await getDocs(userCollectionQuery);
      const deleteCollectionPromises = collectionSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteCollectionPromises);

      // Clear album progress
      const albumDocRef = doc(db, 'userAlbums', userId);
      await setDoc(albumDocRef, { placedCards: {} });

      // Delete user's trades
      const tradesQuery = query(
        collection(db, 'trades'),
        where('userId', '==', userId)
      );
      const tradesSnapshot = await getDocs(tradesQuery);
      const deleteTradesPromises = tradesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteTradesPromises);

      alert(`✅ Reset all progress for ${userEmail}. They can start fresh!`);
      await loadAllUsers();
    } catch (error) {
      console.error('Error resetting user progress:', error);
      alert('❌ Error resetting user progress. Please try again.');
    }
    setAdminLoading(false);
  };

  const getUserStats = async (userId) => {
    try {
      // Get user's collection count
      const userCollectionQuery = query(
        collection(db, 'userCollections'),
        where('userId', '==', userId)
      );
      const collectionSnapshot = await getDocs(userCollectionQuery);
      const totalCards = collectionSnapshot.docs.reduce((sum, doc) => sum + (doc.data().count || 1), 0);

      // Get user's album progress
      const albumDocRef = doc(db, 'userAlbums', userId);
      const albumDoc = await getDoc(albumDocRef);
      const placedCards = albumDoc.exists() ? Object.keys(albumDoc.data().placedCards || {}).length : 0;

      return { totalCards, placedCards, uniqueCards: collectionSnapshot.docs.length };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { totalCards: 0, placedCards: 0, uniqueCards: 0 };
    }
  };

  // Analytics functions
  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all user collections
      const collectionsSnapshot = await getDocs(collection(db, 'userCollections'));
      const collections = collectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all user albums
      const albumsSnapshot = await getDocs(collection(db, 'userAlbums'));
      const albums = albumsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate analytics
      const analytics = calculateAnalytics(users, collections, albums);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Error loading analytics data.');
    }
    setAnalyticsLoading(false);
  };

  const calculateAnalytics = (users, collections, albums) => {
    // Define total possible cards (from your album structure)
    const totalPossibleCards = 67; // Total unique cards in your album
    const totalSlots = 67; // Total album slots

    // Basic stats
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      const userCollections = collections.filter(c => c.userId === user.id);
      return userCollections.length > 0;
    }).length;

    // Calculate total cards collected
    const totalCardsCollected = collections.reduce((sum, collection) => {
      return sum + (collection.count || 1);
    }, 0);

    // Calculate unique cards collected across all users
    const uniqueCardsCollected = new Set(collections.map(c => c.cardData?.name)).size;

    // Calculate completion rates
    const userCompletionRates = users.map(user => {
      const userAlbum = albums.find(a => a.id === user.id);
      const placedCards = userAlbum ? Object.keys(userAlbum.placedCards || {}).length : 0;
      const completionRate = totalSlots > 0 ? (placedCards / totalSlots) * 100 : 0;

      const userCollections = collections.filter(c => c.userId === user.id);
      const totalUserCards = userCollections.reduce((sum, c) => sum + (c.count || 1), 0);

      return {
        userId: user.id,
        email: user.email,
        placedCards,
        completionRate: Math.round(completionRate),
        totalCards: totalUserCards,
        uniqueCards: userCollections.length,
        packs: user.packs || 0
      };
    });

    // Top performers
    const topCollectors = [...userCompletionRates]
      .sort((a, b) => b.totalCards - a.totalCards)
      .slice(0, 10);

    const topCompleters = [...userCompletionRates]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10);

    // Card popularity analysis
    const cardPopularity = {};
    collections.forEach(collection => {
      const cardName = collection.cardData?.name;
      if (cardName) {
        if (!cardPopularity[cardName]) {
          cardPopularity[cardName] = {
            name: cardName,
            team: collection.cardData?.team || 'Unknown',
            rarity: collection.cardData?.rarity || 'Unknown',
            collectedBy: 0,
            totalCopies: 0
          };
        }
        cardPopularity[cardName].collectedBy += 1;
        cardPopularity[cardName].totalCopies += (collection.count || 1);
      }
    });

    const cardStats = Object.values(cardPopularity);
    const mostCollected = [...cardStats].sort((a, b) => b.collectedBy - a.collectedBy).slice(0, 10);
    const leastCollected = [...cardStats].sort((a, b) => a.collectedBy - b.collectedBy).slice(0, 10);

    // Team/Department analysis
    const teamStats = {};
    cardStats.forEach(card => {
      if (!teamStats[card.team]) {
        teamStats[card.team] = {
          team: card.team,
          totalCards: 0,
          collectedCards: 0,
          completionRate: 0
        };
      }
      teamStats[card.team].totalCards += 1;
      if (card.collectedBy > 0) {
        teamStats[card.team].collectedCards += 1;
      }
    });

    Object.values(teamStats).forEach(team => {
      team.completionRate = team.totalCards > 0 ? 
        Math.round((team.collectedCards / team.totalCards) * 100) : 0;
    });

    // Rarity analysis
    const rarityStats = {};
    cardStats.forEach(card => {
      if (!rarityStats[card.rarity]) {
        rarityStats[card.rarity] = {
          rarity: card.rarity,
          totalCards: 0,
          averageCollected: 0,
          totalCollections: 0
        };
      }
      rarityStats[card.rarity].totalCards += 1;
      rarityStats[card.rarity].totalCollections += card.collectedBy;
    });

    Object.values(rarityStats).forEach(rarity => {
      rarity.averageCollected = rarity.totalCards > 0 ? 
        Math.round(rarity.totalCollections / rarity.totalCards) : 0;
    });

    // Overall completion rate
    const overallCompletionRate = userCompletionRates.length > 0 ?
      Math.round(userCompletionRates.reduce((sum, user) => sum + user.completionRate, 0) / userCompletionRates.length) : 0;

    // Pack statistics
    const totalPacksRemaining = users.reduce((sum, user) => sum + (user.packs || 0), 0);
    const averagePacksPerUser = totalUsers > 0 ? Math.round(totalPacksRemaining / totalUsers) : 0;

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalCardsCollected,
        uniqueCardsCollected,
        totalPossibleCards,
        overallCompletionRate,
        totalPacksRemaining,
        averagePacksPerUser
      },
      leaderboards: {
        topCollectors,
        topCompleters
      },
      cards: {
        mostCollected,
        leastCollected,
        cardStats
      },
      teams: Object.values(teamStats),
      rarity: Object.values(rarityStats),
      users: userCompletionRates
    };
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return '#3CAC3B'; // Average Green
    if (percentage >= 60) return '#ffc107'; // Yellow
    if (percentage >= 40) return '#fd7e14'; // Orange
    return '#E61D25'; // Torch Red
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

const handlePackOpened = async (quantity = 1) => {
  const newPackCount = Math.max(0, userPacks - quantity);
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#474A4A' }}>
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
  <NotificationProvider>
    <div className="App">
      <header style={{ padding: '20px', backgroundColor: '#474A4A', borderBottom: '2px solid #2A398D' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', margin: 0 }}>🏆 Recalls Team Album</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: 'white', fontWeight: 'bold' }}>Welcome, {user.email}!</span>
            <span style={{ backgroundColor: '#3CAC3B', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
              {userPacks} packs
            </span>
            <NotificationBell />
            <button 
              onClick={handleLogout}
              style={{ padding: '8px 16px', backgroundColor: '#E61D25', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav style={{ backgroundColor: '#D1D4D1', padding: '10px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px', paddingLeft: '20px' }}>
          <button
            onClick={() => setActiveTab('packs')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'packs' ? '#2A398D' : 'transparent',
              color: activeTab === 'packs' ? 'white' : '#2A398D',
              border: '2px solid #2A398D',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🎁 Open Packs
          </button>
          <button
            onClick={() => setActiveTab('album')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'album' ? '#2A398D' : 'transparent',
              color: activeTab === 'album' ? 'white' : '#2A398D',
              border: '2px solid #2A398D',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📖 Album
          </button>
          <button
            onClick={() => setActiveTab('trading')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'trading' ? '#2A398D' : 'transparent',
              color: activeTab === 'trading' ? 'white' : '#2A398D',
              border: '2px solid #2A398D',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Trading Post
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'history' ? '#2A398D' : 'transparent',
              color: activeTab === 'history' ? 'white' : '#2A398D',
              border: '2px solid #2A398D',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📊 Trade History
          </button>

          {user && adminEmails.includes(user.email) && (
            <button
              onClick={openAdminPanel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3CAC3B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              ⚙️ Admin Panel
            </button>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 140px)' }}>
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

        {activeTab === 'history' && (
          <TradeHistoryDashboard />
        )}
      </main>

      {/* Enhanced Admin Panel Modal */}
      {showAdminPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(71,74,74,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '900px',
            width: '95%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '3px solid #2A398D'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#2A398D', margin: 0 }}>⚙️ Admin Panel</h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                style={{
                  backgroundColor: '#E61D25',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Admin Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => setAdminView('grant')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: adminView === 'grant' ? '#2A398D' : '#D1D4D1',
                  color: adminView === 'grant' ? 'white' : '#2A398D',
                  border: '2px solid #2A398D',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🎁 Grant Packs
              </button>
              <button
                onClick={() => setAdminView('manage')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: adminView === 'manage' ? '#2A398D' : '#D1D4D1',
                  color: adminView === 'manage' ? 'white' : '#2A398D',
                  border: '2px solid #2A398D',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                👥 Manage Users
              </button>
              <button
                onClick={() => {
                  setAdminView('analytics');
                  if (!analyticsData) {
                    loadAnalyticsData();
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: adminView === 'analytics' ? '#2A398D' : '#D1D4D1',
                  color: adminView === 'analytics' ? 'white' : '#2A398D',
                  border: '2px solid #2A398D',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📊 Analytics
              </button>
            </div>

            {/* Grant Packs View */}
            {adminView === 'grant' && (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#D1D4D1', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#474A4A' }}>Packs to grant:</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={packsToGrant}
                      onChange={(e) => setPacksToGrant(e.target.value)}
                      style={{
                        padding: '8px',
                        border: '2px solid #2A398D',
                        borderRadius: '4px',
                        width: '80px'
                      }}
                    />
                    <button
                      onClick={grantPacksToSelected}
                      disabled={adminLoading || selectedUsers.length === 0}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: selectedUsers.length > 0 ? '#3CAC3B' : '#474A4A',
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
              </>
            )}

            {/* Manage Users View */}
            {adminView === 'manage' && (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#D1D4D1', borderRadius: '8px' }}>
                  <button
                    onClick={() => setShowAddUser(true)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3CAC3B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ➕ Add New User
                  </button>
                </div>
              </>
            )}

            {/* Analytics View */}
            {adminView === 'analytics' && (
              <>
                {analyticsLoading ? (
                  <LoadingSpinner type="dots" message="📊 Loading analytics..." size="medium" />
                ) : analyticsData ? (
                  <div>
                    {/* Overview Stats */}
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ marginBottom: '20px', color: '#2A398D' }}>📈 Overview Statistics</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ padding: '20px', backgroundColor: '#D1D4D1', borderRadius: '8px', textAlign: 'center', border: '2px solid #2A398D' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2A398D' }}>
                            {analyticsData.overview.totalUsers}
                          </div>
                          <div style={{ fontSize: '14px', color: '#474A4A', fontWeight: 'bold' }}>Total Users</div>
                        </div>
                        <div style={{ padding: '20px', backgroundColor: '#D1D4D1', borderRadius: '8px', textAlign: 'center', border: '2px solid #3CAC3B' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3CAC3B' }}>
                            {analyticsData.overview.activeUsers}
                          </div>
                          <div style={{ fontSize: '14px', color: '#474A4A', fontWeight: 'bold' }}>Active Users</div>
                        </div>
                        <div style={{ padding: '20px', backgroundColor: '#D1D4D1', borderRadius: '8px', textAlign: 'center', border: '2px solid #ffc107' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                            {analyticsData.overview.totalCardsCollected}
                          </div>
                          <div style={{ fontSize: '14px', color: '#474A4A', fontWeight: 'bold' }}>Total Cards Collected</div>
                        </div>
                        <div style={{ padding: '20px', backgroundColor: '#D1D4D1', borderRadius: '8px', textAlign: 'center', border: `2px solid ${getCompletionColor(analyticsData.overview.overallCompletionRate)}` }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: getCompletionColor(analyticsData.overview.overallCompletionRate) }}>
                            {analyticsData.overview.overallCompletionRate}%
                          </div>
                          <div style={{ fontSize: '14px', color: '#474A4A', fontWeight: 'bold' }}>Average Completion</div>
                        </div>
                      </div>
                    </div>

                    {/* Leaderboards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                      {/* Top Collectors */}
                      <div>
                        <h3 style={{ marginBottom: '15px', color: '#2A398D' }}>🏆 Top Collectors</h3>
                        <div style={{ backgroundColor: '#D1D4D1', borderRadius: '8px', padding: '15px', border: '2px solid #2A398D' }}>
                          {analyticsData.leaderboards.topCollectors.slice(0, 5).map((user, index) => (
                            <div key={user.userId} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '8px 0',
                              borderBottom: index < 4 ? '1px solid #474A4A' : 'none'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ 
                                  backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#2A398D',
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
                                  {index + 1}
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{user.email}</span>
                              </div>
                              <span style={{ fontWeight: 'bold', color: '#3CAC3B' }}>{user.totalCards} cards</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Completers */}
                      <div>
                        <h3 style={{ marginBottom: '15px', color: '#2A398D' }}>🎯 Top Completers</h3>
                        <div style={{ backgroundColor: '#D1D4D1', borderRadius: '8px', padding: '15px', border: '2px solid #2A398D' }}>
                          {analyticsData.leaderboards.topCompleters.slice(0, 5).map((user, index) => (
                            <div key={user.userId} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '8px 0',
                              borderBottom: index < 4 ? '1px solid #474A4A' : 'none'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ 
                                  backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#2A398D',
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
                                  {index + 1}
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{user.email}</span>
                              </div>
                              <span style={{ fontWeight: 'bold', color: getCompletionColor(user.completionRate) }}>
                                {user.completionRate}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Analytics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                      {/* Most Collected Cards */}
                      <div>
                        <h3 style={{ marginBottom: '15px', color: '#2A398D' }}>⭐ Most Collected Cards</h3>
                        <div style={{ backgroundColor: '#D1D4D1', borderRadius: '8px', padding: '15px', maxHeight: '300px', overflowY: 'auto', border: '2px solid #2A398D' }}>
                          {analyticsData.cards.mostCollected.slice(0, 10).map((card, index) => (
                            <div key={card.name} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '8px 0',
                              borderBottom: index < 9 ? '1px solid #474A4A' : 'none'
                            }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{card.name}</div>
                                <div style={{ fontSize: '12px', color: '#474A4A' }}>{card.team} • {card.rarity}</div>
                              </div>
                              <span style={{ fontWeight: 'bold', color: '#3CAC3B' }}>{card.collectedBy} users</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Least Collected Cards */}
                      <div>
                        <h3 style={{ marginBottom: '15px', color: '#2A398D' }}>🔍 Least Collected Cards</h3>
                        <div style={{ backgroundColor: '#D1D4D1', borderRadius: '8px', padding: '15px', maxHeight: '300px', overflowY: 'auto', border: '2px solid #2A398D' }}>
                          {analyticsData.cards.leastCollected.slice(0, 10).map((card, index) => (
                            <div key={card.name} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '8px 0',
                              borderBottom: index < 9 ? '1px solid #474A4A' : 'none'
                            }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{card.name}</div>
                                <div style={{ fontSize: '12px', color: '#474A4A' }}>{card.team} • {card.rarity}</div>
                              </div>
                              <span style={{ fontWeight: 'bold', color: '#E61D25' }}>{card.collectedBy} users</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Team Performance */}
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ marginBottom: '15px', color: '#2A398D' }}>🏢 Team Performance</h3>
                      <div style={{ backgroundColor: '#D1D4D1', borderRadius: '8px', padding: '20px', border: '2px solid #2A398D' }}>
                        {analyticsData.teams.map((team, index) => (
                          <div key={team.team} style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                              <span style={{ fontWeight: 'bold', color: '#474A4A' }}>{team.team}</span>
                              <span style={{ color: getCompletionColor(team.completionRate), fontWeight: 'bold' }}>
                                {team.completionRate}% ({team.collectedCards}/{team.totalCards})
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '8px',
                              backgroundColor: '#474A4A',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${team.completionRate}%`,
                                height: '100%',
                                backgroundColor: getCompletionColor(team.completionRate),
                                transition: 'width 0.3s ease'
                              }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Refresh Button */}
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <button
                        onClick={loadAnalyticsData}
                        disabled={analyticsLoading}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#2A398D',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {analyticsLoading ? '⏳ Refreshing...' : '🔄 Refresh Analytics'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <button
                      onClick={loadAnalyticsData}
                      style={{
                        padding: '15px 30px',
                        backgroundColor: '#2A398D',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      📊 Load Analytics Dashboard
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Search and User List - Only show for grant and manage views */}
            {(adminView === 'grant' || adminView === 'manage') && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search users by email..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #2A398D',
                      borderRadius: '6px',
                      fontSize: '16px',
                      marginBottom: '10px'
                    }}
                  />
                  {adminView === 'grant' && (
                    <button
                      onClick={handleSelectAll}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2A398D',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {selectedUsers.length === filteredUsers.length ? '☑️ Deselect All' : '☐ Select All'}
                    </button>
                  )}
                  <span style={{ marginLeft: '15px', color: '#474A4A', fontWeight: 'bold' }}>
                    Showing {filteredUsers.length} of {allUsers.length} users
                  </span>
                </div>

                {adminLoading ? (
                  <LoadingSpinner type="dots" message="⏳ Loading users..." size="medium" />
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto', border: '2px solid #2A398D', borderRadius: '6px' }}>
                    {filteredUsers.map((userData) => (
                      <div
                        key={userData.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 15px',
                          borderBottom: '1px solid #D1D4D1',
                          backgroundColor: selectedUsers.includes(userData.id) ? '#e3f2fd' : 'white'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {adminView === 'grant' && (
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(userData.id)}
                              onChange={(e) => handleUserSelection(userData.id, e.target.checked)}
                              style={{ transform: 'scale(1.2)' }}
                            />
                          )}
                          <div>
                            <strong style={{ color: '#474A4A' }}>{userData.email}</strong>
                            <div style={{ fontSize: '12px', color: '#474A4A' }}>
                              Joined: {userData.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            backgroundColor: '#3CAC3B',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {userData.packs || 0} packs
                          </span>
                          {adminView === 'manage' && (
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button
                                onClick={() => {
                                  setUserToModify(userData);
                                  setModifyPacks(userData.packs || 0);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#2A398D',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => resetUserProgress(userData.id, userData.email)}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#ffc107',
                                  color: 'black',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                🔄 Reset
                              </button>
                              <button
                                onClick={() => deleteUser(userData.id, userData.email)}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#E61D25',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(71,74,74,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '500px',
            width: '90%',
            border: '3px solid #2A398D'
          }}>
            <h3 style={{ color: '#2A398D' }}>➕ Add New User</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#474A4A' }}>
                Email Address:
              </label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@amazon.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #2A398D',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#474A4A' }}>
                Starting Packs:
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={newUserPacks}
                onChange={(e) => setNewUserPacks(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #2A398D',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addNewUser}
                disabled={adminLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#3CAC3B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {adminLoading ? '⏳ Adding...' : '✅ Add User'}
              </button>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setNewUserEmail('');
                  setNewUserPacks(3);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#474A4A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify User Modal */}
      {userToModify && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(71,74,74,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '500px',
            width: '90%',
            border: '3px solid #2A398D'
          }}>
            <h3 style={{ color: '#2A398D' }}>✏️ Modify User: {userToModify.email}</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#474A4A' }}>
                Pack Count:
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={modifyPacks}
                onChange={(e) => setModifyPacks(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #2A398D',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => modifyUserPacks(userToModify.id, userToModify.email, modifyPacks)}
                disabled={adminLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2A398D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {adminLoading ? '⏳ Updating...' : '✅ Update'}
              </button>
              <button
                onClick={() => {
                  setUserToModify(null);
                  setModifyPacks(0);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#474A4A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </NotificationProvider>
);
}
export default App;