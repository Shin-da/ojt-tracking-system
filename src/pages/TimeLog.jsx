import { useState, useEffect } from 'react';
import { format, parseISO, isValid, eachDayOfInterval, addDays, subMonths, differenceInDays } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaCalendarAlt, FaClock, FaSort, FaFilter, FaSearch, FaTrash, FaCheckCircle, FaEdit, FaPlus } from 'react-icons/fa';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const TimeLog = () => {
  const { user } = useAuth();
  const OJT_START_DATE = new Date('2024-02-12');
  const [timeLogs, setTimeLogs] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentLog, setCurrentLog] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    timeIn: '08:00',  // Default to 8:00 AM
    timeOut: '17:00', // Default to 5:00 PM (17:00 in 24-hour format)
    notes: '',
    includeLunchBreak: true,
    location: 'on-site'  // Default to on-site
  });
  const [showBulkLog, setShowBulkLog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  const [filterMonth, setFilterMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalFilteredHours, setTotalFilteredHours] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    timeIn: '',
    timeOut: '',
    location: 'on-site',
    includeLunchBreak: true,
    notes: ''
  });

  useEffect(() => {
    fetchTimeLogs();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [timeLogs, filterMonth, searchTerm, sortConfig]);

  const fetchTimeLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/time_logs/index.php`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setTimeLogs(data.data);
      } else {
        setError(data.message || 'Failed to fetch time logs');
      }
    } catch (err) {
      setError('An error occurred while fetching time logs');
      console.error('Error fetching time logs:', err);
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
    try {
      const response = await fetch(`${API_URL}/time_logs/index.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          date: '',
          timeIn: '',
          timeOut: '',
          location: 'on-site',
          includeLunchBreak: true,
          notes: ''
        });
        fetchTimeLogs();
      } else {
        setError(data.message || 'Failed to add time log');
      }
    } catch (err) {
      setError('An error occurred while adding time log');
      console.error('Error adding time log:', err);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    if (selectedDates.length === 0 || !currentLog.timeIn || !currentLog.timeOut) {
      alert('Please select dates and fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const startDate = selectedDates[0];
      const endDate = selectedDates[1] || selectedDates[0];
      
      const dateRange = eachDayOfInterval({
        start: startDate,
        end: endDate
      });
      
      let successCount = 0;
      
      for (const date of dateRange) {
        const formattedDate = format(date, 'yyyy-MM-dd');
        
        // Skip dates that already have logs
        if (timeLogs.some(log => log.date === formattedDate)) {
          continue;
        }
        
        const logData = {
          date: formattedDate,
          timeIn: currentLog.timeIn,
          timeOut: currentLog.timeOut,
          notes: currentLog.notes,
          includeLunchBreak: currentLog.includeLunchBreak,
          location: currentLog.location
        };
        
        const response = await fetch(`${API_URL}/time_logs/index.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(logData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          successCount++;
        } else {
          throw new Error(`Failed to log time for ${formattedDate}: ${data.message}`);
        }
      }
      
      await fetchTimeLogs();
      
      setCurrentLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        timeIn: '08:00',
        timeOut: '17:00',
        notes: '',
        includeLunchBreak: true,
        location: 'on-site'
      });
      setSelectedDates([]);
      setShowBulkLog(false);
      
      alert(`Time logged successfully for ${successCount} day(s)!`);
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
        const response = await fetch(`${API_URL}/time_logs/index.php?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6A6F4C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#EDEID2] p-8 min-h-screen">
      <h1 className="text-5xl font-bold text-[#412F26] flex items-center space-x-4 font-serif">
        <FaClock className="text-[#6A6F4C]" />
        <span>Time Log</span>
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-[#412F26]">Time Log History</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-[#6A6F4C] text-white rounded-lg hover:bg-[#5D2510] transition-colors"
        >
          <FaPlus className="mr-2" />
          Add Time Log
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-[#CBB89D]/30">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-6">
            <input
              type="text"
              placeholder="Search notes, dates..."
              className="pl-12 pr-4 py-3 w-full border border-[#CBB89D] rounded-lg bg-[#EDEID2] text-[#412F26] shadow-sm focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="pl-4 pr-4 py-3 border border-[#CBB89D] rounded-lg bg-[#EDEID2] text-[#412F26] shadow-sm focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium text-[#806044]">Logs</h3>
              <p className="text-3xl font-bold text-[#412F26]">{filteredLogs.length}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-[#806044]">Total Hours</h3>
              <p className="text-3xl font-bold text-[#6A6F4C]">{totalFilteredHours.toFixed(1)}</p>
            </div>
            {filterMonth !== 'all' && (
              <div>
                <h3 className="text-lg font-medium text-[#806044]">Daily Average</h3>
                <p className="text-3xl font-bold text-[#5D2510]">
                  {filteredLogs.length === 0 ? '0' : (totalFilteredHours / filteredLogs.length).toFixed(1)}
                </p>
              </div>
            )}
          </div>
        </div>

        {!loading && filteredLogs.length === 0 ? (
          <div className="text-center py-10 border border-[#CBB89D] rounded-lg bg-[#EDEID2]">
            <FaCalendarAlt className="mx-auto text-[#CBB89D] text-5xl mb-4" />
            <p className="text-[#806044]">No time logs found</p>
            {searchTerm || filterMonth !== 'all' ? (
              <p className="text-lg text-[#806044] mt-2">Try adjusting your filters</p>
            ) : (
              <p className="text-lg text-[#806044] mt-2">Start by adding your first time log</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-5 gap-6 p-4 font-medium text-lg text-[#806044] border-b">
              <button 
                className="flex items-center space-x-2 col-span-1"
                onClick={() => handleSort('date')}
              >
                <span>Date</span>
                <FaSort className={`text-lg ${sortConfig.field === 'date' ? 'text-[#6A6F4C]' : 'text-[#CBB89D]'}`} />
              </button>
              <div className="col-span-1">Time</div>
              <button 
                className="flex items-center space-x-2 col-span-1"
                onClick={() => handleSort('hours')}
              >
                <span>Hours</span>
                <FaSort className={`text-lg ${sortConfig.field === 'hours' ? 'text-[#6A6F4C]' : 'text-[#CBB89D]'}`} />
              </button>
              <div className="col-span-1">Location/Notes</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            {filteredLogs.map(log => (
              <div 
                key={log.id} 
                className="border rounded-lg p-6 hover:bg-[#EDEID2]/50 transition-transform transform hover:scale-105"
              >
                <div className="md:grid md:grid-cols-5 md:gap-6 space-y-4 md:space-y-0">
                  <div className="col-span-1 flex md:block items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#412F26]">{format(parseISO(log.date), 'EEE, MMM d, yyyy')}</p>
                      <p className="text-lg text-[#806044] md:block hidden">
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
                    <div className="mr-3">
                      <FaClock className="text-[#CBB89D] text-lg" />
                    </div>
                    <p className="text-lg text-[#806044]">
                      {log.time_in} to {log.time_out}
                    </p>
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    <div className="px-3 py-2 rounded-full bg-[#6A6F4C]/10 text-[#6A6F4C] font-medium">
                      {log.hours_worked} hrs
                    </div>
                    {parseFloat(log.hours_worked) >= 8 && (
                      <div className="ml-3 text-[#5D2510]" title="Full day completed">
                        <FaCheckCircle />
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    {log.location === 'work-from-home' ? (
                      <span className="px-3 py-1 rounded-full bg-[#6A6F4C]/10 text-[#6A6F4C] font-medium mr-2">WFH</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-[#5D2510]/10 text-[#5D2510] font-medium mr-2">On-site</span>
                    )}
                    {log.notes ? (
                      <p className="text-lg text-[#412F26] mt-2">{log.notes}</p>
                    ) : (
                      <p className="text-lg text-[#CBB89D] italic mt-2">No notes</p>
                    )}
                  </div>
                  
                  <div className="col-span-1 text-right hidden md:block">
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="text-[#5D2510] hover:text-[#412F26] p-2"
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Time Log</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time In</label>
                <input
                  type="time"
                  value={formData.timeIn}
                  onChange={(e) => setFormData({ ...formData, timeIn: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time Out</label>
                <input
                  type="time"
                  value={formData.timeOut}
                  onChange={(e) => setFormData({ ...formData, timeOut: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                >
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeLunchBreak}
                  onChange={(e) => setFormData({ ...formData, includeLunchBreak: e.target.checked })}
                  className="h-4 w-4 text-[#6A6F4C] focus:ring-[#6A6F4C] border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Include Lunch Break</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#6A6F4C] text-white rounded-md hover:bg-[#5D2510]"
                >
                  Add Time Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeLog;