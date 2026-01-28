
import ChatWindow from '../components/ChatWindow';
import ProfileMenu from '../components/ProfileMenu';
import { useAuth } from '../contexts/AuthContext';
import inficon from '../assests/InfinitumIcon.png';
import psgLogo from '../assests/PSGLogo.png';
interface ReviewerDashboardProps {
  onLogout: () => void;
}

export default function ReviewerDashboard({ onLogout }: ReviewerDashboardProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <img src={inficon} alt="Infinitum Logo" className="h-10 md:h-12 w-10 md:w-12" />
          <img  src={psgLogo} alt="Psg Logo" className="h-8 md:h-10 w-8 md:w-10" />
        </div>
        
        <h1 className="text-sm md:text-xl font-bold text-gray-900 flex-1 text-center truncate">
          Paper Presentation Portal
        </h1>
        
        {user && (
          <div className="flex-shrink-0">
            <ProfileMenu role={user.role} onLogout={onLogout} />
          </div>
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