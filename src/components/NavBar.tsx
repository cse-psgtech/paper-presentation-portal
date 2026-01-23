import { Home, Settings, LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavBarProps {
  onLogout: () => void;
}

export default function NavBar({ onLogout }: NavBarProps) {
  const [userName, setUserName] = useState('Student');
  const userEmail = 'student@uni.edu';

  useEffect(() => {
    // You can fetch user info from your auth service or pass it as props
    const userId = localStorage.getItem('userId');
    // Set user name from local storage or API call if available
    if (userId) {
      setUserName(userId);
    }
  }, []);

  return (
    <nav className="h-full flex flex-col justify-between p-4 bg-gray-900 text-white">
      {/* Top: Logo & Nav */}
      <div className="space-y-6">
        <div className="text-xl font-bold tracking-wider text-blue-400">
          RESEARCH<span className="text-white">PORTAL</span>
        </div>
        
        <div className="space-y-2">
          <button className="flex items-center gap-3 w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <Home size={20} />
            <span>Dashboard</span>
          </button>
          <button className="flex items-center gap-3 w-full p-3 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white">
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Bottom: User & Logout */}
      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-gray-400">{userEmail}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}