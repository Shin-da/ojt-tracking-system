import { useState, useEffect, useRef } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachDayOfInterval, isSameMonth, differenceInWeeks, addWeeks, addBusinessDays, differenceInDays, isSameDay } from 'date-fns';
import { FaCalendarAlt, FaDownload, FaChartBar, FaFilePdf, FaFileExcel, FaPrint, FaExchangeAlt, FaInfoCircle, FaClock, FaChartLine, FaChartPie, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

// Register Chart.js components
Chart.register(...registerables);

// Add custom CSS for heatmap and print styles
const heatmapStyles = `
  .react-calendar-heatmap .color-empty { fill: #f3f4f6; }
  .react-calendar-heatmap .color-scale-1 { fill: #dbeafe; }
  .react-calendar-heatmap .color-scale-2 { fill: #bfdbfe; }
  .react-calendar-heatmap .color-scale-3 { fill: #93c5fd; }
  .react-calendar-heatmap .color-scale-4 { fill: #60a5fa; }
  .react-calendar-heatmap .color-scale-5 { fill: #2563eb; }
  
  @media print {
    body { background-color: white; }
    .shadow-md { box-shadow: none !important; }
    .no-print { display: none !important; }
    .page-break { page-break-after: always; }
    @page { margin: 2cm; }
  }
`;

const Reports = () => {
  const { user } = useAuth();
  const [timeData, setTimeData] = useState({
    weekly: [],
    monthly: []
  });
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    total_hours: 0,
    total_days: 0,
    required_hours: 500,
    progress_percentage: 0,
    daily_average: 0,
    estimated_completion_days: 0,
    estimated_completion_date: '',
    weekly_average: 0,
    heatmap_data: []
  });
  
  const weeklyChartRef = useRef(null);
  const monthlyChartRef = useRef(null);
  const compareChartRef = useRef(null);
  const weeklyChartInstance = useRef(null);
  const monthlyChartInstance = useRef(null);
  const compareChartInstance = useRef(null);
  
  const [reports, setReports] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    content: ''
  });

  useEffect(() => {
    fetchTimeData();
    fetchSummaryStats();
    fetchReports();
  }, []);

  useEffect(() => {
    if (compareMode) {
      fetchCompareData();
    }
  }, [compareMode, selectedDate, viewMode]);

  useEffect(() => {
    if (viewMode === 'weekly' && timeData.weekly.length > 0) {
      renderWeeklyChart();
    } else if (viewMode === 'monthly' && timeData.monthly.length > 0) {
      renderMonthlyChart();
    }
    
    if (compareMode && compareData) {
      renderCompareChart();
    }
  }, [timeData, viewMode, compareMode, compareData]);

  useEffect(() => {
    // Add the custom styles to the document
    const styleElement = document.createElement('style');
    styleElement.textContent = heatmapStyles;
    document.head.appendChild(styleElement);
    
    // Clean up on component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  const fetchSummaryStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/time_logs/stats.php`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      // Calculate estimated completion date
      const remainingHours = Math.max(0, data.data.required_hours - data.data.total_hours);
      let estimatedDays = 0;
      let estimatedDate = 'Completed';
      let weeklyAvg = 0;
      
      if (remainingHours > 0 && data.data.daily_average > 0) {
        estimatedDays = Math.ceil(remainingHours / data.data.daily_average);
        const completionDate = addBusinessDays(new Date(), estimatedDays);
        estimatedDate = format(completionDate, 'MMMM d, yyyy');
        
        // Calculate weekly average needed
        const weeksNeeded = Math.ceil(estimatedDays / 5);
        weeklyAvg = Math.ceil(remainingHours / weeksNeeded);
      }
      
      // Process heatmap data
      const heatmapData = data.data.heatmap_data?.map(item => ({
        date: item.date,
        count: parseFloat(item.hours_worked)
      })) || [];
      
      setSummaryStats({
        ...data.data,
        estimated_completion_days: estimatedDays,
        estimated_completion_date: estimatedDate,
        weekly_average: weeklyAvg,
        heatmap_data: heatmapData
      });
    } catch (err) {
      setError(`Failed to load summary statistics: ${err.message}`);
      console.error('Error fetching summary stats:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Add the fetchCompareData function
  const fetchCompareData = async () => {
    try {
      // Determine compare date range based on view mode
      let compareStartDate, compareEndDate;
      
      if (viewMode === 'weekly') {
        // Get previous week
        const currentStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const previousWeekStart = new Date(currentStart);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);
        
        compareStartDate = format(previousWeekStart, 'yyyy-MM-dd');
        compareEndDate = format(endOfWeek(previousWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        // Get previous month
        const currentStart = startOfMonth(selectedDate);
        const previousMonthStart = new Date(currentStart);
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
        
        compareStartDate = format(previousMonthStart, 'yyyy-MM-dd');
        compareEndDate = format(endOfMonth(previousMonthStart), 'yyyy-MM-dd');
      }
      
      // Fetch compare data
      const response = await fetch(`${API_URL}/time_logs/index.php?start_date=${compareStartDate}&end_date=${compareEndDate}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      // Process data for comparison
      if (viewMode === 'weekly') {
        const weeklyData = processWeeklyData(data.data, new Date(compareStartDate));
        setCompareData({ weekly: weeklyData });
      } else {
        const monthlyData = processMonthlyData(data.data, new Date(compareStartDate));
        setCompareData({ monthly: monthlyData });
      }
    } catch (err) {
      console.error('Error fetching compare data:', err);
      setCompareData(null);
    }
  };
  
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

  const renderCompareChart = () => {
    const ctx = compareChartRef.current.getContext('2d');
    
    // Destroy previous chart if it exists
    if (compareChartInstance.current) {
      compareChartInstance.current.destroy();
    }
    
    let labels, currentData, compareData;
    let title;
    
    if (viewMode === 'weekly') {
      title = 'Weekly Comparison';
      labels = timeData.weekly.map(day => day.formattedDate);
      currentData = timeData.weekly.map(day => day.totalHours);
      compareData = compareData?.weekly 
        ? compareData.weekly.map(day => day.totalHours)
        : Array(labels.length).fill(0);
    } else {
      title = 'Monthly Comparison';
      labels = timeData.monthly.map(week => week.formattedPeriod);
      currentData = timeData.monthly.map(week => week.totalHours);
      compareData = compareData?.monthly 
        ? compareData.monthly.map(week => week.totalHours)
        : Array(labels.length).fill(0);
    }
    
    // Create new chart
    compareChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Current Period',
            data: currentData,
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Previous Period',
            data: compareData,
            backgroundColor: 'rgba(255, 159, 64, 0.8)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
          }
        ]
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
          title: {
            display: true,
            text: title
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

  // Add new PDF export functions
  const exportToPDF = (timeData, viewMode, dateRange, stats) => {
    const doc = new jsPDF();
    const title = viewMode === 'weekly' 
      ? `OJT Weekly Report (${dateRange})` 
      : `OJT Monthly Report (${dateRange})`;
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add summary
    doc.setFontSize(12);
    doc.text('Summary Statistics:', 14, 35);
    
    const summaryData = [
      ['Total Hours Logged:', `${stats.total_hours.toFixed(1)} hours`],
      ['Required Hours:', `${stats.required_hours} hours`],
      ['Progress:', `${stats.progress_percentage.toFixed(1)}%`],
      ['Daily Average:', `${stats.daily_average.toFixed(1)} hours/day`],
      ['Days Logged:', `${stats.total_days} days`]
    ];
    
    doc.autoTable({
      startY: 40,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 60 } }
    });
    
    // Add time log details
    if (viewMode === 'weekly') {
      const weeklyData = timeData.weekly.map(day => {
        return [
          format(day.date, 'EEE, MMM d, yyyy'),
          day.hasData ? `${day.totalHours.toFixed(1)} hours` : 'No logs',
          day.logs.map(log => `${log.time_in} - ${log.time_out}`).join('\n'),
          day.logs.map(log => log.notes || '').join('\n')
        ];
      });
      
      doc.text('Weekly Time Log Details:', 14, doc.autoTable.previous.finalY + 10);
      
      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 15,
        head: [['Date', 'Hours', 'Time Range', 'Notes']],
        body: weeklyData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 }
      });
    } else {
      // Monthly report
      const monthlyData = [];
      timeData.monthly.forEach(week => {
        monthlyData.push([`Week: ${week.formattedPeriod}`, `Total: ${week.totalHours.toFixed(1)} hours`, '', '']);
        
        week.logs.forEach(log => {
          monthlyData.push([
            format(parseISO(log.date), 'EEE, MMM d, yyyy'),
            `${log.hours_worked} hours`,
            `${log.time_in} - ${log.time_out}`,
            log.notes || ''
          ]);
        });
        
        // Add a spacer row between weeks
        monthlyData.push(['', '', '', '']);
      });
      
      doc.text('Monthly Time Log Details:', 14, doc.autoTable.previous.finalY + 10);
      
      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 15,
        head: [['Date', 'Hours', 'Time Range', 'Notes']],
        body: monthlyData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 }
      });
    }
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `OJT Tracker - Report generated on ${format(new Date(), 'MMM d, yyyy')}`,
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Save the PDF
    doc.save(`OJT_Report_${viewMode}_${dateRange.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/reports/index.php`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data);
      } else {
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('An error occurred while fetching reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/reports/index.php`, {
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
          content: ''
        });
        fetchReports();
      } else {
        setError(data.message || 'Failed to add report');
      }
    } catch (err) {
      setError('An error occurred while adding report');
      console.error('Error adding report:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const response = await fetch(`${API_URL}/reports/index.php?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchReports();
      } else {
        setError(data.message || 'Failed to delete report');
      }
    } catch (err) {
      setError('An error occurred while deleting report');
      console.error('Error deleting report:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6A6F4C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#412F26]">Reports</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-[#6A6F4C] text-white rounded-lg hover:bg-[#5D2510] transition-colors"
        >
          <FaPlus className="mr-2" />
          Add Report
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-[#412F26]">
                {new Date(report.date).toLocaleDateString()}
              </h3>
              <button
                onClick={() => handleDelete(report.id)}
                className="p-2 rounded-full bg-red-100 text-red-600"
              >
                <FaTrash />
              </button>
            </div>
            <div className="prose max-w-none">
              {report.content.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Add Report</h2>
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
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                  rows="10"
                  required
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
                  Add Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;