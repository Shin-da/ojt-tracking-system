import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { FaPlus, FaTrash, FaEdit, FaCheck } from 'react-icons/fa';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'pending',
    priority: 'medium'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tasks/index.php`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.data);
      } else {
        setError(data.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      setError('An error occurred while fetching tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/tasks/index.php`, {
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
          title: '',
          description: '',
          due_date: '',
          status: 'pending',
          priority: 'medium'
        });
        fetchTasks();
      } else {
        setError(data.message || 'Failed to add task');
      }
    } catch (err) {
      setError('An error occurred while adding task');
      console.error('Error adding task:', err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/tasks/index.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id,
          status: newStatus
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTasks();
      } else {
        setError(data.message || 'Failed to update task status');
      }
    } catch (err) {
      setError('An error occurred while updating task status');
      console.error('Error updating task status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`${API_URL}/tasks/index.php?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTasks();
      } else {
        setError(data.message || 'Failed to delete task');
      }
    } catch (err) {
      setError('An error occurred while deleting task');
      console.error('Error deleting task:', err);
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
        <h1 className="text-2xl font-bold text-[#412F26]">Tasks</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-[#6A6F4C] text-white rounded-lg hover:bg-[#5D2510] transition-colors"
        >
          <FaPlus className="mr-2" />
          Add Task
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg shadow p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-[#412F26]">{task.title}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                  className={`p-2 rounded-full ${
                    task.status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <FaCheck />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-2 rounded-full bg-red-100 text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <p className="text-gray-600">{task.description}</p>
            <div className="flex justify-between items-center text-sm">
              <span className={`px-2 py-1 rounded-full ${
                task.priority === 'high'
                  ? 'bg-red-100 text-red-600'
                  : task.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-green-100 text-green-600'
              }`}>
                {task.priority}
              </span>
              <span className="text-gray-500">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6A6F4C] focus:ring-[#6A6F4C]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
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
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks; 