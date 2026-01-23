import { MessageSquare, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type ChatRoom } from '../types/chat';
import ChatLoader from '../components/common/ChatLoader';

interface ChatRoomsListProps {
  chatRooms: ChatRoom[];
  loading: boolean;
  error: string | null;
  selectedChatRoomId: string | null;
  onSelectChatRoom: (chatRoomId: string) => void;
}

export default function ChatRoomsList({ 
  chatRooms, 
  loading, 
  error,
  selectedChatRoomId,
  onSelectChatRoom
}: ChatRoomsListProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChatRooms = chatRooms.filter(room =>
    room.paperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.paperId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <ChatLoader label="Loading chatrooms…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-600 mb-2">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-bold text-xl text-gray-900 mb-3">Papers</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search papers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chat Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No papers found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChatRooms.map((chatRoom) => (
              <div
                key={chatRoom._id}
                onClick={() => onSelectChatRoom(chatRoom._id)}
                className={`px-4 py-3 cursor-pointer transition-all hover:bg-gray-100 ${
                  selectedChatRoomId === chatRoom._id ? 'bg-gray-100 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {user?.role === 'reviewer' ? chatRoom.userName : chatRoom.paperId}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                       {chatRoom.paperName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {chatRoom.theme}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      chatRoom.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      chatRoom.status === 'declined' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {chatRoom.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
