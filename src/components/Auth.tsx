import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserCheck } from 'lucide-react';
import { useAuth, type UserRole } from '../contexts/AuthContext';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('reviewer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login
        const response = await axios.post(
          `${API_BACKEND_URL}/api/auth/${userRole}/login`,
          {
            email: formData.email,
            password: formData.password,
          }
        );

        // Check if response has an error code (backend returns 200 with error in body)
        if (response.data.code && response.data.code !== 200) {
          setError(response.data.msg || 'Login failed');
          setLoading(false);
          return;
        }

        // Extract token from the response structure
        const token = response.data.accessToken;
        const userId = response.data.user?.uniqueId || response.data.userId;
        const userName = response.data.user?.name || response.data.name;

        if (token) {
          console.log('Login successful, redirecting...');
          login({
            id: userId,
            email: formData.email,
            name: userName,
            role: userRole,
            token: token
          });
          
          // Navigate based on user role
          navigate(userRole === 'user' ? '/author' : '/reviewer');
        } else {
          setError('Login successful but missing token in response');
          console.error('Full response structure:', JSON.stringify(response.data, null, 2));
        }
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          `${API_BACKEND_URL}/api/auth/${userRole}/register`,
          {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }
        );

        // Check if response has an error code (backend returns 200 with error in body)
        if (response.data.code && response.data.code !== 200) {
          setError(response.data.msg || 'Registration failed');
          setLoading(false);
          return;
        }

        // Extract token from the response structure
        const token = response.data.token;
        const userId = response.data.user?.id || response.data.userId;

        if (token) {
          console.log('Registration successful, redirecting...');
          login({
            id: userId,
            email: formData.email,
            name: formData.name,
            role: userRole,
            token: token
          });
          
          // Navigate based on user role
          navigate(userRole === 'user' ? '/author' : '/reviewer');
        } else {
          setError('Registration successful but missing token in response');
          console.error('Full response structure:', JSON.stringify(response.data, null, 2));
        }
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'An error occurred';
      setError(errorMessage);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Paper Portal</h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setUserRole('reviewer');
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg border transition ${
                  userRole === 'reviewer'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserCheck className="mr-2" size={16} />
                Reviewer
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRole('user');
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg border transition ${
                  userRole === 'user'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="mr-2" size={16} />
                Author
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {/* Toggle Auth Mode */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
