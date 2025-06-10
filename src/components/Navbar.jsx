import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaClock, FaBook, FaFileAlt, FaChartBar, FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
  };

  const NavLinks = () => (
    <>
      <Link 
        to="/" 
        className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
          isActive('/') 
            ? 'bg-[#5D2510]/80 text-[#CBB89D] shadow-lg' 
            : 'text-[#EDEDE2]/90 hover:bg-[#5D2510]/50 hover:text-[#EDEDE2]'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <FaHome className="mr-2" />
        Dashboard
      </Link>
      <Link 
        to="/time-log" 
        className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
          isActive('/time-log') 
            ? 'bg-[#5D2510]/80 text-[#CBB89D] shadow-lg' 
            : 'text-[#EDEDE2]/90 hover:bg-[#5D2510]/50 hover:text-[#EDEDE2]'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <FaClock className="mr-2" />
        Time Log
      </Link>
      <Link 
        to="/progress" 
        className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
          isActive('/progress') 
            ? 'bg-[#5D2510]/80 text-[#CBB89D] shadow-lg' 
            : 'text-[#EDEDE2]/90 hover:bg-[#5D2510]/50 hover:text-[#EDEDE2]'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <FaBook className="mr-2" />
        Progress
      </Link>
      <Link 
        to="/documents" 
        className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
          isActive('/documents') 
            ? 'bg-[#5D2510]/80 text-[#CBB89D] shadow-lg' 
            : 'text-[#EDEDE2]/90 hover:bg-[#5D2510]/50 hover:text-[#EDEDE2]'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <FaFileAlt className="mr-2" />
        Documents
      </Link>
      <Link 
        to="/reports" 
        className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
          isActive('/reports') 
            ? 'bg-[#5D2510]/80 text-[#CBB89D] shadow-lg' 
            : 'text-[#EDEDE2]/90 hover:bg-[#5D2510]/50 hover:text-[#EDEDE2]'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <FaChartBar className="mr-2" />
        Reports
      </Link>
    </>
  );

  return (
    <nav className="bg-[#412F26] shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-white text-xl font-bold">OJT Tracker</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <NavLinks />
            </div>
          </div>
          
          {/* User menu */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-[#CBB89D]">
                <FaUser className="mr-2" />
                <span>{user?.full_name || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-[#CBB89D] hover:text-white transition-colors duration-200"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#CBB89D] hover:text-white hover:bg-[#5D2510] focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <NavLinks />
          <div className="pt-4 pb-3 border-t border-[#5D2510]">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <FaUser className="h-8 w-8 text-[#CBB89D]" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {user?.full_name || 'User'}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-[#CBB89D] hover:text-white hover:bg-[#5D2510]"
              >
                <FaSignOutAlt className="inline-block mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 