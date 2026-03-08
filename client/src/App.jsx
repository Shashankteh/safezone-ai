import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SafetyProvider } from './context/SafetyContext';
import BottomNav from './components/Layout/BottomNav';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SOSPage from './pages/SOSPage';
import Admin from './pages/Admin';
import Contacts from './pages/Contacts';
import IncidentReport from './pages/IncidentReport';
import SafetyScorePage from './pages/SafetyScorePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#050d14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid rgba(0,255,136,0.2)',
        borderTop: '3px solid #00ff88',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
        Loading SafeZone...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// Shows bottom nav on all pages when logged in
const AppShell = ({ children }) => {
  const { user } = useContext(AuthContext);
  return (
    <div style={{ minHeight: '100vh', background: '#050d14' }}>
      {children}
      {user && <BottomNav />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SafetyProvider>
          <AppShell>
            <Routes>
              {/* Home: logged in users can visit, logged out too */}
              <Route path="/" element={<Home />} />

              {/* Auth routes — redirect to dashboard if already logged in */}
              <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
              <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/sos" element={<ProtectedRoute><SOSPage /></ProtectedRoute>} />
              <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
              <Route path="/incidents" element={<ProtectedRoute><IncidentReport /></ProtectedRoute>} />
              <Route path="/safety" element={<ProtectedRoute><SafetyScorePage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(10,22,40,0.97)',
                color: 'white',
                border: '1px solid rgba(0,255,136,0.25)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                borderRadius: '8px',
              },
              duration: 3000,
            }}
          />
        </SafetyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
