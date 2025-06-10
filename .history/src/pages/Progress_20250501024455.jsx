import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { API_URL } from '../config';
import { FaLeaf } from 'react-icons/fa';

const Progress = () => {
  const [timeData, setTimeData] = useState({
    start_date: null,
    total_days: 0,
    total_hours: 0,
    required_hours: 500,
    progress_percentage: 0,
    daily_average: 0,
    weekly_hours: [],
    last_log_date: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimeData();
  }, []);

  const fetchTimeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/time_logs/stats.php`);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTimeData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch time logs data');
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
    if (!dateStr) return 'Not started';
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      return dateStr;
    }
  };

  // Format number to fixed decimal places
  const formatNumber = (num, decimals = 1) => {
    return typeof num === 'number' ? num.toFixed(decimals) : '0';
  };

  return (
    <div className="bg-[#EDEID2] p-6 min-h-screen">
      <h1 className="text-4xl font-bold text-[#412F26] flex items-center space-x-3">
        <FaLeaf className="text-[#6A6F4C]" />
        <span>Progress Tracker</span>
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-600">Loading progress data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
              <h3 className="text-sm font-medium text-[#806044]">Total Days</h3>
              <p className="text-3xl font-bold text-[#6A6F4C]">{timeData.total_days}</p>
              <p className="text-sm text-[#806044]">Since {formatDate(timeData.start_date)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
              <h3 className="text-sm font-medium text-[#806044]">Total Hours</h3>
              <p className="text-3xl font-bold text-[#6A6F4C]">{formatNumber(timeData.total_hours)}</p>
              <p className="text-sm text-[#806044]">Of required {timeData.required_hours}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
              <h3 className="text-sm font-medium text-[#806044]">Completion</h3>
              <p className="text-3xl font-bold text-[#6A6F4C]">{formatNumber(timeData.progress_percentage)}%</p>
              <p className="text-sm text-[#806044]">
                {formatNumber(timeData.required_hours - timeData.total_hours)} hours remaining
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-[#412F26] mb-6">Weekly Progress</h3>
            <div className="relative h-64">
              {timeData.weekly_hours && timeData.weekly_hours.length > 0 ? (
                <div className="flex items-end h-full space-x-4">
                  {timeData.weekly_hours.map((week, index) => {
                    const height = Math.min((week.weekly_hours / 40) * 100, 100);
                    return (
                      <div key={week.week} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-[#CBB89D] rounded-t transition-all duration-300"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-sm text-[#806044] mt-2">
                          {formatNumber(week.weekly_hours)}h
                        </span>
                        <span className="text-xs text-[#806044]">
                          Week {index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#806044]">No weekly data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-[#412F26] mb-4">Daily Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#806044]">Daily Average</p>
                <p className="text-2xl font-bold text-[#412F26]">
                  {formatNumber(timeData.daily_average)} hours
                </p>
              </div>
              <div>
                <p className="text-sm text-[#806044]">Last Log Date</p>
                <p className="text-2xl font-bold text-[#412F26]">
                  {formatDate(timeData.last_log_date)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;