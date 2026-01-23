import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { LogOut, User as UserIcon, Mail, Phone, Building2, GraduationCap } from 'lucide-react';
import { useAuth, type UserRole } from '../contexts/AuthContext';

axios.defaults.withCredentials = true;

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL || '';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: number;
  profilePhoto?: string;
}

interface ReviewerProfile {
  reviewerName: string;
  email: string;
}

interface ProfileMenuProps {
  role: UserRole;
  onLogout: () => void;
}

export default function ProfileMenu({ role, onLogout }: ProfileMenuProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | ReviewerProfile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!API_BACKEND_URL) return;
      try {
        const endpoint =
          role === 'reviewer'
            ? `${API_BACKEND_URL}/api/auth/reviewer/status`
            : `${API_BACKEND_URL}/api/auth/user/profile`;
        const { data } = await axios.get(endpoint);

        if (role === 'reviewer' && data?.reviewer) {
          setProfile({
            reviewerName: data.reviewer.reviewerName,
            email: data.reviewer.email,
          });
        } else if (data?.user) {
          setProfile({
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            college: data.user.college,
            department: data.user.department,
            year: data.user.year,
            profilePhoto: data.user.profilePhoto,
          });
        }
      } catch (err) {
        console.error('Profile fetch failed', err);
      }
    };

    fetchProfile();
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isUserProfile = (p: UserProfile | ReviewerProfile | null): p is UserProfile => {
    return p !== null && 'name' in p;
  };

  const displayName = profile ? (isUserProfile(profile) ? profile.name : profile.reviewerName) : user?.name || 'User';
  const displayEmail = profile?.email || user?.email || 'Not available';
  const initial = displayName.trim().charAt(0).toUpperCase();
  const profilePhoto = isUserProfile(profile) ? profile.profilePhoto : undefined;

  const handleLogout = async () => {
    try {
      if (API_BACKEND_URL) {
        const endpoint =
          role === 'reviewer'
            ? `${API_BACKEND_URL}/inf/api/auth/reviewer/logout`
            : `${API_BACKEND_URL}/inf/api/auth/user/logout`;
        await axios.post(endpoint);
      }
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      onLogout();
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700 transition overflow-hidden"
        aria-label="Profile menu"
      >
        {profilePhoto ? (
          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold">{initial}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-3 z-20">
          <div className="px-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center overflow-hidden flex-shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold">{initial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
              </div>
            </div>
            {isUserProfile(profile) && (
              <div className="space-y-2 text-xs text-gray-600">
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-gray-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.department && (
                  <div className="flex items-center gap-2">
                    <GraduationCap size={12} className="text-gray-400" />
                    <span>{profile.department} {profile.year ? `- Year ${profile.year}` : ''}</span>
                  </div>
                )}
                {profile.college && (
                  <div className="flex items-start gap-2">
                    <Building2 size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{profile.college}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
