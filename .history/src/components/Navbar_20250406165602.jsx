import { Link } from 'react-router-dom';
import { FaHome, FaClock, FaBook, FaFileAlt } from 'react-icons/fa';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-4">
            <Link to="/" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              <FaHome className="mr-2" />
              Dashboard
            </Link>
            <Link to="/time-log" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              <FaClock className="mr-2" />
              Time Log
            </Link>
            <Link to="/progress" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              <FaBook className="mr-2" />
              Progress
            </Link>
            <Link to="/documents" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              <FaFileAlt className="mr-2" />
              Documents
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 