import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TimeLog from './pages/TimeLog';
import Progress from './pages/Progress';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Login from './pages/Login';

function App() {
  return (
    <Router basename="/OJT%20TRACKER/">
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="space-y-6">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/time-log"
                  element={
                    <ProtectedRoute>
                      <TimeLog />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute>
                      <Progress />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute>
                      <Documents />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 