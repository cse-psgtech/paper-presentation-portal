import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, X, Shield, ArrowRight, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import inficon from '../assests/InfinitumIcon.png';
import psgLogo from '../assests/PSGLogo.png';

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

export default function CreateTeam() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ name: string, uniqueId: string }[]>([]);
    const [teamMembers, setTeamMembers] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                searchUsers();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const searchUsers = async () => {
        setIsSearching(true);
        try {
            const response = await axios.get(
                `${API_BACKEND_URL}/api/events/paper/user/team?search=${searchQuery}`,
                { withCredentials: true }
            );
            console.log(response.data)
            if (response.data.success) {
                setSearchResults(response.data.users);
            }
        } catch (err) {
            console.error("Error searching users", err);
        } finally {
            setIsSearching(false);
        }
    };

    const addMember = (member: { name: string, uniqueId: string }) => {
        if (teamMembers.some(m => m.id === member.uniqueId)) {
            toast.error("Member already added");
            return;
        }

        if (teamMembers.length >= 3) {
            toast.error("Maximum 4 members allowed per team");
            return;
        }

        setTeamMembers([...teamMembers, { id: member.uniqueId, name: member.name }]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeMember = (id: string) => {
        setTeamMembers(teamMembers.filter(m => m.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName.trim()) {
            toast.error("Team name is required");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                `${API_BACKEND_URL}/api/events/paper/user/team`,
                {
                    teamName,
                    teamMembers: teamMembers.map(m => m.id)
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success("Team created successfully!");
                navigate('/author', { replace: true });
            } else {
                toast.error(response.data.message || "Failed to create team");
            }
        } catch (err) {
            const errorMessage = axios.isAxiosError(err)
                ? err.response?.data?.message || err.message
                : 'An error occurred while creating team';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 md:gap-3">
                    <img src={inficon} alt="Infinitum Logo" className="h-10 md:h-12 w-10 md:w-12" />
                    <img src={psgLogo} alt="Psg Logo" className="h-8 md:h-10 w-8 md:w-10" />
                </div>
                <h1 className="text-sm md:text-xl font-bold text-gray-900 truncate">
                    Paper Presentation Portal
                </h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={logout}
                        className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-blue-600 px-8 py-10 text-white relative">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                <Users size={32} />
                                Create Your Team
                            </h2>
                            <p className="text-blue-100 text-lg">
                                Form a team to participate in the paper presentation.
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10">
                            <Users size={180} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Team Name Section */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Team Name
                            </label>
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="Enter a team name"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 text-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Members Section */}
                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Team Members
                            </label>

                            {/* <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-blue-900">Team Leader (You)</p>
                                    <p className="text-sm text-blue-700">ID: {user?.id} • {user?.name}</p>
                                </div>
                            </div> */}

                            {/* Added Members List */}
                            <div className="grid gap-3">
                                {teamMembers.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{member.name}</p>
                                                {/* <p className="text-xs text-gray-500">ID: {member.id}</p> */}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeMember(member.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Member Input (Search) */}
                            {teamMembers.length < 3 && (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by username..."
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Loader2 className="animate-spin text-blue-600" size={20} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-lg mt-2 overflow-hidden max-h-60 overflow-y-auto">
                                            {searchResults.map((result) => (
                                                <button
                                                    key={result.uniqueId}
                                                    type="button"
                                                    onClick={() => addMember(result)}
                                                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="font-medium text-gray-900">{result.name}</p>
                                                        <p className="text-xs text-gray-500">ID: {result.uniqueId}</p>
                                                    </div>
                                                    <UserPlus className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 italic">
                                * Maximum 4 members allowed per team. Team members must be registered for a paper. You will be The Team Leader By Default
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-bold text-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        Create Team
                                        <ArrowRight size={24} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
