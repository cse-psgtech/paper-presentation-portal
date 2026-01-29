import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, ArrowLeft, MoreVertical, Search, X, ChevronUp, Info, Calendar, MapPin, Users, BookOpen, Tag, FileText, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { type ChatRoom, type Message } from '../types/chat';
import FileManager from '../components/FileManager';
import { toast } from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:5000';

interface ChatInterfaceProps {
  selectedChatRoom: ChatRoom;
  onBackToList?: () => void;
}

export default function ChatInterface({ selectedChatRoom, onBackToList }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFileManager, setShowFileManager] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setMessagesLoading(true);
        setMessages([]);

        const response = await axios.get(
          `${API_BASE_URL}/api/events/paper/${user?.role}/chats/messages/${selectedChatRoom._id}`
        );
        //console.log(response);
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
        toast.error(errorMessage);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
    // Reset search when chat room changes
    setIsSearchVisible(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
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
        `${API_BASE_URL}/api/events/paper/${user.role}/chats/messages/${selectedChatRoom._id}`,
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
      toast.error(errorMessage);
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

  const handleFileIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // The file manager will be shown via its own logic after upload
    }
  };

  const handleSearch = () => {
    if (!debouncedSearchTerm.trim()) return;
    const indices = messages.flatMap((msg, index) =>
      msg.message.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ? [index] : []
    );

    if (indices.length > 0) {
      const nextIndex = indices.find(i => i > highlightedIndex);
      const newIndex = nextIndex !== undefined ? nextIndex : indices[0];
      setHighlightedIndex(newIndex);
      searchResultsRef.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      toast('No matches found.');
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    if (isSearchVisible && debouncedSearchTerm) {
      handleSearch();
    } else {
      setHighlightedIndex(-1);
    }
  }, [debouncedSearchTerm, isSearchVisible]);

  const filteredMessages = messages; // We'll highlight instead of filtering

  return (
    <div className="flex h-full bg-white w-full flex-col md:flex-row">
      {/* Left: chat area */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header with Paper Details */}
        <div className="bg-white border-b border-gray-200 p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {onBackToList && (
                <button
                  onClick={onBackToList}
                  className="md:hidden flex-shrink-0 p-2 hover:bg-gray-100 rounded-full"
                  title="Back to chats"
                >
                  <ArrowLeft size={20} className="text-gray-700" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base md:text-lg text-gray-900 truncate">
                    {user?.role === 'reviewer' ? (selectedChatRoom.teamName || selectedChatRoom.userName) : selectedChatRoom.paperName}
                  </h2>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="p-1 hover:bg-gray-100 rounded-full text-blue-600 transition-colors"
                    title="View Paper Details"
                  >
                    {showDetails ? <ChevronUp size={18} /> : <Info size={18} />}
                  </button>
                </div>
                <p className="text-xs md:text-sm text-gray-500 truncate">
                  {user?.role === 'reviewer' ? selectedChatRoom.paperName : `Reviewer: ${selectedChatRoom.reviewerName || 'Not Assigned'}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Search messages"
              >
                <Search size={20} className="text-gray-600" />
              </button>

              {/* Mobile-only Menu */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="More options"
                >
                  <MoreVertical size={20} className="text-gray-600" />
                </button>
                {showMobileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowFileManager(true);
                        setShowMobileMenu(false);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      File Manager
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Input */}
          {isSearchVisible && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search in chat..."
                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                <Search size={18} />
              </button>
              <button
                onClick={() => {
                  setIsSearchVisible(false);
                  setSearchTerm('');
                  setHighlightedIndex(-1);
                }}
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Paper Details Dropdown */}
        {showDetails && (
          <div className="bg-blue-50 border-b border-blue-100 p-4 animate-in slide-in-from-top duration-300 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paper ID</p>
                    <p className="text-sm font-medium text-gray-900">{selectedChatRoom.paperId}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Theme & Topic</p>
                    <p className="text-sm font-medium text-gray-900">{selectedChatRoom.theme}</p>
                    <p className="text-xs text-gray-600">{selectedChatRoom.topic}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Tag className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tagline</p>
                    <p className="text-sm italic text-gray-700">"{selectedChatRoom.tagline}"</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Details</p>
                    <p className="text-sm font-medium text-gray-900">{selectedChatRoom.teamName || 'Individual'}</p>
                    {selectedChatRoom.teamSize > 0 && (
                      <p className="text-xs text-gray-600">Size: {selectedChatRoom.teamSize} members</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Venue (Hall)</p>
                    <p className="text-sm font-medium text-gray-900">{selectedChatRoom.hall || 'To be announced'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Presentation Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedChatRoom.date ? new Date(selectedChatRoom.date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submission Deadline</p>
                    <p className="text-sm font-medium text-red-600">
                      {selectedChatRoom.deadline ? new Date(selectedChatRoom.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Expired'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${selectedChatRoom.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedChatRoom.status === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {selectedChatRoom.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                {selectedChatRoom.rules && (
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="w-full">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rules</p>
                      <div className="text-xs text-gray-700 whitespace-pre-line bg-white/50 p-2 rounded border border-blue-100 mt-1 max-h-24 overflow-y-auto">
                        {selectedChatRoom.rules}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-center">No messages yet. Start a conversation with your {user?.role === 'reviewer' ? 'submitter' : 'reviewer'}.</p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const timestamp = new Date(msg.createdAt);
              const msgTime = !isNaN(timestamp.getTime())
                ? timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
                : '--:--';

              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={msg._id || idx}
                  ref={el => { searchResultsRef.current[idx] = el; }}
                  className={`flex ${msg.sender_type === user?.role ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-3 rounded-lg text-sm transition-all duration-300 ${msg.sender_type === user?.role
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    } ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>
                    <p className="break-words">{msg.message}</p>
                    <span className={`text-[10px] block mt-1 ${msg.sender_type === user?.role ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                      {msgTime}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          {selectedChatRoom.status !== 'pending' && (
            <p className="text-xs text-gray-500 mb-3 text-center">
              Chat is {selectedChatRoom.status}. No new messages can be sent.
            </p>
          )}
          <div className="flex flex-row items-center gap-2">
            <div className="flex-1 relative">
              <textarea
                className="w-full bg-gray-100 border-0 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-500 resize-none h-12 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={selectedChatRoom.status === 'pending' ? "Type your message..." : "Chat is closed"}
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
              {/* File Upload Icon */}
              <button
                onClick={handleFileIconClick}
                disabled={selectedChatRoom.status !== 'pending'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelected}
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              />
            </div>
            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={selectedChatRoom.status !== 'pending' || !input.trim()}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title={selectedChatRoom.status === 'pending' ? 'Send message' : 'Chat is closed'}
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Right: file manager - Desktop */}
      <aside className="hidden md:flex md:w-96 md:min-w-[320px] border-l border-gray-200 flex-col">
        <FileManager
          role={user?.role || 'user'}
          chatId={selectedChatRoom._id}
          paperId={selectedChatRoom.paperId}
        />
      </aside>

      {/* Mobile File Manager Modal */}
      {showFileManager && (
        <div className="md:hidden fixed inset-0 bg-white/80 backdrop-blur-sm flex items-end z-50">
          <div className="w-full bg-white rounded-t-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Files</h3>
              <button
                onClick={() => setShowFileManager(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FileManager
                role={user?.role || 'user'}
                chatId={selectedChatRoom._id}
                paperId={selectedChatRoom.paperId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}