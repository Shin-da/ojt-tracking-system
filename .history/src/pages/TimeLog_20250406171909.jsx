import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

const TimeLog = () => {
  const OJT_START_DATE = '2024-02-12'; // Your OJT start date
  const [timeLogs, setTimeLogs] = useState([]);
  const [currentLog, setCurrentLog] = useState({
    date: '',  // Changed to empty string initially
    timeIn: '',
    timeOut: '',
    notes: ''
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate date
    const selectedDate = new Date(currentLog.date);
    const startDate = new Date(OJT_START_DATE);
    const today = new Date();
    
    if (selectedDate < startDate || selectedDate > today) {
      alert('Please select a date between February 12, 2024 and today');
      return;
    }
    
    // Calculate hours worked
    const timeIn = new Date(`${currentLog.date}T${currentLog.timeIn}`);
    const timeOut = new Date(`${currentLog.date}T${currentLog.timeOut}`);
    const hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60);
    
    const newLog = {
      ...currentLog,
      hoursWorked: hoursWorked.toFixed(2),
      id: Date.now()
    };

    setTimeLogs(prevLogs => [...prevLogs, newLog]);
    
    // Reset form
    setCurrentLog({
      date: '',  // Reset to empty string
      timeIn: '',
      timeOut: '',
      notes: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentLog(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const deleteLog = (id) => {
    setTimeLogs(prevLogs => prevLogs.filter(log => log.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Time Log</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={currentLog.date}
              onChange={handleChange}
              min={OJT_START_DATE}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
            <p className="mt-1 text-sm text-gray-500">Select any date from Feb 12, 2024 to today</p>
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
              placeholder="Add any notes about your day..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Log Time
          </button>
        </form>
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