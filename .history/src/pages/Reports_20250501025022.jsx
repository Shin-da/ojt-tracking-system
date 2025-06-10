import { useState, useEffect, useRef } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachDayOfInterval, isSameMonth, differenceInWeeks, addWeeks, addBusinessDays, differenceInDays, isSameDay } from 'date-fns';
import { FaCalendarAlt, FaDownload, FaChartBar, FaFilePdf, FaFileExcel, FaPrint, FaExchangeAlt, FaInfoCircle, FaClock, FaChartLine, FaChartPie } from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { API_URL } from '../config';

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
  const [timeData, setTimeData] = useState({
    weekly: [],
    monthly: []
  });
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
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
  
  useEffect(() => {
    fetchTimeData();
    fetchSummaryStats();
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

  return (
    <div className="space-y-6 bg-[#EDEID2] p-6 min-h-screen">
      <h1 className="text-4xl font-bold text-[#412F26] flex items-center space-x-3 font-serif">
        <FaChartBar className="text-[#6A6F4C]" />
        <span>OJT Reports</span>
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {/* Summary Statistics Panel */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-[#412F26] font-serif">
            <FaInfoCircle className="mr-2 text-[#6A6F4C]" />
            OJT Progress Summary
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hours Progress */}
          <div className="bg-[#6A6F4C]/10 p-4 rounded-lg border border-[#6A6F4C]/20">
            <h3 className="text-sm font-medium text-[#806044]">Hours Progress</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-[#6A6F4C]">{summaryStats.total_hours.toFixed(1)}</p>
                <p className="text-xs text-[#806044]">of {summaryStats.required_hours} required hours</p>
              </div>
              <div className="text-lg font-semibold text-[#6A6F4C]">
                {summaryStats.progress_percentage.toFixed(1)}%
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3 mb-1">
              <div className="w-full bg-[#CBB89D]/20 rounded-full h-2.5">
                <div 
                  className="bg-[#6A6F4C] h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, summaryStats.progress_percentage)}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-[#806044] font-sans">
              {(summaryStats.required_hours - summaryStats.total_hours).toFixed(1)} hours remaining
            </p>
          </div>
          
          {/* Completion Estimate */}
          <div className="bg-[#6A6F4C]/10 p-4 rounded-lg border border-[#6A6F4C]/20">
            <h3 className="text-sm font-medium text-[#806044]">Completion Estimate</h3>
            <div>
              <p className="text-3xl font-bold text-[#6A6F4C]">
                {summaryStats.estimated_completion_days > 0 ? summaryStats.estimated_completion_days : '✓'}
              </p>
              <p className="text-xs text-[#806044]">
                {summaryStats.estimated_completion_days > 0 
                  ? 'working days until completion' 
                  : 'completed'}
              </p>
            </div>
            
            <div className="mt-3">
              <p className="text-sm font-medium">
                {summaryStats.estimated_completion_days > 0 
                  ? `Estimated completion: ${summaryStats.estimated_completion_date}` 
                  : 'Congratulations! You have completed your required hours.'}
              </p>
            </div>
          </div>
          
          {/* Averages & Goals */}
          <div className="bg-[#6A6F4C]/10 p-4 rounded-lg border border-[#6A6F4C]/20">
            <h3 className="text-sm font-medium text-[#806044]">Averages & Goals</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-lg font-bold text-[#412F26]">{summaryStats.daily_average.toFixed(1)}</p>
                <p className="text-xs text-[#806044]">hours/day average</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#412F26]">{summaryStats.total_days}</p>
                <p className="text-xs text-[#806044]">days logged</p>
              </div>
              {summaryStats.estimated_completion_days > 0 && (
                <>
                  <div>
                    <p className="text-lg font-bold text-[#412F26]">{summaryStats.weekly_average}</p>
                    <p className="text-xs text-[#806044]">hours/week needed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#412F26]">
                      {(summaryStats.required_hours - summaryStats.total_hours).toFixed(1)}
                    </p>
                    <p className="text-xs text-[#806044]">hours remaining</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-[#CBB89D]/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-2xl font-semibold text-[#412F26] mb-4 md:mb-0">
            <span className="flex items-center">
              <FaChartBar className="mr-2 text-[#6A6F4C]" />
              {viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Report
            </span>
          </h2>
          
          <div className="flex flex-wrap items-center gap-2 no-print">
            <select 
              className="bg-white border border-[#CBB89D]/20 rounded-md px-3 py-2 focus:outline-none focus:ring-[#6A6F4C] focus:border-[#6A6F4C]"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="weekly">Weekly View</option>
              <option value="monthly">Monthly View</option>
            </select>
            
            <div className="flex items-center space-x-1">
              <button
                className={`px-3 py-2 rounded-md border ${compareMode 
                  ? 'bg-[#6A6F4C]/10 text-[#6A6F4C] border-[#6A6F4C]/20' 
                  : 'bg-white text-[#806044] border-[#CBB89D]/20'}`}
                onClick={() => setCompareMode(!compareMode)}
                title={compareMode ? 'Disable comparison' : 'Compare with previous period'}
              >
                <FaExchangeAlt />
              </button>
              
              <button
                className="flex items-center bg-[#6A6F4C] text-white px-3 py-2 rounded-md hover:bg-[#806044]"
                onClick={() => {
                  const dateRangeText = viewMode === 'weekly' 
                    ? `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                    : format(selectedDate, 'MMMM yyyy');
                  
                  exportToPDF(timeData, viewMode, dateRangeText, summaryStats);
                }}
                title="Export to PDF"
              >
                <FaFilePdf className="mr-1" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              
              <button
                className="flex items-center bg-[#806044] text-white px-3 py-2 rounded-md hover:bg-[#6A6F4C]"
                onClick={viewMode === 'weekly' ? exportWeeklyReport : exportMonthlyReport}
                title="Export to CSV"
              >
                <FaFileExcel className="mr-1" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              
              <button
                className="flex items-center bg-[#412F26] text-white px-3 py-2 rounded-md hover:bg-[#806044]"
                onClick={() => window.print()}
                title="Print report"
              >
                <FaPrint className="mr-1" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex justify-between items-center mb-6 mt-4 bg-[#6A6F4C]/10 p-3 rounded-lg no-print">
          <button 
            className="text-[#806044] hover:text-[#412F26] px-3 py-1"
            onClick={navigatePrevious}
          >
            &larr; Previous
          </button>
          
          <div className="flex items-center">
            <FaCalendarAlt className="text-[#806044] mr-2" />
            <div className="relative">
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="opacity-0 absolute inset-0 w-full cursor-pointer"
              />
              <span className="text-[#412F26] font-medium">
                {viewMode === 'weekly' 
                  ? `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}` 
                  : format(selectedDate, 'MMMM yyyy')}
              </span>
            </div>
          </div>
          
          <button 
            className="text-[#806044] hover:text-[#412F26] px-3 py-1"
            onClick={navigateNext}
          >
            Next &rarr;
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-[#806044]">Loading report data...</p>
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
                  <h3 className="font-medium text-[#412F26]">Daily Details</h3>
                  {timeData.weekly.map((day, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 ${day.hasData ? 'bg-white' : 'bg-[#6A6F4C]/10'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-[#412F26]">{day.formattedDate}</p>
                          <p className="text-sm text-[#806044]">{format(day.date, 'EEEE')}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${day.hasData ? 'bg-[#6A6F4C]/20 text-[#6A6F4C]' : 'bg-[#CBB89D]/20 text-[#806044]'}`}>
                          {day.totalHours > 0 ? `${day.totalHours.toFixed(1)} hrs` : 'No time logged'}
                        </div>
                      </div>
                      
                      {day.hasData && (
                        <div className="mt-2 space-y-2">
                          {day.logs.map((log, logIndex) => (
                            <div key={logIndex} className="text-sm text-[#806044] pl-3 border-l-2 border-[#6A6F4C]/20">
                              <p>{log.time_in} - {log.time_out} ({log.hours_worked} hrs)</p>
                              {log.notes && <p className="text-[#806044] italic mt-1">{log.notes}</p>}
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
                  <h3 className="font-medium text-[#412F26]">Weekly Details</h3>
                  {timeData.monthly.length === 0 ? (
                    <div className="text-center p-10 bg-[#6A6F4C]/10 rounded-lg border border-[#6A6F4C]/20">
                      <p className="text-[#806044]">No time logs recorded this month</p>
                    </div>
                  ) : (
                    timeData.monthly.map((week, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="bg-[#6A6F4C]/10 p-4 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-[#412F26]">{week.formattedPeriod}</p>
                            <p className="text-sm text-[#806044]">
                              {week.logs.length} day{week.logs.length !== 1 ? 's' : ''} with time logs
                            </p>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-[#6A6F4C]/20 text-[#6A6F4C] text-sm font-medium">
                            {week.totalHours.toFixed(1)} hrs
                          </div>
                        </div>
                        
                        {week.logs.length > 0 && (
                          <div className="divide-y divide-[#CBB89D]/20">
                            {week.logs.map((log, logIndex) => (
                              <div key={logIndex} className="p-4 hover:bg-[#6A6F4C]/10">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-[#412F26]">{format(parseISO(log.date), 'EEE, MMM d')}</p>
                                    <p className="text-sm text-[#806044]">
                                      {log.time_in} - {log.time_out} ({log.hours_worked} hrs)
                                    </p>
                                  </div>
                                </div>
                                {log.notes && (
                                  <p className="mt-2 text-sm text-[#806044] italic">{log.notes}</p>
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

      {/* Add Heatmap Calendar view */}
      <div className="mt-6">
        <h3 className="font-medium text-[#412F26] mb-2">Hours Heatmap</h3>
        <div className="bg-white p-4 rounded-lg border border-[#CBB89D]/20">
          <CalendarHeatmap
            startDate={new Date(summaryStats.start_date)}
            endDate={new Date()}
            values={summaryStats.heatmap_data}
            classForValue={(value) => {
              if (!value || value.count === 0) {
                return 'color-empty';
              }
              
              // Define color scale based on hours
              if (value.count < 2) return 'color-scale-1';
              if (value.count < 4) return 'color-scale-2';
              if (value.count < 6) return 'color-scale-3';
              if (value.count < 8) return 'color-scale-4';
              return 'color-scale-5';
            }}
            titleForValue={(value) => {
              if (!value) return 'No time logged';
              return `${value.date}: ${value.count} hours`;
            }}
          />
          
          {/* Heatmap Legend */}
          <div className="flex justify-end items-center mt-2">
            <span className="text-xs text-[#806044] mr-2">Hours:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200"></div>
              <span className="text-xs text-[#806044]">0</span>
              
              <div className="w-3 h-3 bg-blue-100"></div>
              <span className="text-xs text-[#806044]">&lt;2</span>
              
              <div className="w-3 h-3 bg-blue-200"></div>
              <span className="text-xs text-[#806044]">&lt;4</span>
              
              <div className="w-3 h-3 bg-blue-300"></div>
              <span className="text-xs text-[#806044]">&lt;6</span>
              
              <div className="w-3 h-3 bg-blue-400"></div>
              <span className="text-xs text-[#806044]">&lt;8</span>
              
              <div className="w-3 h-3 bg-blue-600"></div>
              <span className="text-xs text-[#806044]">8+</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Compare Chart after the main charts */}
      {compareMode && (
        <div className="mt-6 mb-6">
          <h3 className="font-medium text-[#412F26] mb-2">Period Comparison</h3>
          <canvas ref={compareChartRef} height="200"></canvas>
        </div>
      )}

      {/* Add a print-only header that shows when printing */}
      <div className="hidden print:block mt-8 mb-6 text-center">
        <h1 className="text-xl font-bold">OJT Time Report</h1>
        <p>{viewMode === 'weekly' 
          ? `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}` 
          : format(selectedDate, 'MMMM yyyy')}</p>
        <p className="text-sm mt-1">Generated on {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>
    </div>
  );
};

export default Reports;