import { useState, useEffect } from 'react';
import { format, parseISO, isValid, addBusinessDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addDays, isBefore, isWeekend, isAfter, isSameMonth } from 'date-fns';
import { FaClock, FaCalendarAlt, FaChartLine, FaCheckCircle, FaLeaf } from 'react-icons/fa';
import { API_URL } from '../config';

// Custom color palette
const colors = {
  primary: '#6A6F4C', // Organic
  secondary: '#CBB89D', // Butter
  background: '#EDEID2', // Coconut
  accent: '#806044', // Natural
  highlight: '#5D2510', // Palm Oil
  dark: '#412F26', // Cocoa
  text: {
    primary: '#412F26',
    secondary: '#806044',
    light: '#CBB89D'
  }
};

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
  const [locationCounts, setLocationCounts] = useState({
    onSite: 0,
    workFromHome: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [suggestedDates, setSuggestedDates] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchMonthData(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    calculateSuggestedDates();
  }, [stats.total_hours, stats.required_hours]);

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

      // Fetch all logs to calculate location counts
      const allLogsResponse = await fetch(`${API_URL}/time_logs/index.php`);
      const allLogsData = await allLogsResponse.json();

      if (allLogsData.success) {
        const counts = allLogsData.data.reduce((acc, log) => {
          if (log.location === 'on-site') {
            acc.onSite++;
          } else if (log.location === 'work-from-home') {
            acc.workFromHome++;
          }
          return acc;
        }, { onSite: 0, workFromHome: 0 });
        setLocationCounts(counts);
      }
    } catch (error) {
      setError('Failed to load dashboard data. ' + error.message);
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthData = async (date) => {
    try {
      const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(date), 'yyyy-MM-dd');

      // Fetch holidays
      const holidaysUrl = `${API_URL}/holidays/index.php?start_date=${startDate}&end_date=${endDate}`;
      const holidaysResponse = await fetch(holidaysUrl);
      const holidaysData = await holidaysResponse.json();

      if (holidaysData.success) {
        const formattedHolidays = holidaysData.data.map(holiday => ({
          ...holiday,
          date: format(new Date(holiday.date), 'yyyy-MM-dd')
        }));
        setHolidays(formattedHolidays);
      }

      // Fetch attendance (time logs)
      const logsUrl = `${API_URL}/time_logs/index.php?start_date=${startDate}&end_date=${endDate}`;
      const logsResponse = await fetch(logsUrl);
      const logsData = await logsResponse.json();

      if (logsData.success) {
        // Store the complete log data instead of just dates
        setAttendanceLogs(logsData.data);
      }
    } catch (error) {
      console.error('Error fetching month data:', error);
    }
  };

  const calculateSuggestedDates = () => {
    const remainingHours = calculateRemainingHours();
    if (remainingHours <= 0) {
      setSuggestedDates([]);
      return;
    }

    // Assuming 8 hours per day
    const daysNeeded = Math.ceil(remainingHours / 8);
    const suggestedDays = [];
    let currentDate = new Date();
    let daysFound = 0;

    while (daysFound < daysNeeded && daysFound < 60) { // Limit to next 60 days
      currentDate = addDays(currentDate, 1);
      
      // Skip weekends and holidays
      if (isWeekend(currentDate)) continue;
      if (holidays.some(h => h.date === format(currentDate, 'yyyy-MM-dd'))) continue;
      
      // Skip days that already have logs
      if (attendanceLogs.some(log => log.date === format(currentDate, 'yyyy-MM-dd'))) continue;

      suggestedDays.push(format(currentDate, 'yyyy-MM-dd'));
      daysFound++;
    }

    setSuggestedDates(suggestedDays);
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

  const renderCalendar = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    const startDay = getDay(start);

    // Create array for empty cells before the first day
    const emptyCells = Array.from({ length: startDay }, (_, i) => (
      <div key={`empty-${i}`} className="h-32 bg-gray-50 border border-gray-200" />
    ));

    const calendarDays = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = attendanceLogs.find(log => log.date === dateStr);
      const holiday = holidays.find(h => h.date === dateStr);
      const isToday = isSameDay(day, new Date());
      const isSuggested = suggestedDates.includes(dateStr);
      const isPast = isBefore(day, new Date()) && !isSameDay(day, new Date());
      
      let bgColor = isToday ? 'bg-blue-50' : 'bg-white';
      let textColor = 'text-gray-700';
      let borderColor = isToday ? 'border-blue-300' : 'border-gray-200';
      let locationBadge = null;
      
      if (log) {
        if (log.location === 'work-from-home') {
          bgColor = 'bg-[#6A6F4C]/20';
          textColor = 'text-[#6A6F4C]';
          borderColor = 'border-[#6A6F4C]';
          locationBadge = (
            <span className="inline-block px-2 py-0.5 text-xs bg-[#6A6F4C]/10 text-[#6A6F4C] rounded-full">
              🏠 WFH
            </span>
          );
        } else {
          bgColor = 'bg-[#5D2510]/20';
          textColor = 'text-[#5D2510]';
          borderColor = 'border-[#5D2510]';
          locationBadge = (
            <span className="inline-block px-2 py-0.5 text-xs bg-[#5D2510]/10 text-[#5D2510] rounded-full">
              🏢 On-site
            </span>
          );
        }
      } else if (isSuggested && !holiday && !isPast) {
        bgColor = 'bg-[#6A6F4C]/5';
        borderColor = 'border-[#6A6F4C] border-dashed';
        textColor = 'text-[#6A6F4C]';
        locationBadge = (
          <span className="inline-block px-2 py-0.5 text-xs bg-[#6A6F4C]/10 text-[#6A6F4C] rounded-full">
            Suggested
          </span>
        );
      }
      
      if (holiday) {
        switch (holiday.type) {
          case 'Regular Holiday':
            bgColor = 'bg-red-50';
            textColor = 'text-red-700';
            borderColor = 'border-red-200';
            break;
          case 'Special Non-working Holiday':
            bgColor = 'bg-amber-50';
            textColor = 'text-amber-700';
            borderColor = 'border-amber-200';
            break;
          case 'Special Working Holiday':
            bgColor = 'bg-green-50';
            textColor = 'text-green-700';
            borderColor = 'border-green-200';
            break;
        }
      }

      return (
        <div
          key={dateStr}
          className={`h-32 ${bgColor} border ${borderColor} p-2 hover:bg-gray-50 transition-colors relative`}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : textColor}`}>
                {format(day, 'd')}
              </span>
              {locationBadge}
            </div>
            {holiday && (
              <div className="mt-1 overflow-hidden">
                <span className={`text-xs font-medium ${textColor} block truncate`} title={holiday.name}>
                  {holiday.name}
                </span>
                <span className={`text-xs ${textColor} opacity-75 block truncate`}>
                  {holiday.type}
                </span>
              </div>
            )}
            {log && (
              <div className="mt-1">
                <span className={`text-xs ${textColor} block`}>
                  {log.time_in} - {log.time_out}
                </span>
                <span className={`text-xs ${textColor} font-medium block`}>
                  {log.hours_worked} hrs
                </span>
              </div>
            )}
          </div>
        </div>
      );
    });

    return [...emptyCells, ...calendarDays];
  };

  // Add legend for calendar
  const renderCalendarLegend = () => {
    return (
      <div className="flex flex-wrap gap-4 items-center mb-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-[#5D2510]/20 border border-[#5D2510] mr-2"></div>
          <span className="text-[#412F26]">On-site</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-[#6A6F4C]/20 border border-[#6A6F4C] mr-2"></div>
          <span className="text-[#412F26]">Work from Home</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-[#6A6F4C]/5 border border-[#6A6F4C] border-dashed mr-2"></div>
          <span className="text-[#412F26]">Suggested Days</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-red-50 border border-red-200 mr-2"></div>
          <span className="text-[#412F26]">Regular Holiday</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-amber-50 border border-amber-200 mr-2"></div>
          <span className="text-[#412F26]">Special Non-working Holiday</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-green-50 border border-green-200 mr-2"></div>
          <span className="text-[#412F26]">Special Working Holiday</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#EDEID2] p-6 min-h-screen">
      <div className="flex items-center space-x-4 mb-8">
        <h1 className="text-4xl font-bold text-[#412F26] flex items-center space-x-4 font-serif">
          <FaLeaf className="text-[#6A6F4C]" />
          <span>Growth Tracker</span>
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6A6F4C]"></div>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Progress Card */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
              <h2 className="text-xl font-semibold text-[#412F26]">Progress</h2>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl font-bold text-[#6A6F4C]">{formatHours(stats.total_hours)}</span>
                  <span className="text-xl text-[#806044]">{stats.required_hours}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#806044]">
                  <span>Hours Completed</span>
                  <span>Required Hours</span>
                </div>
                <div className="mt-4 w-full bg-[#EDEID2] rounded-full h-2">
                  <div 
                    className="bg-[#6A6F4C] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.progress_percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-[#806044] mt-2">{stats.progress_percentage.toFixed(1)}% Complete</p>
              </div>
            </div>

            {/* Location Breakdown Card */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
              <h2 className="text-xl font-semibold text-[#412F26]">Attendance Location</h2>
              <div className="space-y-4 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#5D2510]/20 border border-[#5D2510] rounded-full mr-2"></div>
                    <span className="text-[#806044]">On-Site</span>
                  </div>
                  <span className="font-medium text-[#412F26]">{locationCounts.onSite} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#6A6F4C]/20 border border-[#6A6F4C] rounded-full mr-2"></div>
                    <span className="text-[#806044]">Work From Home</span>
                  </div>
                  <span className="font-medium text-[#412F26]">{locationCounts.workFromHome} days</span>
                </div>
                <div className="pt-3 border-t border-[#CBB89D]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[#806044]">Total Days</span>
                    <span className="font-medium text-[#412F26]">{locationCounts.onSite + locationCounts.workFromHome} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones Card */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-[#412F26]">Milestones</h2>
                  <p className="text-4xl font-bold text-[#806044] mt-3">{stats.total_days}</p>
                  <p className="text-sm text-[#806044]">days of growth</p>
                </div>
                <div className="bg-[#806044]/10 p-3 rounded-xl">
                  <FaCalendarAlt className="text-[#806044] text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-[#412F26]">
                  <span className="text-[#5D2510]">{formatHours(calculateRemainingHours())}</span> hours remaining
                </p>
                <p className="text-sm text-[#806044] mt-1">
                  Daily average: {formatHours(stats.daily_average)} hours
                </p>
              </div>
            </div>

            {/* Weekly Growth Card */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-[#412F26]">Weekly Growth</h2>
                  <p className="text-4xl font-bold text-[#5D2510] mt-3">
                    {stats.weekly_hours && stats.weekly_hours.length > 0 
                      ? formatHours(stats.weekly_hours[0]?.weekly_hours || 0) 
                      : '0'}
                  </p>
                  <p className="text-sm text-[#806044]">hours this week</p>
                </div>
                <div className="bg-[#5D2510]/10 p-3 rounded-xl">
                  <FaChartLine className="text-[#5D2510] text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-[#806044] mb-2">
                  <span>Weekly Progress</span>
                  <span>Past 4 Weeks</span>
                </div>
                <div className="flex items-end h-16 space-x-2">
                  {stats.weekly_hours && stats.weekly_hours.slice(0, 4).map((week, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-[#6A6F4C] rounded-t-lg transition-all duration-500"
                        style={{ 
                          height: `${Math.min(100, (week.weekly_hours / 40) * 100)}%`,
                          minHeight: '4px'
                        }}
                      ></div>
                      <span className="text-xs text-[#806044] mt-2">{formatHours(week.weekly_hours)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#412F26]">Growth Calendar</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedMonth(new Date())}
                  className="px-4 py-2 text-sm bg-[#6A6F4C] text-white rounded hover:bg-[#5D2510]"
                >
                  Today
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    ←
                  </button>
                  <span className="text-lg font-medium text-[#412F26]">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            {renderCalendarLegend()}

            <div className="grid grid-cols-7 gap-4 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-[#806044]">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-4">
              {renderCalendar()}
            </div>
          </div>

          {/* Completion Estimate Card */}
          <div className="bg-white backdrop-blur-lg bg-opacity-80 p-8 rounded-2xl shadow-lg border border-[#CBB89D]/20">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-[#412F26]">Your Journey Ahead</h2>
              <div className="bg-[#6A6F4C]/10 p-3 rounded-xl">
                <FaCheckCircle className="text-[#6A6F4C] text-xl" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border-r border-[#CBB89D]/20 pr-6">
                <h3 className="text-sm font-medium text-[#806044]">Days Remaining</h3>
                <p className="text-3xl font-bold text-[#412F26] mt-2">
                  {calculateEstimatedCompletionDays()}
                </p>
                <p className="text-sm text-[#806044] mt-1">
                  working days until completion
                </p>
              </div>
              
              <div className="border-r border-[#CBB89D]/20 px-6">
                <h3 className="text-sm font-medium text-[#806044]">Completion Date</h3>
                <p className="text-3xl font-bold text-[#412F26] mt-2">
                  {calculateEstimatedCompletionDate()}
                </p>
                <p className="text-sm text-[#806044] mt-1">
                  at your current pace
                </p>
              </div>
              
              <div className="pl-6">
                <h3 className="text-sm font-medium text-[#806044]">Weekly Target</h3>
                <p className="text-3xl font-bold text-[#412F26] mt-2">
                  {calculateWeeklyHoursNeeded()} hrs
                </p>
                <p className="text-sm text-[#806044] mt-1">
                  recommended weekly hours
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[#CBB89D]/20">
              <p className="text-[#806044]">
                {stats.progress_percentage >= 100 ? (
                  <span className="text-[#6A6F4C] font-medium">🌱 Congratulations! You've completed your journey and reached all required hours.</span>
                ) : (
                  <>
                    🌱 You've grown <span className="font-medium text-[#6A6F4C]">{stats.progress_percentage.toFixed(1)}%</span> towards your 
                    goal of {stats.required_hours} hours. Keep nurturing your progress!
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white backdrop-blur-lg bg-opacity-80 p-8 rounded-2xl shadow-lg border border-[#CBB89D]/20">
            <h2 className="text-2xl font-semibold text-[#412F26] mb-6">Growth Journal</h2>
            <div className="space-y-4">
              {recentLogs.length === 0 ? (
                <p className="text-[#806044]">No recent activity recorded</p>
              ) : (
                recentLogs.map(log => (
                  <div key={log.id} className="flex items-start space-x-4 pb-4 border-b border-[#CBB89D]/20">
                    <div className="rounded-xl bg-[#6A6F4C]/10 p-3 flex-shrink-0">
                      <FaClock className="text-[#6A6F4C] text-lg" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-[#412F26]">
                        {new Date(log.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-[#806044] mt-1">
                        {log.time_in} - {log.time_out} ({log.hours_worked} hours)
                      </p>
                      {log.notes && (
                        <p className="text-sm text-[#806044] mt-2 bg-[#EDEID2] p-3 rounded-xl">
                          {log.notes}
                        </p>
                      )}
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