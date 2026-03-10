import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, X, Shield, Search, Loader2, FileText, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

interface Paper {
    paperId: string;
    eventName: string;
}

interface TeamMember {
    uniqueId: string;
    name: string;
}

interface Team {
    _id: string;
    teamName: string;
    userIds: string[];
    createdBy: string;
    members: TeamMember[];
}

interface ManageTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ManageTeamModal({ isOpen, onClose }: ManageTeamModalProps) {
    const { user } = useAuth();

    // paper selection
    const [papers, setPapers] = useState<Paper[]>([]);
    const [isPapersLoading, setIsPapersLoading] = useState(true);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

    const [team, setTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPapers();
        } else {
            // reset on close
            setSelectedPaper(null);
            setTeam(null);
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isOpen]);

    const fetchPapers = async () => {
        setIsPapersLoading(true);
        try {
            const response = await axios.get(`${API_BACKEND_URL}/api/events/user/paper`, {
                withCredentials: true
            });
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

    const handleSelectPaper = (paper: Paper) => {
        setSelectedPaper(paper);
        fetchTeam(paper.paperId);
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

    const fetchTeam = async (paperId: string) => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${API_BACKEND_URL}/api/events/paper/${paperId}/user/my-team`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setTeam(response.data.team);
            }
        } catch (err) {
            console.error("Error fetching team", err);
        } finally {
            setIsLoading(false);
        }
    };

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

    const addMember = async (member: TeamMember) => {
        if (!selectedPaper) return;
        setIsAdding(true);
        try {
            const response = await axios.post(
                `${API_BACKEND_URL}/api/events/paper/${selectedPaper.paperId}/user/team/add`,
                { userId: member.uniqueId },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success("Member added successfully!");
                setSearchQuery('');
                setSearchResults([]);
                fetchTeam(selectedPaper.paperId);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Failed to add member";
            toast.error(errorMessage);
        } finally {
            setIsAdding(false);
        }
    };

    const removeMember = async (memberId: string) => {
        if (!selectedPaper) return;
        if (!window.confirm("Are you sure you want to remove this member?")) return;

        try {
            const response = await axios.post(
                `${API_BACKEND_URL}/api/events/paper/${selectedPaper.paperId}/user/team/remove`,
                { userId: memberId },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success("Member removed successfully!");
                fetchTeam(selectedPaper.paperId);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Failed to remove member";
            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    const isLeader = team?.createdBy === user?.id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100">

                {/* Modal Header */}
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        {selectedPaper && (
                            <button
                                onClick={() => {
                                    setSelectedPaper(null);
                                    setTeam(null);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="hover:bg-blue-700 p-1 rounded-full transition-colors mr-1"
                                title="Back to paper selection"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        {selectedPaper ? <Users size={24} /> : <FileText size={24} />}
                        <div>
                            <h2 className="text-xl font-bold">
                                {selectedPaper ? 'Manage Team' : 'Select a Paper'}
                            </h2>
                            {selectedPaper && (
                                <p className="text-blue-200 text-xs">{selectedPaper.eventName}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                    {/* ── PAPER SELECTION ── */}
                    {!selectedPaper && (
                        isPapersLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="animate-spin text-blue-600 mb-4" size={36} />
                                <p className="text-gray-500">Loading papers...</p>
                            </div>
                        ) : papers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <FileText className="mx-auto mb-4 text-gray-300" size={40} />
                                <p>No papers available.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {papers.map((paper) => (
                                    <button
                                        key={paper.paperId}
                                        type="button"
                                        onClick={() => handleSelectPaper(paper)}
                                        className="w-full text-left px-4 py-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors">
                                                <FileText size={18} />
                                            </div>
                                            <p className="font-semibold text-gray-900">{paper.eventName}</p>
                                        </div>
                                        <Users className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                                    </button>
                                ))}
                            </div>
                        )
                    )}

                    {/* ── TEAM MANAGEMENT ── */}
                    {selectedPaper && (
                        isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                                <p className="text-gray-500">Loading team details...</p>
                            </div>
                        ) : team ? (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Name</label>
                                    <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
                                        <Shield className="text-blue-600" size={24} />
                                        {team.teamName}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Members ({team.members.length}/4)</label>
                                    <div className="grid gap-2">
                                        {team.members.map((member) => (
                                            <div key={member.uniqueId} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{member.name}</p>
                                                        <p className="text-xs text-gray-500">{member.uniqueId === team.createdBy ? "Team Leader" : "Member"}</p>
                                                    </div>
                                                </div>
                                                {isLeader && member.uniqueId !== user?.id && (
                                                    <button
                                                        onClick={() => removeMember(member.uniqueId)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove Member"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {isLeader && team.members.length < 4 && (
                                    <div className="space-y-3 pt-4 border-t border-gray-100">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-blue-600">Add New Member</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by name..."
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="animate-spin text-blue-600" size={18} />
                                                </div>
                                            )}
                                        </div>

                                        {searchResults.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                                {searchResults.map((result) => (
                                                    <button
                                                        key={result.uniqueId}
                                                        onClick={() => addMember(result)}
                                                        disabled={isAdding}
                                                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900">{result.name}</p>
                                                            <p className="text-xs text-gray-500">ID: {result.uniqueId}</p>
                                                        </div>
                                                        <UserPlus className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isLeader && (
                                    <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                                        Only the team leader ({team.members.find(m => m.uniqueId === team.createdBy)?.name}) can add new members.
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="mx-auto mb-4 text-gray-300" size={40} />
                                <p className="text-gray-500">No team found for this paper.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
