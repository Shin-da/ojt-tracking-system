import { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';

const Progress = () => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
  
  const [weeklyEntry, setWeeklyEntry] = useState({
    weekStartDate: format(weekStart, 'yyyy-MM-dd'),
    company: 'Philippine National Police (PNP)',
    department: 'IT Department',
    supervisor: 'PCOL Roberto C. Domingo',
    weekNumber: 1,
    dailyEntries: [
      {
        day: 'Monday',
        date: format(addDays(weekStart, 0), 'yyyy-MM-dd'),
        tasksCompleted: 'Orientation and introduction to the workplace protocols. Setup workstation and received initial training on systems.',
        skillsLearned: 'Understanding of organizational structure and communication protocols. Introduction to their proprietary systems.',
        challenges: 'Adapting to the formal environment and understanding the hierarchy within the organization.',
        hoursLogged: 8
      },
      {
        day: 'Tuesday',
        date: format(addDays(weekStart, 1), 'yyyy-MM-dd'),
        tasksCompleted: 'Assisted in database maintenance. Shadowed IT personnel during hardware troubleshooting.',
        skillsLearned: 'Basic database management skills. Hands-on experience with hardware diagnostics and troubleshooting.',
        challenges: 'Understanding the complex database structure and security protocols in place.',
        hoursLogged: 8
      },
      {
        day: 'Wednesday',
        date: format(addDays(weekStart, 2), 'yyyy-MM-dd'),
        tasksCompleted: 'Started learning the documentation process for IT assets. Observed network maintenance procedures.',
        skillsLearned: 'Document management systems and IT asset tracking protocols. Basic network diagnostics and monitoring.',
        challenges: 'Complexity of the documentation requirements and security clearance needed for certain tasks.',
        hoursLogged: 8
      },
      {
        day: 'Thursday',
        date: format(addDays(weekStart, 3), 'yyyy-MM-dd'),
        tasksCompleted: 'Participated in a cybersecurity briefing. Assisted in updating software across multiple workstations.',
        skillsLearned: 'Cybersecurity best practices in a government setting. Software deployment and update procedures.',
        challenges: 'Keeping up with the technical terminology in the cybersecurity briefing.',
        hoursLogged: 8
      },
      {
        day: 'Friday',
        date: format(addDays(weekStart, 4), 'yyyy-MM-dd'),
        tasksCompleted: 'Created weekly reports. Assisted in data backup procedures. Participated in team meeting.',
        skillsLearned: 'Report writing standards. Data backup and recovery protocols. Professional communication in meetings.',
        challenges: 'Ensuring accuracy in reports and following exact backup procedures.',
        hoursLogged: 8
      }
    ],
    weeklyReflection: 'This first week at the Philippine National Police IT Department has been both challenging and rewarding. I\'ve gained valuable insights into how IT systems support law enforcement operations, especially the importance of security and data integrity. The formal structure of the organization required some adjustment, but the team has been supportive in helping me understand protocols. I look forward to deeper involvement in projects in the coming weeks.',
    learningOutcomes: 'Technical skills: Basic database management, hardware troubleshooting, network monitoring, and software deployment.\nSoft skills: Professional communication, adapting to organizational culture, following detailed protocols, and time management.',
    goalsForNextWeek: 'Get more hands-on experience with their network security systems. Learn more about the custom applications used by the department. Improve documentation skills for IT processes.',
    supervisorFeedback: ''
  });

  const handleDailyEntryChange = (index, field, value) => {
    const updatedEntries = [...weeklyEntry.dailyEntries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: value
    };
    
    setWeeklyEntry({
      ...weeklyEntry,
      dailyEntries: updatedEntries
    });
  };

  const handleWeeklyEntryChange = (field, value) => {
    setWeeklyEntry({
      ...weeklyEntry,
      [field]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement weekly journal submission
    console.log(weeklyEntry);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Weekly Journal - Week {weeklyEntry.weekNumber}</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Week Starting</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={weeklyEntry.weekStartDate}
                onChange={(e) => handleWeeklyEntryChange('weekStartDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Week Number</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={weeklyEntry.weekNumber}
                onChange={(e) => handleWeeklyEntryChange('weekNumber', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={weeklyEntry.company}
                onChange={(e) => handleWeeklyEntryChange('company', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={weeklyEntry.department}
                onChange={(e) => handleWeeklyEntryChange('department', e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Supervisor</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={weeklyEntry.supervisor}
                onChange={(e) => handleWeeklyEntryChange('supervisor', e.target.value)}
              />
            </div>
          </div>
          
          {/* Daily Entries */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">Daily Activities</h2>
            
            {weeklyEntry.dailyEntries.map((entry, index) => (
              <div key={entry.day} className="border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-gray-700 mb-3">{entry.day} - {entry.date}</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tasks Completed</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                      value={entry.tasksCompleted}
                      onChange={(e) => handleDailyEntryChange(index, 'tasksCompleted', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Skills Learned</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                      value={entry.skillsLearned}
                      onChange={(e) => handleDailyEntryChange(index, 'skillsLearned', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Challenges Faced</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                      value={entry.challenges}
                      onChange={(e) => handleDailyEntryChange(index, 'challenges', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hours Logged</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={entry.hoursLogged}
                      onChange={(e) => handleDailyEntryChange(index, 'hoursLogged', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Weekly Reflection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Weekly Reflection</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Overall Reflection</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                  value={weeklyEntry.weeklyReflection}
                  onChange={(e) => handleWeeklyEntryChange('weeklyReflection', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Learning Outcomes</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  value={weeklyEntry.learningOutcomes}
                  onChange={(e) => handleWeeklyEntryChange('learningOutcomes', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Goals for Next Week</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  value={weeklyEntry.goalsForNextWeek}
                  onChange={(e) => handleWeeklyEntryChange('goalsForNextWeek', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Supervisor Feedback</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  value={weeklyEntry.supervisorFeedback}
                  onChange={(e) => handleWeeklyEntryChange('supervisorFeedback', e.target.value)}
                  placeholder="To be filled by supervisor"
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Weekly Journal
          </button>
        </form>
      </div>
    </div>
  );
};

export default Progress; 