import { useState, useEffect } from 'react';
import { format, parseISO, isValid, addBusinessDays } from 'date-fns';
import { FaClock, FaCalendarAlt, FaChartLine, FaCheckCircle } from 'react-icons/fa';
import { API_URL } from '../config';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_hours: 0,
    total_days: 0,
    required_hours: 500,
    progress_percentage: 0,
    daily_average: 0,
    weekly_hours: [],
    last_log_date: null,
    start_date: '2024-02-12'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch statistics
      const statsResponse = await fetch(`${API_URL}/time_logs/stats.php`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      } else {
        throw new Error(statsData.message);
      }

      // Fetch recent logs
      const logsResponse = await fetch(`${API_URL}/time_logs/index.php?limit=5`);
      const logsData = await logsResponse.json();

      if (logsData.success) {
        setRecentLogs(logsData.data.slice(0, 5));
      } else {
        throw new Error(logsData.message);
      }
    } catch (error) {
      setError('Failed to load dashboard data. ' + error.message);
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours) => {
    if (!hours) return '0';
    return parseFloat(hours).toFixed(1);
  };

  const calculateRemainingHours = () => {
    return Math.max(0, stats.required_hours - stats.total_hours);
  };

  const calculateEstimatedCompletionDays = () => {
    const remainingHours = calculateRemainingHours();
    
    // If no hours logged yet, use default 8 hours per day
    if (stats.daily_average === 0) {
      return Math.ceil(remainingHours / 8);
    }
    
    // Use actual daily average
    return Math.ceil(remainingHours / stats.daily_average);
  };
  
  const calculateEstimatedCompletionDate = () => {
    const daysNeeded = calculateEstimatedCompletionDays();
    if (daysNeeded <= 0) return 'Completed';
    
    // Add business days to today's date
    const today = new Date();
    const completionDate = addBusinessDays(today, daysNeeded);
    
    // Format date as "Month Day, Year" (e.g., "June 15, 2024")
    return format(completionDate, 'MMMM d, yyyy');
  };
  
  const calculateWeeklyHoursNeeded = () => {
    const remainingHours = calculateRemainingHours();
    if (remainingHours <= 0) return 0;
    
    // Calculate weeks remaining (assuming 5 working days per week)
    const daysNeeded = calculateEstimatedCompletionDays();
    const weeksNeeded = Math.ceil(daysNeeded / 5);
    
    // Hours needed per week
    return Math.ceil(remainingHours / weeksNeeded);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">OJT Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Hours Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">Total Hours</h2>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{formatHours(stats.total_hours)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    of {stats.required_hours} required hours
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FaClock className="text-blue-600 text-xl" />
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, stats.progress_percentage)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.progress_percentage.toFixed(1)}% complete
                </p>
              </div>
            </div>

            {/* Days Logged Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">Days Logged</h2>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.total_days}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    days of OJT recorded
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <FaCalendarAlt className="text-green-600 text-xl" />
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{formatHours(calculateRemainingHours())}</span> hours remaining
                </p>
                <p className="text-xs text-gray-500">
                  Average: {formatHours(stats.daily_average)} hours/day
                </p>
              </div>
            </div>

            {/* Weekly Hours Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">Weekly Summary</h2>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {stats.weekly_hours && stats.weekly_hours.length > 0 
                      ? formatHours(stats.weekly_hours[0]?.weekly_hours || 0) 
                      : '0'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    hours this week
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <FaChartLine className="text-purple-600 text-xl" />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Weekly Hours</span>
                  <span>Last 4 Weeks</span>
                </div>
                <div className="flex items-end h-16 mt-2 space-x-2">
                  {stats.weekly_hours && stats.weekly_hours.slice(0, 4).map((week, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-purple-200 rounded-t"
                        style={{ 
                          height: `${Math.min(100, (week.weekly_hours / 40) * 100)}%`,
                          minHeight: '4px'
                        }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{formatHours(week.weekly_hours)}</span>
                    </div>
                  ))}
                  {(!stats.weekly_hours || stats.weekly_hours.length === 0) && (
                    <p className="text-xs text-gray-500 w-full text-center">No weekly data yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Completion Estimate Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Completion Estimate</h2>
              <div className="bg-green-100 p-2 rounded-lg">
                <FaCheckCircle className="text-green-600 text-lg" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-r border-gray-200 pr-4">
                <h3 className="text-sm font-medium text-gray-500">Days Remaining</h3>
                <p className="text-2xl font-bold text-gray-700 mt-1">
                  {calculateEstimatedCompletionDays()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  working days until completion
                </p>
              </div>
              
              <div className="border-r border-gray-200 px-4">
                <h3 className="text-sm font-medium text-gray-500">Estimated Completion</h3>
                <p className="text-2xl font-bold text-gray-700 mt-1">
                  {calculateEstimatedCompletionDate()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  based on your current pace
                </p>
              </div>
              
              <div className="pl-4">
                <h3 className="text-sm font-medium text-gray-500">Weekly Goal</h3>
                <p className="text-2xl font-bold text-gray-700 mt-1">
                  {calculateWeeklyHoursNeeded()} hrs
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  hours needed per week to stay on track
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {stats.progress_percentage >= 100 ? (
                  <span className="text-green-600 font-medium">Congratulations! You've completed your required OJT hours.</span>
                ) : (
                  <>
                    You've completed <span className="font-medium">{stats.progress_percentage.toFixed(1)}%</span> of your 
                    required {stats.required_hours} hours. Keep up the good work!
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentLogs.length === 0 ? (
                <p className="text-gray-600">No recent activity</p>
              ) : (
                recentLogs.map(log => (
                  <div key={log.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                    <div className="rounded-full bg-blue-100 p-2 flex-shrink-0">
                      <FaClock className="text-blue-600 text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(log.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.time_in} - {log.time_out} ({log.hours_worked} hours)
                      </p>
                      {log.notes && <p className="text-xs text-gray-600 mt-1">{log.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 