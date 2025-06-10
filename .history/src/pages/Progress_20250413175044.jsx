import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { API_URL } from '../config';

const Progress = () => {
  const [timeData, setTimeData] = useState({
    start_date: null,
    total_days: 0,
    total_hours: 0,
    monthly_hours: [],
    weekly_hours: [],
    heatmap_data: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimeData();
  }, []);

  const fetchTimeData = async () => {
    try {
      setLoading(true);
      console.log('Fetching from:', `${API_URL}/time_logs/stats.php`);
      
      const response = await fetch(`${API_URL}/time_logs/stats.php`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('Raw response:', text.substring(0, 500));
      
      try {
        const data = JSON.parse(text);
        console.log('Parsed data:', data);
        
        if (data.success) {
          setTimeData(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch time logs data');
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Invalid JSON response from server');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date string to a readable format
  const formatDate = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      return dateStr;
    }
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>Progress Tracker</h1>
      
      {/* Debug Info */}
      <div style={{
        border: '1px solid #fbbf24',
        backgroundColor: '#fffbeb',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{fontWeight: 'bold', marginBottom: '10px'}}>Debug Information</h3>
        <p>API URL: {API_URL}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Data received: {timeData ? 'Yes' : 'No'}</p>
        <div style={{marginTop: '10px'}}>
          <p>Monthly entries: {timeData.monthly_hours?.length || 0}</p>
          <p>Weekly entries: {timeData.weekly_hours?.length || 0}</p>
          <p>Heatmap entries: {timeData.heatmap_data?.length || 0}</p>
        </div>
      </div>
      
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#b91c1c',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p>Loading progress data...</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            OJT Progress Summary
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '15px',
            marginBottom: '30px'
          }}>
            <div style={{
              padding: '15px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #dbeafe'
            }}>
              <h3 style={{fontWeight: 'bold', fontSize: '16px', color: '#1e40af', marginBottom: '5px'}}>Total Days</h3>
              <p style={{fontSize: '28px', fontWeight: 'bold', color: '#2563eb'}}>{timeData.total_days}</p>
              <p style={{fontSize: '14px', color: '#64748b'}}>Since {formatDate(timeData.start_date)}</p>
            </div>
            
            <div style={{
              padding: '15px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #dcfce7'
            }}>
              <h3 style={{fontWeight: 'bold', fontSize: '16px', color: '#166534', marginBottom: '5px'}}>Total Hours</h3>
              <p style={{fontSize: '28px', fontWeight: 'bold', color: '#16a34a'}}>{timeData.total_hours?.toFixed(1)}</p>
              <p style={{fontSize: '14px', color: '#64748b'}}>Of required {timeData.required_hours}</p>
            </div>
            
            <div style={{
              padding: '15px',
              backgroundColor: '#eef2ff',
              borderRadius: '8px',
              border: '1px solid #e0e7ff'
            }}>
              <h3 style={{fontWeight: 'bold', fontSize: '16px', color: '#3730a3', marginBottom: '5px'}}>Completion</h3>
              <p style={{fontSize: '28px', fontWeight: 'bold', color: '#4f46e5'}}>{timeData.progress_percentage?.toFixed(1)}%</p>
              <p style={{fontSize: '14px', color: '#64748b'}}>{(timeData.required_hours - timeData.total_hours)?.toFixed(1)} hours remaining</p>
            </div>
          </div>
          
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '15px',
            marginTop: '20px'
          }}>
            Month-by-Month Breakdown
          </h3>
          
          <div style={{marginBottom: '30px'}}>
            {timeData.monthly_hours && timeData.monthly_hours.length > 0 ? (
              <div>
                {timeData.monthly_hours.map((month, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    marginBottom: '8px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '100px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '4px 0 0 4px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {month.year}-{month.month}
                    </div>
                    <div style={{
                      flex: 1,
                      backgroundColor: '#dbeafe',
                      padding: '8px 12px',
                      borderRadius: '0 4px 4px 0'
                    }}>
                      <span style={{fontWeight: 'bold'}}>{month.monthly_hours?.toFixed(1)} hours</span>
                      <span style={{margin: '0 5px'}}>•</span>
                      <span>{month.days_logged} days</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No monthly data available</p>
            )}
          </div>
          
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            Weekly Hours
          </h3>
          
          <div>
            {timeData.weekly_hours && timeData.weekly_hours.length > 0 ? (
              <div>
                {timeData.weekly_hours.slice(0, 8).map((week, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    marginBottom: '8px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '100px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '4px 0 0 4px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      Week {week.week}
                    </div>
                    <div style={{
                      flex: 1,
                      backgroundColor: '#dcfce7',
                      padding: '8px 12px',
                      borderRadius: '0 4px 4px 0'
                    }}>
                      <span style={{fontWeight: 'bold'}}>{week.weekly_hours?.toFixed(1)} hours</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No weekly data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress; 