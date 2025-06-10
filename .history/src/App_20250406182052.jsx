import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TimeLog from './pages/TimeLog';
import Progress from './pages/Progress';
import Documents from './pages/Documents';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/time-log" element={<TimeLog />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 