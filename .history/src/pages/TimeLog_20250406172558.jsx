import { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const TimeLog = () => {
  const OJT_START_DATE = new Date('2024-02-12');
  const [timeLogs, setTimeLogs] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentLog, setCurrentLog] = useState({
    timeIn: '',
    timeOut: '',
    notes: ''
  });
  const [showBulkLog, setShowBulkLog] = useState(false);

  // Load time logs from localStorage on component mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('timeLogs');
    if (savedLogs) {
      setTimeLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Save time logs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('timeLogs', JSON.stringify(timeLogs));
  }, [timeLogs]);

  const handleCalendarChange = (dates) => {
    setSelectedDates(Array.isArray(dates) ? dates : [dates]);
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();

    if (!currentLog.timeIn || !currentLog.timeOut) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Create logs for each selected date
      const newLogs = selectedDates.map(date => {
        const timeIn = new Date(`${format(date, 'yyyy-MM-dd')}T${currentLog.timeIn}`);
        const timeOut = new Date(`${format(date, 'yyyy-MM-dd')}T${currentLog.timeOut}`);
        const hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60);

        return {
          date: format(date, 'yyyy-MM-dd'),
          timeIn: currentLog.timeIn,
          timeOut: currentLog.timeOut,
          notes: currentLog.notes,
          hoursWorked: hoursWorked.toFixed(2),
          id: Date.now() + Math.random()
        };
      });

      setTimeLogs(prevLogs => [...prevLogs, ...newLogs]);
      
      // Reset form
      setCurrentLog({
        timeIn: '',
        timeOut: '',
        notes: ''
      });
      setSelectedDates([]);
      setShowBulkLog(false);
    } catch (error) {
      console.error('Error processing time logs:', error);
      alert('There was an error processing your time logs. Please check your inputs.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentLog(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const deleteLog = (id) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      setTimeLogs(prevLogs => prevLogs.filter(log => log.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Time Log</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Add Time Logs</h2>
          <button
            onClick={() => setShowBulkLog(!showBulkLog)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {showBulkLog ? 'Cancel Bulk Log' : 'Bulk Log Time'}
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
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {format(selectedDates[0], 'MMM d, yyyy')} 
                  {selectedDates[1] && ` - ${format(selectedDates[1], 'MMM d, yyyy')}`}
                </p>
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
              disabled={selectedDates.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Log Time for Selected Dates
            </button>
          </form>
        ) : null}
      </div>

      {/* Time Log History */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Time Log History</h2>
        {timeLogs.length === 0 ? (
          <p className="text-gray-600">No time logs recorded yet</p>
        ) : (
          <div className="space-y-4">
            {timeLogs.sort((a, b) => new Date(b.date) - new Date(a.date)).map(log => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{format(parseISO(log.date), 'MMMM d, yyyy')}</p>
                    <p className="text-sm text-gray-600">
                      {log.timeIn} - {log.timeOut} ({log.hoursWorked} hours)
                    </p>
                    {log.notes && (
                      <p className="mt-2 text-gray-700">{log.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="text-red-600 hover:text-red-800"
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