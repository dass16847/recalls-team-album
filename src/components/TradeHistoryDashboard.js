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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        background: 'linear-gradient(135deg, #F0F4FF 0%, #E6F9F5 100%)',
        borderRadius: '15px',
        border: '3px solid #6100E9',
        margin: '20px',
        color: '#1A1A2E'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #E6F9F5',
          borderTop: '4px solid #64FEDA',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Loading trade history...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #F0F4FF 0%, #E6F9F5 50%, #F5F0FF 100%)', 
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        background: 'linear-gradient(135deg, #6100E9 0%, #304FFF 50%, #64FEDA 100%)',
        padding: '25px',
        borderRadius: '15px',
        border: '3px solid #AFEA00'
      }}>
        <h2 style={{ 
          color: 'white', 
          margin: 0,
          fontSize: '2.2rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>📊 Trade History & Statistics</h2>
        <button 
          onClick={exportToCSV}
          disabled={filteredTrades.length === 0}
          style={{ 
            padding: '12px 24px',
            backgroundColor: filteredTrades.length === 0 ? '#8888AA' : '#AFEA00',
            color: filteredTrades.length === 0 ? 'white' : '#1A1A2E',
            border: 'none',
            borderRadius: '8px',
            cursor: filteredTrades.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => {
            if (filteredTrades.length > 0) {
              e.target.style.backgroundColor = '#00CA55';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (filteredTrades.length > 0) {
              e.target.style.backgroundColor = '#AFEA00';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          📊 Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #F0F4FF 100%)',
          padding: '25px',
          borderRadius: '12px',
          border: '3px solid #6100E9',
          boxShadow: '0 6px 16px rgba(97,0,233,0.1)',
          textAlign: 'center',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(97,0,233,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(97,0,233,0.1)';
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📈</div>
          <h3 style={{ 
            fontSize: '2rem', 
            margin: '0 0 8px 0', 
            color: '#1A1A2E',
            fontWeight: 'bold'
          }}>{statistics.totalTrades}</h3>
          <p style={{ 
            margin: 0, 
            color: '#4A4A6A', 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>Total Trades</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #F0F4FF 100%)',
          padding: '25px',
          borderRadius: '12px',
          border: '3px solid #AFEA00',
          boxShadow: '0 6px 16px rgba(175,234,0,0.1)',
          textAlign: 'center',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(175,234,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(175,234,0,0.1)';
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✅</div>
          <h3 style={{ 
            fontSize: '2rem', 
            margin: '0 0 8px 0', 
            color: '#1A1A2E',
            fontWeight: 'bold'
          }}>{statistics.successfulTrades}</h3>
          <p style={{ 
            margin: 0, 
            color: '#4A4A6A', 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>Completed</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #F0F4FF 100%)',
          padding: '25px',
          borderRadius: '12px',
          border: '3px solid #B288FD',
          boxShadow: '0 6px 16px rgba(178,136,253,0.1)',
          textAlign: 'center',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(178,136,253,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(178,136,253,0.1)';
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⏳</div>
          <h3 style={{ 
            fontSize: '2rem', 
            margin: '0 0 8px 0', 
            color: '#1A1A2E',
            fontWeight: 'bold'
          }}>{statistics.pendingTrades}</h3>
          <p style={{ 
            margin: 0, 
            color: '#4A4A6A', 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>Pending</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #F0F4FF 100%)',
          padding: '25px',
          borderRadius: '12px',
          border: '3px solid #64FEDA',
          boxShadow: '0 6px 16px rgba(100,254,218,0.1)',
          textAlign: 'center',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(100,254,218,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(100,254,218,0.1)';
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎯</div>
          <h3 style={{ 
            fontSize: '2rem', 
            margin: '0 0 8px 0', 
            color: '#1A1A2E',
            fontWeight: 'bold'
          }}>{statistics.successRate}%</h3>
          <p style={{ 
            margin: 0, 
            color: '#4A4A6A', 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>Success Rate</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #F0F4FF 100%)',
        padding: '25px',
        borderRadius: '15px',
        border: '3px solid #6100E9',
        marginBottom: '30px',
        boxShadow: '0 6px 16px rgba(97,0,233,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#1A1A2E',
              fontSize: '16px'
            }}>Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #6100E9',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#1A1A2E',
                fontWeight: 'bold'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#1A1A2E',
              fontSize: '16px'
            }}>Time Period:</label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #6100E9',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#1A1A2E',
                fontWeight: 'bold'
              }}
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#1A1A2E',
              fontSize: '16px'
            }}>Search:</label>
            <input
              type="text"
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #6100E9',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#1A1A2E'
              }}
            />
          </div>
        </div>
      </div>

      {/* Trade History List */}
      <div>
        {filteredTrades.length === 0 ? (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #F0F4FF 100%)',
            padding: '60px 40px',
            borderRadius: '15px',
            border: '3px solid #E6F9F5',
            textAlign: 'center',
            boxShadow: '0 6px 16px rgba(97,0,233,0.08)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📊</div>
            <h3 style={{ 
              color: '#1A1A2E', 
              fontSize: '1.8rem',
              marginBottom: '15px'
            }}>No Trade History Yet</h3>
            <p style={{ 
              color: '#4A4A6A', 
              fontSize: '16px',
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>Your completed trades will appear here once you start trading with other users.</p>
            <p style={{ 
              color: '#4A4A6A', 
              fontSize: '14px', 
              marginTop: '20px',
              fontStyle: 'italic',
              background: 'rgba(100, 254, 218, 0.1)',
              padding: '15px',
              borderRadius: '10px',
              border: '1px solid #64FEDA'
            }}>
              💡 Tip: Visit the Trading Post to start making trades!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredTrades.map(trade => {
              const getStatusColor = (status) => {
                switch(status) {
                  case 'completed': return '#AFEA00';
                  case 'pending': return '#B288FD';
                  case 'cancelled': return '#FF3D00';
                  default: return '#4A4A6A';
                }
              };

              return (
                <div key={trade.id} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #F0F4FF 100%)',
                  borderRadius: '12px',
                  border: `3px solid ${getStatusColor(trade.status)}`,
                  boxShadow: '0 6px 16px rgba(97,0,233,0.1)',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(97,0,233,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(97,0,233,0.1)';
                }}>
                  {/* Trade Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 25px',
                    background: 'rgba(97, 0, 233, 0.05)',
                    borderBottom: `2px solid ${getStatusColor(trade.status)}`
                  }}>
                    <span style={{
                      backgroundColor: getStatusColor(trade.status),
                      color: trade.status === 'completed' ? '#1A1A2E' : 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                    </span>
                    <div style={{
                      color: '#4A4A6A',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      {trade.createdAt.toLocaleDateString()}
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div style={{ padding: '25px' }}>
                    <div style={{ 
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      <strong style={{ 
                        color: '#1A1A2E',
                        fontSize: '18px'
                      }}>Trading with: </strong>
                      <span style={{ 
                        color: '#6100E9',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        {trade.senderId === auth.currentUser.uid ? trade.receiverName : trade.senderName}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '25px'
                    }}>
                      {/* Cards Given */}
                      <div style={{
                        background: 'rgba(255, 61, 0, 0.05)',
                        padding: '20px',
                        borderRadius: '10px',
                        border: '2px solid #FF3D00'
                      }}>
                        <h4 style={{ 
                          margin: '0 0 15px 0',
                          color: '#FF3D00',
                          fontSize: '16px',
                          textAlign: 'center'
                        }}>You gave:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(trade.senderId === auth.currentUser.uid ? trade.senderCards : trade.receiverCards)?.map((card, index) => (
                            <span key={index} style={{
                              backgroundColor: 'white',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #FF3D00',
                              color: '#1A1A2E',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}>{card.name}</span>
                          )) || <span style={{
                            backgroundColor: 'white',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #FF3D00',
                            color: '#4A4A6A',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            fontStyle: 'italic'
                          }}>No cards</span>}
                        </div>
                      </div>

                      {/* Cards Received */}
                      <div style={{
                        background: 'rgba(175, 234, 0, 0.05)',
                        padding: '20px',
                        borderRadius: '10px',
                        border: '2px solid #AFEA00'
                      }}>
                        <h4 style={{ 
                          margin: '0 0 15px 0',
                          color: '#AFEA00',
                          fontSize: '16px',
                          textAlign: 'center'
                        }}>You received:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(trade.senderId === auth.currentUser.uid ? trade.receiverCards : trade.senderCards)?.map((card, index) => (
                            <span key={index} style={{
                              backgroundColor: 'white',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #AFEA00',
                              color: '#1A1A2E',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}>{card.name}</span>
                          )) || <span style={{
                            backgroundColor: 'white',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #AFEA00',
                            color: '#4A4A6A',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            fontStyle: 'italic'
                          }}>No cards</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
};