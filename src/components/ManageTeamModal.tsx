import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, X, Shield, Search, Loader2, FileText, ChevronLeft, ArrowRight } from 'lucide-react';
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

    // view: 'manage' | 'create'
    const [view, setView] = useState<'manage' | 'create'>('manage');

    const [team, setTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // shared search state (used for both manage-add and create-form)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // create-team form state
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamMembers, setNewTeamMembers] = useState<TeamMember[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPapers();
        } else {
            resetAll();
        }
    }, [isOpen]);

    const resetAll = () => {
        setSelectedPaper(null);
        setTeam(null);
        setView('manage');
        setSearchQuery('');
        setSearchResults([]);
        setNewTeamName('');
        setNewTeamMembers([]);
    };

    const resetToManage = () => {
        setView('manage');
        setSearchQuery('');
        setSearchResults([]);
        setNewTeamName('');
        setNewTeamMembers([]);
    };

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

    const handleSelectPaper = async (paper: Paper) => {
        setSelectedPaper(paper);
        setView('manage');
        setSearchQuery('');
        setSearchResults([]);
        setNewTeamName('');
        setNewTeamMembers([]);
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
    }, [searchQuery, selectedPaper]);

    const fetchTeam = async (paperId: string) => {
        setIsLoading(true);
        setTeam(null);
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
                `${API_BACKEND_URL}/api/events/paper/${selectedPaper.paperId}/user/team?search=${encodeURIComponent(searchQuery)}`,
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

    // ── MANAGE: add member to existing team ──
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
            toast.error(err.response?.data?.message || "Failed to add member");
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
            toast.error(err.response?.data?.message || "Failed to remove member");
        }
    };

    // ── CREATE: local add/remove before submit ──
    const addNewTeamMember = (member: TeamMember) => {
        if (newTeamMembers.some(m => m.uniqueId === member.uniqueId)) {
            toast.error("Member already added");
            return;
        }
        if (newTeamMembers.length >= 3) {
            toast.error("Maximum 4 members per team (including you)");
            return;
        }
        setNewTeamMembers(prev => [...prev, member]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeNewTeamMember = (uniqueId: string) => {
        setNewTeamMembers(prev => prev.filter(m => m.uniqueId !== uniqueId));
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPaper) return;
        if (!newTeamName.trim()) { toast.error("Team name is required"); return; }

        setIsCreating(true);
        try {
            const response = await axios.post(
                `${API_BACKEND_URL}/api/events/paper/${selectedPaper.paperId}/user/team`,
                {
                    teamName: newTeamName,
                    teamMembers: newTeamMembers.map(m => m.uniqueId)
                },
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success("Team created successfully!");
                resetToManage();
                fetchTeam(selectedPaper.paperId);
            } else {
                toast.error(response.data.message || "Failed to create team");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create team");
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    const isLeader = team?.createdBy === user?.id;

    /* ─── header title logic ─── */
    const headerTitle = !selectedPaper
        ? 'Select a Paper'
        : view === 'create'
            ? 'Create Team'
            : 'Manage Team';
    const HeaderIcon = !selectedPaper ? FileText : Users;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100">

                {/* Modal Header */}
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        {/* back button: from create → manage, from manage → paper list */}
                        {selectedPaper && (
                            <button
                                onClick={() => {
                                    if (view === 'create') {
                                        resetToManage();
                                    } else {
                                        setSelectedPaper(null);
                                        setTeam(null);
                                    }
                                }}
                                className="hover:bg-blue-700 p-1 rounded-full transition-colors mr-1"
                                title="Back"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <HeaderIcon size={22} />
                        <div className="ml-2">
                            <h2 className="text-xl font-bold leading-tight">{headerTitle}</h2>
                            {selectedPaper && (
                                <p className="text-blue-200 text-xs">{selectedPaper.eventName}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

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

                    {/* ── TEAM MANAGEMENT (existing team) ── */}
                    {selectedPaper && view === 'manage' && (
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
                                        <Shield className="text-blue-600" size={22} />
                                        {team.teamName}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Members ({team.members.length}/4)
                                    </label>
                                    <div className="grid gap-2">
                                        {team.members.map((member) => (
                                            <div key={member.uniqueId} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                                                        <p className="text-xs text-gray-400">{member.uniqueId === team.createdBy ? "Team Leader" : "Member"}</p>
                                                    </div>
                                                </div>
                                                {isLeader && member.uniqueId !== user?.id && (
                                                    <button
                                                        onClick={() => removeMember(member.uniqueId)}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove Member"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {isLeader && team.members.length < 4 && (
                                    <div className="space-y-3 pt-2 border-t border-gray-100">
                                        <label className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Add Member</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by ID or name..."
                                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="animate-spin text-blue-600" size={16} />
                                                </div>
                                            )}
                                        </div>
                                        {searchResults.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                                                {searchResults.map((result) => (
                                                    <button
                                                        key={result.uniqueId}
                                                        onClick={() => addMember(result)}
                                                        disabled={isAdding}
                                                        className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group text-sm"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900">{result.name}</p>
                                                            <p className="text-xs text-gray-400">ID: {result.uniqueId}</p>
                                                        </div>
                                                        <UserPlus className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isLeader && (
                                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                                        Only the team leader ({team.members.find(m => m.uniqueId === team.createdBy)?.name}) can add or remove members.
                                    </p>
                                )}
                            </>
                        ) : (
                            /* No team found — prompt to create */
                            <div className="text-center py-8 space-y-4">
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="text-gray-300" size={44} />
                                    <p className="text-gray-500 font-medium">No team found for this paper.</p>
                                    <p className="text-xs text-gray-400">You haven't formed a team yet.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setView('create')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                                >
                                    <UserPlus size={16} />
                                    Form a Team
                                </button>
                            </div>
                        )
                    )}

                    {/* ── CREATE TEAM FORM ── */}
                    {selectedPaper && view === 'create' && (
                        <form onSubmit={handleCreateTeam} className="space-y-5">
                            {/* Team Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Name</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        placeholder="Enter a team name"
                                        className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Added Members */}
                            {newTeamMembers.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Added Members ({newTeamMembers.length})
                                    </label>
                                    <div className="grid gap-2">
                                        {newTeamMembers.map((member) => (
                                            <div key={member.uniqueId} className="flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                                                        <p className="text-xs text-gray-400">ID: {member.uniqueId}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewTeamMember(member.uniqueId)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Search to add members */}
                            {newTeamMembers.length < 3 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Add Members</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by ID or name..."
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="animate-spin text-blue-600" size={16} />
                                            </div>
                                        )}
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                                            {searchResults
                                                .filter(r => !newTeamMembers.some(m => m.uniqueId === r.uniqueId))
                                                .map((result) => (
                                                    <button
                                                        key={result.uniqueId}
                                                        type="button"
                                                        onClick={() => addNewTeamMember(result)}
                                                        className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group text-sm"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900">{result.name}</p>
                                                            <p className="text-xs text-gray-400">ID: {result.uniqueId}</p>
                                                        </div>
                                                        <UserPlus className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-xs text-gray-400 italic">
                                * Up to 4 members including yourself. Members must be registered for this paper.
                            </p>

                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold text-sm shadow-md shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        Create Team
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}


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
