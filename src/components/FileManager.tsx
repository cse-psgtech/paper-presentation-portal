import { FileText, Upload, X, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { type UserRole } from '../contexts/AuthContext';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface FileManagerProps {
  role: UserRole;
  chatId?: string;
  paperId?: string;
}

interface Submission {
  _id: string;
  paperId: string;
  userId: string;
  fileUrl: string;
  accepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FileManager({ role, chatId, paperId }: FileManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; submissionId: string | null }>({ show: false, submissionId: null });
  const [accepting, setAccepting] = useState(false);

  // Fetch submitted files for this chat (both reviewer and author)
  useEffect(() => {
    if (!chatId) return;

    const fetchSubmissions = async () => {
      try {
        setLoadingSubmissions(true);
        setError(null);
        const endpoint = role === 'reviewer' 
          ? `${API_BASE_URL}/api/events/paper/reviewer/submissions/${chatId}`
          : `${API_BASE_URL}/api/events/paper/user/submissions/${chatId}`;
        
        const { data } = await axios.get(endpoint);
        if (data?.success && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
        } else {
          setError('Failed to load submissions');
        }
      } catch (err) {
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to load submissions';
        setError(msg);
        console.error('Fetch submissions error:', err);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [role, chatId]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (role === 'reviewer') return;
    if (e.target.files && e.target.files[0]) {
      if (files.length >= 3) {
        alert('Maximum 3 files allowed.');
        return;
      }
      setFiles((prev) => [...prev, e.target.files![0]]);
    }
  };

  const handleSubmit = async () => {
    if (role === 'reviewer') return;
    if (!paperId) {
      setError('Paper ID not found for upload');
      return;
    }
    if (files.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', 'paper_upload');

        const response = await axios.post(
          `${API_BASE_URL}/api/events/paper/${paperId}/upload`,
          formData
        );

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Upload failed');
        }
      }

      setFiles([]);
      toast.success('Files uploaded successfully');
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Failed to submit papers';
      setError(errorMessage);
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenFile = (fileUrl: string) => {
    window.open(`${API_BASE_URL}${fileUrl}`, '_blank');
  };

  const handleAcceptClick = (submissionId: string) => {
    setConfirmDialog({ show: true, submissionId });
  };

  const handleConfirmAccept = async () => {
    if (!confirmDialog.submissionId || !chatId) return;

    setAccepting(true);
    try {
      const endpoint = `${API_BASE_URL}/api/events/paper/reviewer/submissions/${chatId}`;
      const response = await axios.post(endpoint);

      if (response.data?.success) {
        toast.success('Submission accepted successfully');
        // Refresh submissions
        const { data } = await axios.get(endpoint);
        if (data?.success && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
        }
      } else {
        toast.error('Failed to accept submission');
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Failed to accept submission';
      toast.error(errorMessage);
      console.error('Accept submission error:', err);
    } finally {
      setAccepting(false);
      setConfirmDialog({ show: false, submissionId: null });
    }
  };

  if (role === 'reviewer') {
    return (
      <div className="h-full bg-white p-6 border-l border-gray-200 flex flex-col w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Submitted Files</h3>
          {chatId && (
            <span className="text-xs text-gray-500">Chat: {chatId.slice(-6)}</span>
          )}
        </div>

        {loadingSubmissions ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm text-center px-4">
            No submissions yet.
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto">
            {submissions.map((submission) => (
              <div
                key={submission._id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-100 -m-3 p-3 rounded-lg transition"
                    onClick={() => handleOpenFile(submission.fileUrl)}
                  >
                    <div className="p-2 bg-blue-100 text-blue-600 rounded">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        Paper Submission
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(submission.createdAt).toLocaleString()}
                      </p>
                      {submission.accepted && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
                          <CheckCircle2 size={10} /> Accepted
                        </span>
                      )}
                    </div>
                  </div>
                  {!submission.accepted && (
                    <button
                      onClick={() => handleAcceptClick(submission._id)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition flex-shrink-0"
                    >
                      <CheckCircle2 size={14} /> Accept
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Accept Submission?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to accept this submission? This action will mark the paper as accepted.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDialog({ show: false, submissionId: null })}
                  disabled={accepting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAccept}
                  disabled={accepting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:opacity-50"
                >
                  {accepting ? 'Accepting...' : 'Accept'}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-white p-6 border-l border-gray-200 flex flex-col w-full">
      <h3 className="font-semibold text-gray-800 mb-4">Upload Paper</h3>

      {/* Upload Zone */}
      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer transition mb-4">
        <Upload className="text-gray-400 mb-2" size={20} />
        <span className="text-sm text-gray-500">Click to upload PDF</span>
        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleUpload} />
      </label>

      {/* New Files to Upload */}
      {files.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Ready to Submit</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-200 group">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                  <FileText size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                </div>
                <button 
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={handleSubmit}
            className="mt-3 w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={files.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Paper'}
          </button>
        </div>
      )}

      {/* Submitted Files */}
      <div className="flex-1 overflow-y-auto">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">Submitted Files</h4>
        {loadingSubmissions ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm text-center">
            No files submitted yet.
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.map((submission) => (
              <div
                key={submission._id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleOpenFile(submission.fileUrl)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      Paper Submission
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(submission.createdAt).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Updated: {new Date(submission.updatedAt).toLocaleString()}
                    </p>
                    {submission.accepted && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
                        <CheckCircle2 size={10} /> Accepted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}