import { useState, useEffect, useRef } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachDayOfInterval, isSameMonth, differenceInWeeks, addWeeks } from 'date-fns';
import { FaCalendarAlt, FaDownload, FaChartBar } from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const API_URL = 'http://localhost/OJT%20TRACKER/api';

const Reports = () => {
  const [timeData, setTimeData] = useState({
    weekly: [],
    monthly: []
  });
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const weeklyChartRef = useRef(null);
  const monthlyChartRef = useRef(null);
  const weeklyChartInstance = useRef(null);
  const monthlyChartInstance = useRef(null);

  useEffect(() => {
    fetchTimeData();
  }, [selectedDate, viewMode]);

  useEffect(() => {
    if (viewMode === 'weekly' && timeData.weekly.length > 0) {
      renderWeeklyChart();
    } else if (viewMode === 'monthly' && timeData.monthly.length > 0) {
      renderMonthlyChart();
    }
  }, [timeData, viewMode]);

  const fetchTimeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine date range based on view mode
      let startDate, endDate;
      
      if (viewMode === 'weekly') {
        startDate = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        endDate = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      }

      // Fetch time logs
      const response = await fetch(`${API_URL}/time_logs/index.php?start_date=${startDate}&end_date=${endDate}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Process data for weekly view
      const weeklyData = processWeeklyData(data.data, selectedDate);
      
      // Process data for monthly view
      const monthlyData = processMonthlyData(data.data, selectedDate);

      setTimeData({
        weekly: weeklyData,
        monthly: monthlyData
      });
    } catch (err) {
      setError(`Failed to load report data: ${err.message}`);
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (logs, date) => {
    const startOfWeekDate = startOfWeek(date, { weekStartsOn: 1 });
    const endOfWeekDate = endOfWeek(date, { weekStartsOn: 1 });
    
    // Create array for each day of the week
    const daysOfWeek = eachDayOfInterval({
      start: startOfWeekDate,
      end: endOfWeekDate
    });

    // Map logs to days
    return daysOfWeek.map(day => {
      const dayLogs = logs.filter(log => {
        const logDate = parseISO(log.date);
        return format(logDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      const totalHours = dayLogs.reduce((sum, log) => 
        sum + parseFloat(log.hours_worked), 0);

      return {
        date: day,
        formattedDate: format(day, 'EEE, MMM d'),
        logs: dayLogs,
        totalHours: totalHours,
        hasData: dayLogs.length > 0
      };
    });
  };

  const processMonthlyData = (logs, date) => {
    const startOfMonthDate = startOfMonth(date);
    const endOfMonthDate = endOfMonth(date);

    // Create array for each week of the month
    const weeksOfMonth = eachWeekOfInterval(
      {
        start: startOfMonthDate,
        end: endOfMonthDate
      },
      { weekStartsOn: 1 }
    );

    // Map logs to weeks
    return weeksOfMonth.map((weekStart, index) => {
      const weekEnd = addWeeks(weekStart, 1);
      weekEnd.setDate(weekEnd.getDate() - 1);

      const weekLogs = logs.filter(log => {
        const logDate = parseISO(log.date);
        return logDate >= weekStart && logDate <= weekEnd && isSameMonth(logDate, date);
      });

      const totalHours = weekLogs.reduce((sum, log) => 
        sum + parseFloat(log.hours_worked), 0);

      const weekNumber = differenceInWeeks(weekStart, startOfMonthDate) + 1;

      return {
        startDate: weekStart,
        endDate: weekEnd,
        formattedPeriod: `Week ${weekNumber} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`,
        logs: weekLogs,
        totalHours: totalHours,
        hasData: weekLogs.length > 0
      };
    }).filter(week => week.hasData || isSameMonth(week.startDate, date));
  };

  const renderWeeklyChart = () => {
    const ctx = weeklyChartRef.current.getContext('2d');

    // Destroy previous chart if it exists
    if (weeklyChartInstance.current) {
      weeklyChartInstance.current.destroy();
    }

    // Create new chart
    weeklyChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: timeData.weekly.map(day => day.formattedDate),
        datasets: [{
          label: 'Hours Worked',
          data: timeData.weekly.map(day => day.totalHours),
          backgroundColor: timeData.weekly.map(day => 
            day.hasData ? 'rgba(54, 162, 235, 0.8)' : 'rgba(220, 220, 220, 0.5)'
          ),
          borderColor: timeData.weekly.map(day => 
            day.hasData ? 'rgba(54, 162, 235, 1)' : 'rgba(220, 220, 220, 1)'
          ),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            },
            ticks: {
              stepSize: 2
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const dayIndex = context.dataIndex;
                const logs = timeData.weekly[dayIndex].logs;
                if (logs.length === 0) return 'No time logs';
                
                return logs.map(log => 
                  `${log.time_in} - ${log.time_out} (${log.hours_worked} hrs)`
                );
              }
            }
          }
        }
      }
    });
  };

  const renderMonthlyChart = () => {
    const ctx = monthlyChartRef.current.getContext('2d');

    // Destroy previous chart if it exists
    if (monthlyChartInstance.current) {
      monthlyChartInstance.current.destroy();
    }

    // Create new chart
    monthlyChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: timeData.monthly.map(week => 
          week.formattedPeriod
        ),
        datasets: [{
          label: 'Hours per Week',
          data: timeData.monthly.map(week => week.totalHours),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const weekIndex = context.dataIndex;
                const numDays = timeData.monthly[weekIndex].logs.length;
                return [`${numDays} day(s) with time logs`, 
                        `Average: ${(timeData.monthly[weekIndex].totalHours / Math.max(numDays, 1)).toFixed(1)} hrs/day`];
              }
            }
          }
        }
      }
    });
  };

  const exportWeeklyReport = () => {
    if (timeData.weekly.length === 0) return;
    
    const startDate = format(timeData.weekly[0].date, 'yyyy-MM-dd');
    const endDate = format(timeData.weekly[timeData.weekly.length - 1].date, 'yyyy-MM-dd');
    const filename = `OJT_Weekly_Report_${startDate}_to_${endDate}.csv`;
    
    let csvContent = "Date,Day,Time In,Time Out,Hours Worked,Notes\n";
    
    timeData.weekly.forEach(day => {
      if (day.logs.length === 0) {
        csvContent += `${format(day.date, 'yyyy-MM-dd')},${format(day.date, 'EEEE')},No time logs recorded,,,\n`;
      } else {
        day.logs.forEach(log => {
          csvContent += `${log.date},${format(parseISO(log.date), 'EEEE')},${log.time_in},${log.time_out},${log.hours_worked},"${log.notes || ''}"\n`;
        });
      }
    });
    
    downloadCSV(csvContent, filename);
  };
  
  const exportMonthlyReport = () => {
    if (timeData.monthly.length === 0) return;
    
    const monthName = format(selectedDate, 'MMMM_yyyy');
    const filename = `OJT_Monthly_Report_${monthName}.csv`;
    
    let csvContent = "Week,Date,Time In,Time Out,Hours Worked,Notes\n";
    
    timeData.monthly.forEach(week => {
      const weekLabel = week.formattedPeriod;
      if (week.logs.length === 0) {
        csvContent += `${weekLabel},No time logs recorded,,,\n`;
      } else {
        week.logs.forEach(log => {
          csvContent += `"${weekLabel}",${log.date},${log.time_in},${log.time_out},${log.hours_worked},"${log.notes || ''}"\n`;
        });
      }
    });
    
    downloadCSV(csvContent, filename);
  };
  
  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  const navigatePrevious = () => {
    if (viewMode === 'weekly') {
      setSelectedDate(prevDate => {
        const prevWeek = new Date(prevDate);
        prevWeek.setDate(prevWeek.getDate() - 7);
        return prevWeek;
      });
    } else {
      setSelectedDate(prevDate => {
        const prevMonth = new Date(prevDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        return prevMonth;
      });
    }
  };

  const navigateNext = () => {
    // Don't allow navigating to future weeks/months
    const today = new Date();
    
    if (viewMode === 'weekly') {
      const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      
      if (nextWeekStart <= today) {
        setSelectedDate(nextWeekStart);
      }
    } else {
      const currentMonthStart = startOfMonth(selectedDate);
      const nextMonthStart = new Date(currentMonthStart);
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
      
      if (nextMonthStart <= today) {
        setSelectedDate(nextMonthStart);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">OJT Reports</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Report Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 md:mb-0">
            <span className="flex items-center">
              <FaChartBar className="mr-2 text-blue-600" />
              {viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Report
            </span>
          </h2>
          
          <div className="flex items-center space-x-2">
            <select 
              className="bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="weekly">Weekly View</option>
              <option value="monthly">Monthly View</option>
            </select>
            
            <button
              className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
              onClick={viewMode === 'weekly' ? exportWeeklyReport : exportMonthlyReport}
            >
              <FaDownload className="mr-1" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex justify-between items-center mb-6 mt-4 bg-gray-50 p-3 rounded-lg">
          <button 
            className="text-gray-600 hover:text-gray-800 px-3 py-1"
            onClick={navigatePrevious}
          >
            &larr; Previous
          </button>
          
          <div className="flex items-center">
            <FaCalendarAlt className="text-gray-500 mr-2" />
            <div className="relative">
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="opacity-0 absolute inset-0 w-full cursor-pointer"
              />
              <span className="text-gray-800 font-medium">
                {viewMode === 'weekly' 
                  ? `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}` 
                  : format(selectedDate, 'MMMM yyyy')}
              </span>
            </div>
          </div>
          
          <button 
            className="text-gray-600 hover:text-gray-800 px-3 py-1"
            onClick={navigateNext}
          >
            Next &rarr;
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Loading report data...</p>
          </div>
        ) : (
          <div>
            {/* Weekly Report View */}
            {viewMode === 'weekly' && (
              <div className={viewMode === 'weekly' ? 'block' : 'hidden'}>
                <div className="mb-6">
                  <canvas ref={weeklyChartRef} height="200"></canvas>
                </div>
                
                <div className="space-y-2 mt-6">
                  <h3 className="font-medium text-gray-700">Daily Details</h3>
                  {timeData.weekly.map((day, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 ${day.hasData ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{day.formattedDate}</p>
                          <p className="text-sm text-gray-500">{format(day.date, 'EEEE')}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${day.hasData ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                          {day.totalHours > 0 ? `${day.totalHours.toFixed(1)} hrs` : 'No time logged'}
                        </div>
                      </div>
                      
                      {day.hasData && (
                        <div className="mt-2 space-y-2">
                          {day.logs.map((log, logIndex) => (
                            <div key={logIndex} className="text-sm text-gray-600 pl-3 border-l-2 border-blue-200">
                              <p>{log.time_in} - {log.time_out} ({log.hours_worked} hrs)</p>
                              {log.notes && <p className="text-gray-500 italic mt-1">{log.notes}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Report View */}
            {viewMode === 'monthly' && (
              <div className={viewMode === 'monthly' ? 'block' : 'hidden'}>
                <div className="mb-6">
                  <canvas ref={monthlyChartRef} height="200"></canvas>
                </div>
                
                <div className="space-y-4 mt-6">
                  <h3 className="font-medium text-gray-700">Weekly Details</h3>
                  {timeData.monthly.length === 0 ? (
                    <div className="text-center p-10 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-600">No time logs recorded this month</p>
                    </div>
                  ) : (
                    timeData.monthly.map((week, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{week.formattedPeriod}</p>
                            <p className="text-sm text-gray-500">
                              {week.logs.length} day{week.logs.length !== 1 ? 's' : ''} with time logs
                            </p>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            {week.totalHours.toFixed(1)} hrs
                          </div>
                        </div>
                        
                        {week.logs.length > 0 && (
                          <div className="divide-y divide-gray-100">
                            {week.logs.map((log, logIndex) => (
                              <div key={logIndex} className="p-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{format(parseISO(log.date), 'EEE, MMM d')}</p>
                                    <p className="text-sm text-gray-600">
                                      {log.time_in} - {log.time_out} ({log.hours_worked} hrs)
                                    </p>
                                  </div>
                                </div>
                                {log.notes && (
                                  <p className="mt-2 text-sm text-gray-500 italic">{log.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 