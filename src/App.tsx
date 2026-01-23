import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Auth from './components/Auth';
import ReviewerDashboard from './pages/ReviewerDashboard';
import AuthorDashboard from './pages/AuthorDashboard';

function AppContent() {
  const { logout, isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />} 
      />
      <Route 
        path="/reviewer/*" 
        element={
          <ProtectedRoute requiredRole="reviewer">
            <ReviewerDashboard onLogout={logout} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/author/*" 
        element={
          <ProtectedRoute requiredRole="user">
            <AuthorDashboard onLogout={logout} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to={user?.role === 'user' ? '/author' : '/reviewer'} replace /> : 
            <Navigate to="/auth" replace />
        } 
      />
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;