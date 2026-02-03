import React from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

function App() {
  const { user, loading, logout } = useAuth();

  // Loading agora é gerenciado pelo contexto, mas podemos ter um fallback visual aqui se quiser
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {user ? (
        <HomePage 
            user={user} 
            initialLevel={user.currentBattery} 
            onLogout={logout} 
        />
      ) : (
        <LoginPage />
      )}
    </div>
  );
}

export default App;