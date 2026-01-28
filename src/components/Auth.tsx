import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, UserCheck, User, Eye, EyeOff } from 'lucide-react';
import { useAuth, type UserRole } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('reviewer');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Handle Google OAuth callback: backend redirects to /auth?type=callback&email=...&googleId=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');

    if (type !== 'callback') return;

    const email = params.get('email');
    const googleId = params.get('googleId');
    const callbackError = params.get('error');

    if (callbackError) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    if (!email || !googleId) {
      setError('Missing Google login data. Please try signing in again.');
      return;
    }

    const completeGoogleLogin = async () => {
      setLoading(true);
      try {
        await axios.post(
          `${API_BACKEND_URL}/api/auth/user/ppp/login-google`,
          { email, googleId }
        );
        await fetchProfile('user');
        navigate('/author', { replace: true });
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Google login failed. Please try again.';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    void completeGoogleLogin();
  }, [location.search, fetchProfile, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BACKEND_URL}/api/auth/user/ppp/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BACKEND_URL}/api/auth/${userRole}/login`,
        {
          email: formData.email,
          password: formData.password,
        }
      );

      if (response.data.code && response.data.code !== 200) {
        setError(response.data.msg || 'Login failed');
        setLoading(false);
        return;
      }

      await fetchProfile(userRole);
      navigate(userRole === 'user' ? '/author' : '/reviewer');
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3366ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col space-y-6">
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 border-b-0">
          <div className="relative flex bg-gray-100 rounded-xl p-1">
            {/* Animated Background Slider */}
            <div
              className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
              style={{
                left: userRole === 'reviewer' ? '0.25rem' : '50%',
                right: userRole === 'reviewer' ? '50%' : '0.25rem',
              }}
            />
            
            {/* Reviewer Tab */}
            <button
              type="button"
              onClick={() => {
                setUserRole('reviewer');
                setError(null);
              }}
              className={`relative flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors duration-300 z-10 ${
                userRole === 'reviewer'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="mr-2" size={20} />
              Reviewer
            </button>
            
            {/* Author Tab */}
            <button
              type="button"
              onClick={() => {
                setUserRole('user');
                setError(null);
              }}
              className={`relative flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors duration-300 z-10 ${
                userRole === 'user'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="mr-2" size={20} />
              Author
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Paper Portal</h1>
            <p className="text-gray-600">Research Paper Review & Collaboration</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Google Login for Authors Only */}
            {userRole === 'user' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition font-medium flex items-center justify-center space-x-2 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-gray-700">Sign in with Google</span>
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
