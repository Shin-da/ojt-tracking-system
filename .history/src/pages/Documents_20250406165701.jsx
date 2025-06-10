import { useState } from 'react';

const Documents = () => {
  const [document, setDocument] = useState({
    name: '',
    type: '',
    dueDate: '',
    status: 'pending'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement document submission
    console.log(document);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDocument(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Document Name</label>
            <input
              type="text"
              name="name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={document.name}
              onChange={handleChange}
              placeholder="Enter document name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Document Type</label>
            <select
              name="type"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={document.type}
              onChange={handleChange}
              required
            >
              <option value="">Select document type</option>
              <option value="timesheet">Timesheet</option>
              <option value="evaluation">Evaluation Form</option>
              <option value="certificate">Certificate</option>
              <option value="report">Progress Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              name="dueDate"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={document.dueDate}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={document.status}
              onChange={handleChange}
              required
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Document</label>
            <input
              type="file"
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Document
          </button>
        </form>
      </div>

      {/* Documents List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Document List</h2>
        <div className="space-y-4">
          <p className="text-gray-600">No documents added yet</p>
        </div>
      </div>
    </div>
  );
};

export default Documents; 