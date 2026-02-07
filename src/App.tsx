import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Auth from './components/Auth';
import ReviewerDashboard from './pages/ReviewerDashboard';
import AuthorDashboard from './pages/AuthorDashboard';
import CreateTeam from './pages/CreateTeam';

const toastConfig = {
  className: '',
  duration: 5000,
  style: {
    background: '#ffffff',
    color: '#363636',
  },

  success: {
    duration: 3000,
    theme: {
      primary: 'green',
      secondary: 'black',
    },
    iconTheme: {
      primary: '#10B981',
      secondary: '#FFFFFF',
    },
    style: {
      border: '1px solid #10B981',
    }
  },
  error: {
    iconTheme: {
      primary: '#EF4444',
      secondary: '#FFFFFF',
    },
    style: {
      border: '1px solid #EF4444',
    }
  },
}

function AppContent() {
  const { logout, isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={toastConfig}
      />
      <Routes>
        {/*<Route path="/auth" element={isAuthenticated ? <Navigate to={user?.role === 'reviewer' ? '/reviewer' : '/author'} /> : <Auth />} />*/}
        <Route path="/auth" element={isAuthenticated ? <Navigate to={user?.role === 'reviewer' ? '/reviewer' : '/author'} /> : <Auth />} />

        <Route
          path="/reviewer"
          element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewerDashboard onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/author"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <AuthorDashboard onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-team"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <CreateTeam />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/paper">
        <AppContent />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;