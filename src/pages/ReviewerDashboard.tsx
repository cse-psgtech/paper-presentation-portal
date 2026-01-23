
import ChatWindow from '../components/ChatWindow';
import ProfileMenu from '../components/ProfileMenu';
import { useAuth } from '../contexts/AuthContext';

interface ReviewerDashboardProps {
  onLogout: () => void;
}

export default function ReviewerDashboard({ onLogout }: ReviewerDashboardProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-7">
          <img src="/InfinitumIcon.png" alt="Infinitum Logo" className="h-12 w-12" />
          <img src="/PSGLogo.png" alt="Psg Logo" className="h-10 w-10" />
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
          Paper Presentation Portal
        </h1>
        
        {user && (
          <ProfileMenu role={user.role} onLogout={onLogout} />
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-hidden w-full">
        <main className="h-full overflow-hidden w-full">
          <ChatWindow />
        </main>
      </div>
    </div>
  );
}