import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import History from './components/History';
import Reports from './components/Reports';
import EditProfile from './components/EditProfile';
import { supabase } from './lib/supabase';

function AppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    createDefaultUser();
  }, []);

  const createDefaultUser = async () => {
    try {
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email: 'juan@pertamina.com',
        password: '123456',
      });

      if (existingUser) {
        await supabase.auth.signOut();
      }
    } catch {
      try {
        await supabase.auth.signUp({
          email: 'juan@pertamina.com',
          password: '123456',
        });
        await supabase.auth.signOut();
      } catch (err) {
        console.log('Default user setup:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <img src="/image copy.png" alt="PERTAMINA LUBRICANTS" className="h-24 mx-auto mb-6 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return showRegister ? (
      <Register onToggleLogin={() => setShowRegister(false)} />
    ) : (
      <Login onToggleRegister={() => setShowRegister(true)} />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'scanner':
        return <Scanner />;
      case 'history':
        return <History />;
      case 'reports':
        return <Reports />;
      case 'edit-profile':
        return <EditProfile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
