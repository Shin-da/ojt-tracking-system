import { useState } from 'react';
import { format } from 'date-fns';

const Progress = () => {
  const [entry, setEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    skills: '',
    challenges: '',
    achievements: '',
    reflection: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement progress entry submission
    console.log(entry);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Progress Tracker</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={entry.date}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Skills Learned</label>
            <textarea
              name="skills"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              value={entry.skills}
              onChange={handleChange}
              placeholder="List the skills you learned today..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Challenges Faced</label>
            <textarea
              name="challenges"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              value={entry.challenges}
              onChange={handleChange}
              placeholder="Describe any challenges you faced..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Achievements</label>
            <textarea
              name="achievements"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              value={entry.achievements}
              onChange={handleChange}
              placeholder="List your achievements for the day..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Daily Reflection</label>
            <textarea
              name="reflection"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              value={entry.reflection}
              onChange={handleChange}
              placeholder="Write your daily reflection..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Progress
          </button>
        </form>
      </div>

      {/* Progress History */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Progress History</h2>
        <div className="space-y-4">
          <p className="text-gray-600">No progress entries recorded yet</p>
        </div>
      </div>
    </div>
  );
};

export default Progress; 