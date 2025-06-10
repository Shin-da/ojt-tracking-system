import { useState, useEffect } from 'react';
import { format, parseISO, isValid, eachDayOfInterval, addDays } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_URL = 'http://localhost/OJT%20TRACKER/api';

const TimeLog = () => {
  const OJT_START_DATE = new Date('2024-02-12');
  const [timeLogs, setTimeLogs] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentLog, setCurrentLog] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    timeIn: '',
    timeOut: '',
    notes: ''
  });
  const [showBulkLog, setShowBulkLog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load time logs from API on component mount
  useEffect(() => {
    fetchTimeLogs();
  }, []);

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

  const handleCalendarChange = (dates) => {
    setSelectedDates(Array.isArray(dates) ? dates : [dates]);
  };

  const handleDateChange = (e) => {
    setCurrentLog(prev => ({
      ...prev,
      date: e.target.value
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
        notes: currentLog.notes
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
      
      // Reset form
      setCurrentLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        timeIn: '',
        timeOut: '',
        notes: ''
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
          notes: currentLog.notes
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
      
      // Reset form
      setCurrentLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        timeIn: '',
        timeOut: '',
        notes: ''
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

      {/* Time Log History */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Time Log History</h2>
        {loading && <p className="text-gray-600">Loading...</p>}
        {!loading && timeLogs.length === 0 ? (
          <p className="text-gray-600">No time logs recorded yet</p>
        ) : (
          <div className="space-y-4">
            {timeLogs.map(log => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{format(parseISO(log.date), 'MMMM d, yyyy')}</p>
                    <p className="text-sm text-gray-600">
                      {log.time_in} - {log.time_out} ({log.hours_worked} hours)
                    </p>
                    {log.notes && (
                      <p className="mt-2 text-gray-700">{log.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={loading}
                  >
                    Delete
                  </button>
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