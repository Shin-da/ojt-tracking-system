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

  useEffect(() => {
    fetchTimeLogs();
  }, []);

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
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        (log.notes && log.notes.toLowerCase().includes(searchLower)) ||
        log.date.includes(searchLower) ||
        log.time_in.includes(searchLower) ||
        log.time_out.includes(searchLower)
      );
    }
    
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortConfig.field === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortConfig.field === 'hours') {
        comparison = parseFloat(a.hours_worked) - parseFloat(b.hours_worked);
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    
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
      const dates = timeLogs.map(log => parseISO(log.date));
      const earliest = new Date(Math.min(...dates));
      const latest = new Date(Math.max(...dates));
      
      let current = new Date(earliest);
      while (current <= latest) {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        const label = format(current, 'MMMM yyyy');
        
        options.push({ value, label });
        current = new Date(year, month, 1);
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
      
      await fetchTimeLogs();
      
      setCurrentLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        timeIn: '08:00',
        timeOut: '17:00',
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

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    if (!currentLog.timeIn || !currentLog.timeOut || selectedDates.length === 0) {
      alert('Please fill in all required fields and select dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let datesInRange = [];
      
      if (selectedDates.length === 1) {
        datesInRange = [selectedDates[0]];
      } else if (selectedDates.length === 2) {
        datesInRange = eachDayOfInterval({
          start: selectedDates[0],
          end: selectedDates[1]
        });
      }
      
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
      
      await fetchTimeLogs();
      
      setCurrentLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        timeIn: '08:00',
        timeOut: '17:00',
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

  const shouldShowLunchOption = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return false;
    
    const morningHour = parseInt(timeIn.split(':')[0], 10);
    const afternoonHour = parseInt(timeOut.split(':')[0], 10);
    
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
    <div className="space-y-6 bg-[#EDEID2] p-6 min-h-screen">
      <h1 className="text-4xl font-bold text-[#412F26] flex items-center space-x-3">
        <FaClock className="text-[#6A6F4C]" />
        <span>Time Log</span>
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-[#412F26]">Add Time Log</h2>
          <button
            onClick={() => setShowBulkLog(!showBulkLog)}
            className="px-4 py-2 text-sm font-medium bg-[#6A6F4C] text-white rounded-lg hover:bg-[#5D2510] transition"
          >
            {showBulkLog ? 'Single Day Log' : 'Bulk Log Time'}
          </button>
        </div>

        {showBulkLog ? (
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#806044] mb-2">Select Dates</label>
              <Calendar
                onChange={handleCalendarChange}
                value={selectedDates}
                minDate={OJT_START_DATE}
                maxDate={new Date()}
                selectRange={true}
                className="border rounded-lg p-4 w-full"
                tileClassName={({ date }) => {
                  if (timeLogs.some(log => log.date === format(date, 'yyyy-MM-dd'))) {
                    return 'bg-[#6A6F4C]/10';
                  }
                }}
              />
              {selectedDates.length > 0 && (
                <p className="text-sm text-[#806044] mt-2">
                  Selected: {format(selectedDates[0], 'MMM d, yyyy')}
                  {selectedDates[1] && ` - ${format(selectedDates[1], 'MMM d, yyyy')}`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#806044]">Time In</label>
                <input
                  type="time"
                  name="timeIn"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-[#CBB89D] rounded-md shadow-sm focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
                  value={currentLog.timeIn}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#806044]">Time Out</label>
                <input
                  type="time"
                  name="timeOut"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-[#CBB89D] rounded-md shadow-sm focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
                  value={currentLog.timeOut}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {renderLunchBreakOption(currentLog.timeIn, currentLog.timeOut)}

            <div>
              <label className="block text-sm font-medium text-[#806044]">Notes</label>
              <textarea
                name="notes"
                className="mt-1 block w-full px-3 py-2 bg-white border border-[#CBB89D] rounded-md shadow-sm focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
                rows={3}
                value={currentLog.notes}
                onChange={handleChange}
                placeholder="Add any notes about these days..."
              />
            </div>

            <button
              type="submit"
              disabled={selectedDates.length === 0 || loading}
              className="w-full bg-[#6A6F4C] text-white py-2 px-4 rounded-lg hover:bg-[#5D2510] transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Log Time for Selected Dates'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#806044]">Date</label>
              <input
                type="date"
                name="date"
                className="mt-1 block w-full px-3 py-2 bg-white border border-[#CBB89D] rounded-md shadow-sm focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
                value={currentLog.date}
                onChange={handleDateChange}
                min={format(OJT_START_DATE, 'yyyy-MM-dd')}
                max={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#806044]">Time In</label>
                <input
                  type="time"
                  name="timeIn"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-[#CBB89D] rounded-md shadow-sm focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
                  value={currentLog.timeIn}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#806044]">Time Out</label>
                <input
                  type="time"
                  name="timeOut"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-[#CBB89D] rounded-md shadow-sm focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
                  value={currentLog.timeOut}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            {renderLunchBreakOption(currentLog.timeIn, currentLog.timeOut)}

            <div>
              <label className="block text-sm font-medium text-[#806044]">Notes</label>
              <textarea
                name="notes"
                className="mt-1 block w-full px-3 py-2 bg-white border border-[#CBB89D] rounded-md shadow-sm focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
                rows={3}
                value={currentLog.notes}
                onChange={handleChange}
                placeholder="Add any notes about this day..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6A6F4C] text-white py-2 px-4 rounded-lg hover:bg-[#5D2510] transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Log Time'}
            </button>
          </form>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-[#412F26]">Time Log History</h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search notes, dates..."
              className="pl-10 pr-3 py-2 w-full border border-[#CBB89D] rounded-lg bg-[#EDEID2] text-[#412F26]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="pl-3 pr-3 py-2 border border-[#CBB89D] rounded-lg bg-[#EDEID2] text-[#412F26]"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              {getMonthOptions().map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 p-4 bg-[#EDEID2] rounded-lg border border-[#CBB89D]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-[#806044]">Logs</h3>
              <p className="text-2xl font-bold text-[#412F26]">{filteredLogs.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#806044]">Total Hours</h3>
              <p className="text-2xl font-bold text-[#6A6F4C]">{totalFilteredHours.toFixed(1)}</p>
            </div>
            {filterMonth !== 'all' && (
              <div>
                <h3 className="text-sm font-medium text-[#806044]">Daily Average</h3>
                <p className="text-2xl font-bold text-[#5D2510]">
                  {filteredLogs.length === 0 ? '0' : (totalFilteredHours / filteredLogs.length).toFixed(1)}
                </p>
              </div>
            )}
          </div>
        </div>

        {loading && <p className="text-[#806044]">Loading...</p>}
        {!loading && filteredLogs.length === 0 ? (
          <div className="text-center py-10 border border-[#CBB89D] rounded-lg bg-[#EDEID2]">
            <FaCalendarAlt className="mx-auto text-[#CBB89D] text-4xl mb-3" />
            <p className="text-[#806044]">No time logs found</p>
            {searchTerm || filterMonth !== 'all' ? (
              <p className="text-sm text-[#806044] mt-1">Try adjusting your filters</p>
            ) : (
              <p className="text-sm text-[#806044] mt-1">Start by adding your first time log</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="hidden md:grid grid-cols-5 gap-4 p-3 font-medium text-sm text-[#806044] border-b">
              <button 
                className="flex items-center space-x-1 col-span-1"
                onClick={() => handleSort('date')}
              >
                <span>Date</span>
                <FaSort className={`text-xs ${sortConfig.field === 'date' ? 'text-[#6A6F4C]' : 'text-[#CBB89D]'}`} />
              </button>
              <div className="col-span-1">Time</div>
              <button 
                className="flex items-center space-x-1 col-span-1"
                onClick={() => handleSort('hours')}
              >
                <span>Hours</span>
                <FaSort className={`text-xs ${sortConfig.field === 'hours' ? 'text-[#6A6F4C]' : 'text-[#CBB89D]'}`} />
              </button>
              <div className="col-span-1">Notes</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            {filteredLogs.map(log => (
              <div 
                key={log.id} 
                className="border rounded-lg p-4 hover:bg-[#EDEID2]/50 transition-colors"
              >
                <div className="md:grid md:grid-cols-5 md:gap-4 space-y-2 md:space-y-0">
                  <div className="col-span-1 flex md:block items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#412F26]">{format(parseISO(log.date), 'EEE, MMM d, yyyy')}</p>
                      <p className="text-xs text-[#806044] md:block hidden">
                        {differenceInDays(new Date(), parseISO(log.date)) === 0 
                          ? 'Today' 
                          : differenceInDays(new Date(), parseISO(log.date)) === 1 
                            ? 'Yesterday' 
                            : `${differenceInDays(new Date(), parseISO(log.date))} days ago`
                        }
                      </p>
                    </div>
                    <button
                      className="md:hidden text-[#5D2510] hover:text-[#412F26]"
                      onClick={() => deleteLog(log.id)}
                      disabled={loading}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    <div className="mr-2">
                      <FaClock className="text-[#CBB89D] text-sm" />
                    </div>
                    <p className="text-sm text-[#806044]">
                      {log.time_in} to {log.time_out}
                    </p>
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    <div className="px-2 py-1 rounded-full bg-[#6A6F4C]/10 text-[#6A6F4C] font-medium">
                      {log.hours_worked} hrs
                    </div>
                    {parseFloat(log.hours_worked) >= 8 && (
                      <div className="ml-2 text-[#5D2510]" title="Full day completed">
                        <FaCheckCircle />
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    {log.notes ? (
                      <p className="text-sm text-[#412F26]">{log.notes}</p>
                    ) : (
                      <p className="text-sm text-[#CBB89D] italic">No notes</p>
                    )}
                  </div>
                  
                  <div className="col-span-1 text-right hidden md:block">
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="text-[#5D2510] hover:text-[#412F26] p-1"
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