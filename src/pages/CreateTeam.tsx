import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, X, Shield, ArrowRight, Search, Loader2, FileText, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Kriyaicon  from '../assests/Kriya.png';
import psgLogo from '../assests/PSGLogo.png';

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

interface Paper {
    paperId: string;
    eventName: string;
}

export default function CreateTeam() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    // Step: 'select-paper' | 'create-team'
    const [step, setStep] = useState<'select-paper' | 'create-team'>('select-paper');
    const [papers, setPapers] = useState<Paper[]>([]);
    const [isPapersLoading, setIsPapersLoading] = useState(true);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

    const [teamName, setTeamName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ name: string, uniqueId: string }[]>([]);
    const [teamMembers, setTeamMembers] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchPapers();
    }, []);

    const fetchPapers = async () => {
        setIsPapersLoading(true);
        try {
            const response = await axios.get(
                `${API_BACKEND_URL}/api/events/user/paper`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setPapers(response.data.papers);
            }
        } catch (err) {
            console.error("Error fetching papers", err);
            toast.error("Failed to load papers");
        } finally {
            setIsPapersLoading(false);
        }
    };

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
        if (!selectedPaper) return;
        setIsSearching(true);
        try {
            const response = await axios.get(
                `${API_BACKEND_URL}/api/events/paper/${selectedPaper.paperId}/user/team?search=${searchQuery}`,
                { withCredentials: true }
            );
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
        if (!selectedPaper) {
            toast.error("Please select a paper first");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                `${API_BACKEND_URL}/api/events/paper/${selectedPaper.paperId}/user/team`,
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
                    <img src={Kriyaicon} alt="Kriya Logo" className="h-10 md:h-12 w-10 md:w-12" />
                    <img src={psgLogo} alt="PSG Logo" className="h-8 md:h-10 w-8 md:w-10" />
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

                    {/* ── STEP 1: PAPER SELECTION ── */}
                    {step === 'select-paper' && (
                        <>
                            <div className="bg-blue-600 px-8 py-10 text-white relative">
                                <div className="relative z-10">
                                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                        <FileText size={32} />
                                        Select a Paper
                                    </h2>
                                    <p className="text-blue-100 text-lg">
                                        Choose the paper you are forming a team for.
                                    </p>
                                </div>
                                <div className="absolute right-0 bottom-0 opacity-10">
                                    <FileText size={180} />
                                </div>
                            </div>

                            <div className="p-8">
                                {isPapersLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                                        <p className="text-gray-500">Loading papers...</p>
                                    </div>
                                ) : papers.length === 0 ? (
                                    <div className="text-center py-16 text-gray-500">
                                        <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                                        <p>No papers available.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {papers.map((paper) => (
                                            <button
                                                key={paper.paperId}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPaper(paper);
                                                    setStep('create-team');
                                                }}
                                                className="w-full text-left px-5 py-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-between group shadow-sm"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors">
                                                        <FileText size={22} />
                                                    </div>
                                                    <p className="font-semibold text-gray-900 text-lg">{paper.eventName}</p>
                                                </div>
                                                <ArrowRight className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" size={22} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── STEP 2: CREATE TEAM ── */}
                    {step === 'create-team' && selectedPaper && (
                        <>
                            <div className="bg-blue-600 px-8 py-10 text-white relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('select-paper');
                                        setTeamName('');
                                        setTeamMembers([]);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                    className="absolute top-4 left-6 flex items-center gap-1 text-blue-200 hover:text-white text-sm transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                    Back
                                </button>
                                <div className="relative z-10">
                                    <p className="text-blue-200 text-sm font-medium mb-1 flex items-center gap-2">
                                        <FileText size={14} />
                                        {selectedPaper.eventName}
                                    </p>
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
                                        * Maximum 4 members allowed per team. Team members must be registered for the same paper. You will be The Team Leader By Default
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
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
