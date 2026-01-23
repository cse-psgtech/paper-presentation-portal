import { useState, useEffect } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { type ChatRoom, type Message } from '../types/chat';
import FileManager from '../components/FileManager';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ChatInterfaceProps {
  selectedChatRoom: ChatRoom;
}

export default function ChatInterface({ selectedChatRoom }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setMessagesLoading(true);
        setMessages([]);
        
        const response = await axios.get(
          `${API_BASE_URL}/api/events/paper/${user?.role}/messages/${selectedChatRoom._id}`
        );
        console.log(response);
        if (response.data.success) {
          setMessages(response.data.messages || []);
        } else {
          setError('Failed to fetch messages');
        }
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to fetch messages';
        setError(errorMessage);
        console.error('Messages fetch error:', err);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChatRoom._id, user?.role]);

  const handleSend = async () => {
    if (!input.trim() || !selectedChatRoom || !user?.role) return;

    try {
      
      // Add user message to UI immediately (optimistic update)
      const newMessage: Message = {
        message: input,
        sender_type: user.role as 'user' | 'reviewer',
        createdAt: new Date().toISOString()
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
      const currentInput = input;
      setInput("");

      // Send message to backend
      const response = await axios.post(
        `${API_BASE_URL}/api/events/paper/${user.role}/messages/${selectedChatRoom._id}`,
        {
          message: currentInput,
          sender: user.role,
          timestamp: new Date().toISOString()
        }
      );

      if (!response.data.success) {
        setError('Failed to send message');
        // Revert optimistic update on failure
        setMessages(prevMessages => prevMessages.slice(0, -1));
        setInput(currentInput);
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Failed to send message';
      setError(errorMessage);
      console.error('Send message error:', err);
      // Revert optimistic update on failure
      setMessages(prevMessages => prevMessages.slice(0, -1));
      setInput(input);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error: {error}</p>
          <button 
            onClick={() => setError(null)} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white w-full">
      {/* Left: chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Paper Details */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="font-bold text-lg text-gray-900">{selectedChatRoom.userName}</h2>
              <h2 className="font-bold text-lg text-gray-900">{selectedChatRoom.paperName}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              selectedChatRoom.status === 'completed' ? 'bg-green-100 text-green-700' : 
              selectedChatRoom.status === 'declined' ? 'bg-red-100 text-red-700' : 
              'bg-yellow-100 text-yellow-700'
            }`}>
              {selectedChatRoom.status}
            </span>
          </div>

          {/* Expandable Details Section */}
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              Paper Details
              <ChevronDown size={16} />
            </summary>
            <div className="mt-3 space-y-2 text-gray-700 pl-2 border-l-2 border-gray-300">
              <p><strong>Theme:</strong> {selectedChatRoom.theme}</p>
              <p><strong>Topic:</strong> {selectedChatRoom.topic}</p>
              <p><strong>Tagline:</strong> {selectedChatRoom.tagline}</p>
              <p><strong>Team Size:</strong> {selectedChatRoom.teamSize}</p>
              <p><strong>Presentation Date:</strong> {new Date(selectedChatRoom.date).toLocaleDateString()}</p>
              <p><strong>Deadline:</strong> {new Date(selectedChatRoom.deadline).toLocaleDateString()}</p>
              <p><strong>Hall:</strong> {selectedChatRoom.hall}</p>
              {user?.role === 'reviewer' ? (
                <p><strong>Author:</strong> {selectedChatRoom.userName} ({selectedChatRoom.userEmail})</p>
              ) : (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Assigned Reviewer</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-medium text-blue-900">{selectedChatRoom.reviewerName || 'Not Assigned'}</p>
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-center">No messages yet. Start a conversation with your {user?.role === 'reviewer' ? 'submitter' : 'reviewer'}.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const timestamp = new Date(msg.createdAt);
              const msgTime = !isNaN(timestamp.getTime()) 
                ? timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })
                : '--:--';
              return (
                <div 
                  key={msg._id || idx}
                  className={`flex ${msg.sender_type === user?.role ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-3 rounded-lg text-sm ${
                    msg.sender_type === user?.role 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}>
                    <p className="break-words">{msg.message}</p>
                    <span className={`text-[10px] block mt-1 ${
                      msg.sender_type === user?.role ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {msgTime}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          {selectedChatRoom.status !== 'pending' && (
            <p className="text-xs text-gray-500 mb-3 text-center">
              Chat is {selectedChatRoom.status}. No new messages can be sent.
            </p>
          )}
          <div className="relative flex gap-2">
            <textarea
              className="flex-1 bg-gray-100 border-0 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 resize-none h-20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={selectedChatRoom.status === 'pending' ? "Type your message here..." : "Chat is closed"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={selectedChatRoom.status !== 'pending'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && selectedChatRoom.status === 'pending') {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={handleSend}
              disabled={selectedChatRoom.status !== 'pending' || !input.trim()}
              className="self-end p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={selectedChatRoom.status === 'pending' ? 'Send message (Shift+Enter for new line)' : 'Chat is closed'}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right: file manager */}
      <aside className="w-96 min-w-[320px] border-l border-gray-200">
        <FileManager 
          role={user?.role || 'user'}
          chatId={selectedChatRoom._id}
          paperId={selectedChatRoom.paperId}
        />
      </aside>
    </div>
  );
}