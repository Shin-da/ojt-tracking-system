import { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';
import { FaCalendarAlt, FaCheckCircle, FaClock } from 'react-icons/fa';
import { API_URL } from '../config';

const Progress = () => {
  const [entry, setEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    skills: '',
    challenges: '',
    achievements: '',
    reflection: ''
  });
  const [timeData, setTimeData] = useState({
    heatmap_data: [],
    start_date: null,
    total_days: 0,
    total_hours: 0,
    monthly_hours: [],
    weekly_hours: []
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
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setTimeData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch time logs data');
      }
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message);
      console.error('Error fetching time logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement progress entry submission
    console.log(entry);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format the date to display in a readable format
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      return dateString;
    }
  };

  // Render a timeline of months since OJT start
  const renderMonthsTimeline = () => {
    if (!timeData.start_date) return null;
    
    const startDate = parseISO(timeData.start_date);
    const currentDate = new Date();
    const months = [];
    
    let currentMonth = startOfMonth(startDate);
    const endMonth = endOfMonth(currentDate);
    
    while (currentMonth <= endMonth) {
      // Find hours logged in this month from the API data
      const monthData = timeData.monthly_hours.find(m => 
        m.year === currentMonth.getFullYear() && 
        m.month === currentMonth.getMonth() + 1
      );
      
      months.push({
        date: currentMonth,
        name: format(currentMonth, 'MMMM yyyy'),
        hasLogs: !!monthData,
        hours: monthData ? monthData.monthly_hours : 0,
        daysLogged: monthData ? monthData.days_logged : 0
      });
      
      // Move to next month
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">
          <FaCalendarAlt className="inline-block mr-2 text-blue-600" />
          Months Rendered
        </h3>
        <div className="space-y-2">
          {months.map((month, i) => (
            <div key={i} className="flex items-center">
              <div 
                className={`w-16 h-8 rounded-l-md flex items-center justify-center ${
                  month.hasLogs ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {format(month.date, 'MMM')}
              </div>
              <div 
                className={`flex-1 h-8 rounded-r-md pl-3 flex items-center ${
                  month.hasLogs ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <span className="text-sm">
                  {month.hasLogs ? (
                    <>
                      <span className="font-medium">{month.hours.toFixed(1)} hours</span>
                      <span className="mx-1">•</span>
                      <span>{month.daysLogged} days</span>
                    </>
                  ) : 'No time logs'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render a timeline of recent weeks
  const renderWeeksTimeline = () => {
    if (!timeData.start_date) return null;
    
    const startDate = parseISO(timeData.start_date);
    const currentDate = new Date();
    
    // Get the last 8 weeks
    const numWeeks = 8;
    const endDate = currentDate;
    const startOfRange = new Date(endDate);
    startOfRange.setDate(endDate.getDate() - (numWeeks * 7));
    
    const weekIntervals = eachWeekOfInterval(
      { start: startOfRange, end: endDate },
      { weekStartsOn: 1 } // Start on Monday
    );
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">
          <FaClock className="inline-block mr-2 text-green-600" />
          Recent Weeks
        </h3>
        <div className="space-y-2">
          {weekIntervals.map((weekStart, i) => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            
            // Find hours logged in this week from weekly_hours
            const weekData = timeData.weekly_hours.find(w => 
              w.year === weekStart.getFullYear() && 
              w.week === format(weekStart, 'w')
            );
            
            const weekHours = weekData ? weekData.weekly_hours : 0;
            const hasLogs = weekHours > 0;
            
            return (
              <div key={i} className="flex items-center">
                <div 
                  className={`w-20 h-8 rounded-l-md flex items-center justify-center ${
                    hasLogs ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  Week {format(weekStart, 'w')}
                </div>
                <div 
                  className={`flex-1 h-8 rounded-r-md pl-3 flex items-center ${
                    hasLogs ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  <span className="text-sm">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                    {hasLogs && (
                      <span className="ml-2 font-medium text-green-700">
                        {weekHours.toFixed(1)} hours
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render a calendar view of days with logs
  const renderDaysCalendar = () => {
    if (!timeData.heatmap_data || timeData.heatmap_data.length === 0) return null;
    
    const currentDate = new Date();
    const startOfRange = new Date(currentDate);
    startOfRange.setDate(currentDate.getDate() - 27); // Show last 28 days
    
    const days = eachDayOfInterval({ start: startOfRange, end: currentDate });
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">
          <FaCheckCircle className="inline-block mr-2 text-indigo-600" />
          Recent Days Logged
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={`header-${i}`} className="text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {days.map((day, i) => {
            // Find if this day has logs
            const dayData = timeData.heatmap_data.find(d => d.date === format(day, 'yyyy-MM-dd'));
            const hasLogs = !!dayData;
            const hours = dayData ? parseFloat(dayData.hours_worked) : 0;
            
            // Determine color intensity based on hours
            let bgColor = 'bg-gray-100';
            if (hours > 0) {
              if (hours < 4) bgColor = 'bg-indigo-200';
              else if (hours < 6) bgColor = 'bg-indigo-300';
              else if (hours < 8) bgColor = 'bg-indigo-400';
              else bgColor = 'bg-indigo-500';
            }
            
            return (
              <div 
                key={`day-${i}`} 
                className={`h-9 rounded flex items-center justify-center ${bgColor} text-xs relative group`}
                title={hasLogs ? `${format(day, 'MMM d')}: ${hours} hours` : format(day, 'MMM d')}
              >
                {format(day, 'd')}
                {hasLogs && (
                  <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white"></div>
                )}
                <div className="hidden group-hover:block absolute bottom-full mb-1 bg-gray-800 text-white text-xs rounded p-1 z-10">
                  {format(day, 'MMM d')}: {hasLogs ? `${hours} hours` : 'No logs'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
      <h1 className="text-3xl font-bold text-gray-800" style={{fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem'}}>Progress Tracker</h1>
      
      {/* Debug Section - Remove in production */}
      <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md mb-4" style={{backgroundColor: '#fffbeb', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #fde68a', marginBottom: '1rem', maxWidth: '100%', overflowX: 'auto'}}>
        <h2 className="text-lg font-medium text-yellow-800 mb-2" style={{fontSize: '1.125rem', fontWeight: '500', color: '#92400e', marginBottom: '0.5rem'}}>Debug Information</h2>
        <div className="grid grid-cols-1 gap-2 text-sm" style={{display: 'grid', gap: '0.5rem', fontSize: '0.875rem'}}>
          <div><strong style={{fontWeight: 'bold'}}>API URL:</strong> {API_URL}</div>
          <div><strong style={{fontWeight: 'bold'}}>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
          <div><strong style={{fontWeight: 'bold'}}>Error:</strong> {error || 'None'}</div>
          <div><strong style={{fontWeight: 'bold'}}>CSS Test:</strong> <span className="text-red-600 bg-blue-100 p-1 rounded" style={{color: 'red', backgroundColor: '#dbeafe', padding: '0.25rem', borderRadius: '0.25rem'}}>This should be red text on blue background</span></div>
          <div><strong style={{fontWeight: 'bold'}}>Has Data:</strong> {timeData.heatmap_data?.length > 0 ? 'Yes' : 'No'}</div>
          <div><strong style={{fontWeight: 'bold'}}>Data:</strong> <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32 text-xs" style={{backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '0.25rem', overflow: 'auto', maxHeight: '8rem', fontSize: '0.75rem'}}>{JSON.stringify({
            start_date: timeData.start_date,
            total_days: timeData.total_days,
            total_hours: timeData.total_hours,
            weekly_count: timeData.weekly_hours?.length || 0,
            monthly_count: timeData.monthly_hours?.length || 0,
            heatmap_count: timeData.heatmap_data?.length || 0
          }, null, 2)}</pre></div>
          <div><strong style={{fontWeight: 'bold'}}>Browser Info:</strong> {window.navigator.userAgent}</div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" style={{backgroundColor: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '0.375rem'}}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md flex justify-center" style={{backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'center'}}>
          <p className="text-gray-600" style={{color: '#4b5563'}}>Loading progress data...</p>
        </div>
      ) : (
        <>
          {/* MINIMAL NON-STYLED SECTION - FOR DEBUGGING ONLY */}
          <div style={{border: '3px solid black', padding: '10px', margin: '10px 0', backgroundColor: 'white'}}>
            <h3 style={{fontWeight: 'bold'}}>MINIMAL DEBUG VIEW - NO CSS</h3>
            <p>Data loaded: {timeData && 'yes'}</p>
            <p>Total days: {timeData.total_days}</p>
            <p>Total hours: {timeData.total_hours}</p>
            <p>Raw data available:</p>
            <ul style={{listStyleType: 'disc', marginLeft: '20px'}}>
              <li>Weekly data: {timeData.weekly_hours?.length || 0} entries</li>
              <li>Monthly data: {timeData.monthly_hours?.length || 0} entries</li>
              <li>Heatmap data: {timeData.heatmap_data?.length || 0} entries</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md" style={{backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
            <h2 className="text-xl font-semibold text-gray-700 mb-4" style={{fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '1rem'}}>Rendered Time Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Days Rendered</h3>
              <p className="text-3xl font-bold text-blue-600">{timeData.total_days}</p>
              <p className="text-xs text-gray-500 mt-1">since {formatDate(timeData.start_date)}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Hours</h3>
              <p className="text-3xl font-bold text-green-600">{timeData.total_hours.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">of required {timeData.required_hours}</p>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Completion</h3>
              <p className="text-3xl font-bold text-indigo-600">{timeData.progress_percentage.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {(timeData.required_hours - timeData.total_hours).toFixed(1)} hours remaining
              </p>
            </div>
          </div>
          
          {renderMonthsTimeline()}
          {renderWeeksTimeline()}
          {renderDaysCalendar()}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={entry.date}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Skills Learned</label>
            <textarea
              name="skills"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              value={entry.skills}
              onChange={handleChange}
              placeholder="List the skills you learned today..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Challenges Faced</label>
            <textarea
              name="challenges"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              value={entry.challenges}
              onChange={handleChange}
              placeholder="Describe any challenges you faced..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Achievements</label>
            <textarea
              name="achievements"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              value={entry.achievements}
              onChange={handleChange}
              placeholder="List your achievements for the day..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Daily Reflection</label>
            <textarea
              name="reflection"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              value={entry.reflection}
              onChange={handleChange}
              placeholder="Write your daily reflection..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Progress
          </button>
        </form>
      </div>

      {/* Progress History */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Progress History</h2>
        <div className="space-y-4">
          <p className="text-gray-600">No progress entries recorded yet</p>
        </div>
      </div>
    </div>
  );
};

export default Progress; 