import { useState, useEffect } from 'react';
import { format, parseISO, isValid, eachDayOfInterval, addDays, subMonths, differenceInDays } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaCalendarAlt, FaClock, FaSort, FaFilter, FaSearch, FaTrash, FaCheckCircle, FaEdit } from 'react-icons/fa';
import { API_URL } from '../config';

const TimeLog = () => {
  const OJT_START_DATE = new Date('2024-02-12');
  const [timeLogs, setTimeLogs] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentLog, setCurrentLog] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    timeIn: '08:00',  // Default to 8:00 AM
    timeOut: '17:00', // Default to 5:00 PM (17:00 in 24-hour format)
    notes: '',
    includeLunchBreak: true
  });
  const [showBulkLog, setShowBulkLog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  const [filterMonth, setFilterMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalFilteredHours, setTotalFilteredHours] = useState(0);

  // Load time logs from API on component mount
  useEffect(() => {
    fetchTimeLogs();
  }, []);

  // Update filtered logs when timeLogs, filterMonth, or searchTerm changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [timeLogs, filterMonth, searchTerm, sortConfig]);

  const fetchTimeLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/time_logs/index.php`);
      const data = await response.json();
      
      if (data.success) {
        setTimeLogs(data.data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to fetch time logs. Please try again.');
      console.error('Error fetching time logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...timeLogs];
    
    // Apply month filter
    if (filterMonth !== 'all') {
      const [year, month] = filterMonth.split('-');
      filtered = filtered.filter(log => {
        const logDate = parseISO(log.date);
        return (
          logDate.getFullYear() === parseInt(year) && 
          logDate.getMonth() === parseInt(month) - 1
        );
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        (log.notes && log.notes.toLowerCase().includes(searchLower)) ||
        log.date.includes(searchLower) ||
        log.time_in.includes(searchLower) ||
        log.time_out.includes(searchLower)
      );
    }
    
    // Sort logs
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortConfig.field === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortConfig.field === 'hours') {
        comparison = parseFloat(a.hours_worked) - parseFloat(b.hours_worked);
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    
    // Calculate total hours for filtered logs
    const total = filtered.reduce((sum, log) => sum + parseFloat(log.hours_worked), 0);
    setTotalFilteredHours(total);
    
    setFilteredLogs(filtered);
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getMonthOptions = () => {
    const options = [{ value: 'all', label: 'All Time' }];
    
    if (timeLogs.length > 0) {
      // Get earliest and latest dates
      const dates = timeLogs.map(log => parseISO(log.date));
      const earliest = new Date(Math.min(...dates));
      const latest = new Date(Math.max(...dates));
      
      // Add options for each month between earliest and latest
      let current = new Date(earliest);
      while (current <= latest) {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        const label = format(current, 'MMMM yyyy');
        
        options.push({ value, label });
        current = new Date(year, month, 1); // Move to next month
      }
    }
    
    return options;
  };

  const handleCalendarChange = (dates) => {
    setSelectedDates(Array.isArray(dates) ? dates : [dates]);
  };

  const handleDateChange = (e) => {
    setCurrentLog(prev => ({
      ...prev,
      date: e.target.value
    }));
  };

  const handleCheckboxChange = (e) => {
    setCurrentLog(prev => ({
      ...prev,
      includeLunchBreak: e.target.checked
    }));
  };

  // Handle individual time log submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentLog.date || !currentLog.timeIn || !currentLog.timeOut) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const logData = {
        date: currentLog.date,
        timeIn: currentLog.timeIn,
        timeOut: currentLog.timeOut,
        notes: currentLog.notes,
        includeLunchBreak: currentLog.includeLunchBreak
      };
      
      const response = await fetch(`${API_URL}/time_logs/index.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      // Refetch time logs
      await fetchTimeLogs();
      
      // Reset form but keep the default times
      setCurrentLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        timeIn: '08:00',  // Keep default time
        timeOut: '17:00', // Keep default time
        notes: '',
        includeLunchBreak: true
      });
      
      alert('Time log added successfully!');
    } catch (error) {
      setError(error.message || 'Failed to add time log. Please try again.');
      console.error('Error adding time log:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk time log submission
  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    if (!currentLog.timeIn || !currentLog.timeOut || selectedDates.length === 0) {
      alert('Please fill in all required fields and select dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get all dates in the range
      let datesInRange = [];
      
      if (selectedDates.length === 1) {
        // Single date selected
        datesInRange = [selectedDates[0]];
      } else if (selectedDates.length === 2) {
        // Date range selected
        datesInRange = eachDayOfInterval({
          start: selectedDates[0],
          end: selectedDates[1]
        });
      }
      
      // Create logs for each date in the range
      for (const date of datesInRange) {
        const formattedDate = format(date, 'yyyy-MM-dd');
        
        const logData = {
          date: formattedDate,
          timeIn: currentLog.timeIn,
          timeOut: currentLog.timeOut,
          notes: currentLog.notes,
          includeLunchBreak: currentLog.includeLunchBreak
        };
        
        const response = await fetch(`${API_URL}/time_logs/index.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(logData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(`Failed to log time for ${formattedDate}: ${data.message}`);
        }
      }
      
      // Refetch time logs
      await fetchTimeLogs();
      
      // Reset form but keep the default times
      setCurrentLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        timeIn: '08:00',  // Keep default time
        timeOut: '17:00', // Keep default time
        notes: '',
        includeLunchBreak: true
      });
      setSelectedDates([]);
      setShowBulkLog(false);
      
      alert(`Time logged successfully for ${datesInRange.length} day(s)!`);
    } catch (error) {
      setError(error.message || 'Failed to add time logs. Please try again.');
      console.error('Error adding time logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentLog(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const deleteLog = async (id) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/time_logs/index.php?id=${id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          await fetchTimeLogs();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        setError(error.message || 'Failed to delete time log. Please try again.');
        console.error('Error deleting time log:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper function to check if the time span includes lunch
  const shouldShowLunchOption = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return false;
    
    const morningHour = parseInt(timeIn.split(':')[0], 10);
    const afternoonHour = parseInt(timeOut.split(':')[0], 10);
    
    // If time span crosses noon (12pm), show lunch option
    return morningHour < 12 && afternoonHour >= 13;
  };

  const renderLunchBreakOption = (timeIn, timeOut) => {
    if (shouldShowLunchOption(timeIn, timeOut)) {
      return (
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={currentLog.includeLunchBreak}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Deduct 1 hour lunch break (12pm - 1pm)
            </span>
          </label>
          {currentLog.includeLunchBreak && (
            <p className="mt-1 text-xs text-gray-500">
              1 hour will be automatically deducted from your total hours.
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Time Log</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Add Time Log</h2>
          <button
            onClick={() => setShowBulkLog(!showBulkLog)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {showBulkLog ? 'Single Day Log' : 'Bulk Log Time'}
          </button>
        </div>

        {showBulkLog ? (
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Dates</label>
              <Calendar
                onChange={handleCalendarChange}
                value={selectedDates}
                minDate={OJT_START_DATE}
                maxDate={new Date()}
                selectRange={true}
                className="border rounded-lg p-4 w-full"
                tileClassName={({ date }) => {
                  if (timeLogs.some(log => log.date === format(date, 'yyyy-MM-dd'))) {
                    return 'bg-blue-100';
                  }
                }}
              />
              {selectedDates.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 font-semibold">
                    Selected: {format(selectedDates[0], 'MMM d, yyyy')} 
                    {selectedDates[1] && ` - ${format(selectedDates[1], 'MMM d, yyyy')}`}
                  </p>
                  {selectedDates.length === 2 && (
                    <p className="text-xs text-gray-500">
                      This will log time for all {
                        eachDayOfInterval({ start: selectedDates[0], end: selectedDates[1] }).length
                      } days in this range.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Time In</label>
                <input
                  type="time"
                  name="timeIn"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={currentLog.timeIn}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Time Out</label>
                <input
                  type="time"
                  name="timeOut"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={currentLog.timeOut}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {renderLunchBreakOption(currentLog.timeIn, currentLog.timeOut)}

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={currentLog.notes}
                onChange={handleChange}
                placeholder="Add any notes about these days..."
              />
            </div>

            <button
              type="submit"
              disabled={selectedDates.length === 0 || loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Log Time for Selected Dates'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={currentLog.date}
                onChange={handleDateChange}
                min={format(OJT_START_DATE, 'yyyy-MM-dd')}
                max={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Time In</label>
                <input
                  type="time"
                  name="timeIn"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={currentLog.timeIn}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Time Out</label>
                <input
                  type="time"
                  name="timeOut"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={currentLog.timeOut}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            {renderLunchBreakOption(currentLog.timeIn, currentLog.timeOut)}

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={currentLog.notes}
                onChange={handleChange}
                placeholder="Add any notes about this day..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Log Time'}
            </button>
          </form>
        )}
      </div>

      {/* Time Log History - Enhanced */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Time Log History</h2>
          
          <div className="flex flex-col md:flex-row gap-3 mt-3 md:mt-0 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-grow md:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400 text-sm" />
              </div>
              <input
                type="text"
                placeholder="Search notes, dates..."
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Month Filter */}
            <div className="relative flex-grow md:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400 text-sm" />
              </div>
              <select
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md appearance-none bg-white"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                {getMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Logs</h3>
              <p className="text-2xl font-bold text-gray-700">{filteredLogs.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
              <p className="text-2xl font-bold text-blue-600">{totalFilteredHours.toFixed(1)}</p>
            </div>
            {filterMonth !== 'all' && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Daily Average</h3>
                <p className="text-2xl font-bold text-green-600">
                  {filteredLogs.length === 0 ? '0' : (totalFilteredHours / filteredLogs.length).toFixed(1)}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {loading && <p className="text-gray-600">Loading...</p>}
        {!loading && filteredLogs.length === 0 ? (
          <div className="text-center py-10 border border-gray-200 rounded-lg">
            <FaCalendarAlt className="mx-auto text-gray-300 text-4xl mb-3" />
            <p className="text-gray-600">No time logs found</p>
            {searchTerm || filterMonth !== 'all' ? (
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">Start by adding your first time log</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-5 gap-4 p-3 font-medium text-sm text-gray-600 border-b">
              <button 
                className="flex items-center space-x-1 col-span-1"
                onClick={() => handleSort('date')}
              >
                <span>Date</span>
                <FaSort className={`text-xs ${sortConfig.field === 'date' ? 'text-blue-600' : 'text-gray-400'}`} />
              </button>
              <div className="col-span-1">Time</div>
              <button 
                className="flex items-center space-x-1 col-span-1"
                onClick={() => handleSort('hours')}
              >
                <span>Hours</span>
                <FaSort className={`text-xs ${sortConfig.field === 'hours' ? 'text-blue-600' : 'text-gray-400'}`} />
              </button>
              <div className="col-span-1">Notes</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            {/* Log Entries */}
            {filteredLogs.map(log => (
              <div 
                key={log.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="md:grid md:grid-cols-5 md:gap-4 space-y-2 md:space-y-0">
                  {/* Date */}
                  <div className="col-span-1 flex md:block items-center justify-between">
                    <div>
                      <p className="font-semibold">{format(parseISO(log.date), 'EEE, MMM d, yyyy')}</p>
                      <p className="text-xs text-gray-500 md:block hidden">
                        {differenceInDays(new Date(), parseISO(log.date)) === 0 
                          ? 'Today' 
                          : differenceInDays(new Date(), parseISO(log.date)) === 1 
                            ? 'Yesterday' 
                            : `${differenceInDays(new Date(), parseISO(log.date))} days ago`
                        }
                      </p>
                    </div>
                    <button
                      className="md:hidden text-red-600 hover:text-red-800"
                      onClick={() => deleteLog(log.id)}
                      disabled={loading}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  {/* Time */}
                  <div className="col-span-1 flex items-center">
                    <div className="mr-2">
                      <FaClock className="text-gray-400 text-sm" />
                    </div>
                    <p className="text-sm text-gray-600">
                      {log.time_in} to {log.time_out}
                    </p>
                  </div>
                  
                  {/* Hours */}
                  <div className="col-span-1 flex items-center">
                    <div className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                      {log.hours_worked} hrs
                    </div>
                    {parseFloat(log.hours_worked) >= 8 && (
                      <div className="ml-2 text-green-500" title="Full day completed">
                        <FaCheckCircle />
                      </div>
                    )}
                  </div>
                  
                  {/* Notes */}
                  <div className="col-span-1">
                    {log.notes ? (
                      <p className="text-sm text-gray-700">{log.notes}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No notes</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-1 text-right hidden md:block">
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      disabled={loading}
                      title="Delete log"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeLog; 