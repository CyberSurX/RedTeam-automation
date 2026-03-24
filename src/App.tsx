import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Programs } from './pages/Programs';
import { Reconnaissance } from './pages/Reconnaissance';
import { Scanning } from './pages/Scanning';
import { Exploitation } from './pages/Exploitation';
import { Findings } from './pages/Findings';
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/programs" element={
              <ProtectedRoute>
                <Layout>
                  <Programs />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reconnaissance" element={
              <ProtectedRoute>
                <Layout>
                  <Reconnaissance />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/scanning" element={
              <ProtectedRoute>
                <Layout>
                  <Scanning />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/exploitation" element={
              <ProtectedRoute>
                <Layout>
                  <Exploitation />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/findings" element={
              <ProtectedRoute>
                <Layout>
                  <Findings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
