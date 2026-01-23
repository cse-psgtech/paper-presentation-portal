import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { type ChatRoom } from '../types/chat';
import ChatRoomsList from '../pages/ChatRoomsList';
import ChatInterface from '../pages/ChatInterface';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ChatWindow() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch chatrooms on component mount
  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!user?.role) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/events/paper/${user?.role}/chats`);
        console.log(response);
        if (response.data.success) {
          const rooms = response.data.chats || [];
          setChatRooms(rooms);
         
          if (rooms.length > 0 && !selectedChatRoomId) {
            setSelectedChatRoomId(rooms[0]._id);
          }
        } else {
          setError('Failed to fetch chatrooms');
        }
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to fetch chatrooms';
        setError(errorMessage);
        console.error('Chatrooms fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [user?.role]);

  const selectedChatRoom = chatRooms.find(room => room._id === selectedChatRoomId);

  return (
    <div className="flex h-full gap-0">
      {/* Left Sidebar - Chat Rooms List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <ChatRoomsList 
          chatRooms={chatRooms}
          loading={loading}
          error={error}
          selectedChatRoomId={selectedChatRoomId}
          onSelectChatRoom={setSelectedChatRoomId}
        />
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="flex-1 flex flex-col w-full">
        {selectedChatRoom ? (
          <ChatInterface selectedChatRoom={selectedChatRoom} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <p className="text-gray-500 text-lg">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}