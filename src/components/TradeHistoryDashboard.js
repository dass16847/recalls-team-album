import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './TradeHistoryDashboard.css';

export const TradeHistoryDashboard = () => {
  // State for managing trade history data
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalTrades: 0,
    successfulTrades: 0,
    pendingTrades: 0,
    cancelledTrades: 0,
    successRate: 0
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load trade history when component mounts
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      // Query for trades where user is either sender or receiver
      const tradesQuery = query(
        collection(db, 'trades'),
        where('participants', 'array-contains', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        tradesQuery, 
        (snapshot) => {
          const tradeData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));

          setTrades(tradeData);
          setFilteredTrades(tradeData);
          calculateStatistics(tradeData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.log('No trades collection yet or permission denied:', error);
          // This is normal - trades collection doesn't exist yet
          setTrades([]);
          setFilteredTrades([]);
          calculateStatistics([]);
          setLoading(false);
          setError(null);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up trades listener:', error);
      setTrades([]);
      setFilteredTrades([]);
      calculateStatistics([]);
      setLoading(false);
      setError(null);
    }
  }, []);

  // Calculate trade statistics
  const calculateStatistics = (tradeData) => {
    const total = tradeData.length;
    const successful = tradeData.filter(trade => trade.status === 'completed').length;
    const pending = tradeData.filter(trade => trade.status === 'pending').length;
    const cancelled = tradeData.filter(trade => trade.status === 'cancelled').length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    setStatistics({
      totalTrades: total,
      successfulTrades: successful,
      pendingTrades: pending,
      cancelledTrades: cancelled,
      successRate: successRate
    });
  };

  // Filter trades based on selected criteria
  useEffect(() => {
    let filtered = [...trades];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          filterDate = null;
      }

      if (filterDate) {
        filtered = filtered.filter(trade => trade.createdAt >= filterDate);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.senderCards?.some(card => card.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        trade.receiverCards?.some(card => card.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredTrades(filtered);
  }, [trades, statusFilter, dateFilter, searchTerm]);

  // Export trade data to CSV
  const exportToCSV = () => {
    if (filteredTrades.length === 0) {
      alert('No trades to export!');
      return;
    }

    try {
      const csvData = filteredTrades.map(trade => ({
        Date: trade.createdAt.toLocaleDateString(),
        Status: trade.status,
        'Trading Partner': trade.senderId === auth.currentUser.uid ? trade.receiverName : trade.senderName,
        'Cards Given': trade.senderId === auth.currentUser.uid ? 
          trade.senderCards?.map(card => card.name).join(', ') || 'None' : 
          trade.receiverCards?.map(card => card.name).join(', ') || 'None',
        'Cards Received': trade.senderId === auth.currentUser.uid ? 
          trade.receiverCards?.map(card => card.name).join(', ') || 'None' : 
          trade.senderCards?.map(card => card.name).join(', ') || 'None'
      }));

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trade-history.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="trade-history-loading">
        <div className="loading-spinner"></div>
        <p>Loading trade history...</p>
      </div>
    );
  }

  return (
    <div className="trade-history-dashboard">
      <div className="dashboard-header">
        <h2>Trade History & Statistics</h2>
        <button 
          className="export-btn" 
          onClick={exportToCSV}
          disabled={filteredTrades.length === 0}
          style={{ 
            opacity: filteredTrades.length === 0 ? 0.5 : 1,
            cursor: filteredTrades.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          📊 Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="statistics-grid">
        <div className="stat-card total">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{statistics.totalTrades}</h3>
            <p>Total Trades</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{statistics.successfulTrades}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{statistics.pendingTrades}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card rate">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{statistics.successRate}%</h3>
            <p>Success Rate</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Time Period:</label>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search trades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Trade History List */}
      <div className="trade-history-list">
        {filteredTrades.length === 0 ? (
          <div className="no-trades">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
              <h3>No Trade History Yet</h3>
              <p>Your completed trades will appear here once you start trading with other users.</p>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
                💡 Tip: Visit the Trading Post to start making trades!
              </p>
            </div>
          </div>
        ) : (
          filteredTrades.map(trade => (
            <div key={trade.id} className={`trade-item ${trade.status}`}>
              <div className="trade-header">
                <div className="trade-status">
                  <span className={`status-badge ${trade.status}`}>
                    {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                  </span>
                </div>
                <div className="trade-date">
                  {trade.createdAt.toLocaleDateString()}
                </div>
              </div>

              <div className="trade-details">
                <div className="trade-partner">
                  <strong>Trading with:</strong> {
                    trade.senderId === auth.currentUser.uid ? trade.receiverName : trade.senderName
                  }
                </div>

                <div className="trade-cards">
                  <div className="cards-section">
                    <h4>You gave:</h4>
                    <div className="card-list">
                      {(trade.senderId === auth.currentUser.uid ? trade.senderCards : trade.receiverCards)?.map((card, index) => (
                        <span key={index} className="card-name">{card.name}</span>
                      )) || <span className="card-name">No cards</span>}
                    </div>
                  </div>

                  <div className="cards-section">
                    <h4>You received:</h4>
                    <div className="card-list">
                      {(trade.senderId === auth.currentUser.uid ? trade.receiverCards : trade.senderCards)?.map((card, index) => (
                        <span key={index} className="card-name">{card.name}</span>
                      )) || <span className="card-name">No cards</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};