import React, { useState, useEffect } from 'react';
import { 
  Plus, Folder, FileText, ChevronRight, Upload, 
  Trash2, AlertCircle, X 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

type SubjectDetail = {
  id: number;
  name: string;
  description: string | null;
  color_code: string;
  created_at: string;
  documents: Array<{
    id: number;
    name: string;
    file_type: string;
    summary: string | null;
    topic_category: string | null;
    status: string;
    created_at: string;
  }>;
  quizzes: Array<{
    id: number;
    title: string;
    difficulty: string;
    score: number | null;
    completed: boolean;
    created_at: string;
  }>;
  weak_topics: Array<{
    id: number;
    topic_name: string;
    weakness_score: number;
    times_failed: number;
    recommended_action: string | null;
  }>;
  average_score: number;
  total_documents: number;
  total_quizzes: number;
};

export const Subjects: React.FC = () => {
  const { subjects, token, apiUrl, fetchSubjects } = useApp();
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SubjectDetail | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Create Subject Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchSubjectDetail = async (id: number) => {
    if (!token) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`${apiUrl}/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedSubId) {
      fetchSubjectDetail(selectedSubId);
    } else {
      setDetail(null);
    }
  }, [selectedSubId, subjects]);

  // Periodic poll of details if documents are processing
  useEffect(() => {
    if (!selectedSubId || !detail) return;
    const hasProcessing = detail.documents.some(d => d.status === 'processing');
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchSubjectDetail(selectedSubId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [detail, selectedSubId]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/subjects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, description: newDesc, color_code: newColor })
      });
      if (res.ok) {
        fetchSubjects();
        setShowCreateModal(false);
        setNewName('');
        setNewDesc('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSubId || !uploadFile) return;
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('subject_id', selectedSubId.toString());
    formData.append('file', uploadFile);

    try {
      const res = await fetch(`${apiUrl}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        setUploadFile(null);
        const fileInput = document.getElementById('subject-file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchSubjectDetail(selectedSubId);
      } else {
        const errorData = await res.json();
        setUploadError(errorData.detail || 'Upload failed');
      }
    } catch (e) {
      setUploadError('Failed to establish connection to upload API.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!token || !selectedSubId) return;
    if (!confirm('Are you sure you want to delete this study document? This will remove its vectors and summary.')) return;
    try {
      const res = await fetch(`${apiUrl}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSubjectDetail(selectedSubId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubject = async (subId: number) => {
    if (!token) return;
    if (!confirm('Warning: Deleting this subject will permanently delete all associated documents, quizzes, and study vectors. Continue?')) return;
    try {
      const res = await fetch(`${apiUrl}/subjects/${subId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedSubId(null);
        fetchSubjects();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full bg-background text-foreground transition-colors duration-300">
      <Header title={selectedSubId && detail ? `Subject: ${detail.name}` : "Subjects Manager"} />

      {selectedSubId === null ? (
        // LIST VIEW OF SUBJECTS
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Your Subjects</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Select a subject space to configure study documents or take custom AI practice tests.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/95 text-xs font-bold text-white transition-all shadow-lg shadow-primary/25 self-start sm:self-auto cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Subject</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => (
              <div 
                key={sub.id} 
                onClick={() => setSelectedSubId(sub.id)}
                className="p-6 rounded-2xl glass-panel hover:border-primary/40 cursor-pointer flex flex-col justify-between h-44 hover:scale-[1.01] hover:shadow-lg transition-all relative overflow-hidden group border-border/80"
              >
                <div 
                  className="absolute top-0 left-0 w-1.5 h-full"
                  style={{ backgroundColor: sub.color_code }}
                ></div>
                
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span 
                      className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${sub.color_code}20`, color: sub.color_code }}
                    >
                      Classroom
                    </span>
                    <Folder className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition" />
                  </div>
                  <h4 className="font-bold text-slate-850 dark:text-white text-lg group-hover:text-primary transition">{sub.name}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{sub.description || 'No description provided.'}</p>
                </div>

                <div className="flex justify-end items-center text-[10px] font-bold text-primary group-hover:gap-1.5 transition-all">
                  <span>Enter Subject Space</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            ))}

            {subjects.length === 0 && (
              <div className="col-span-full py-16 text-center glass-panel rounded-2xl flex flex-col items-center border-dashed">
                <Folder className="h-12 w-12 text-slate-400 dark:text-slate-600 mb-3" />
                <h4 className="font-bold text-slate-700 dark:text-slate-350">No subjects created yet</h4>
                <p className="text-slate-550 dark:text-slate-500 text-xs mt-1 mb-5 max-w-sm leading-relaxed">Subjects organize your study material. Create your first subject to get started.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-3 rounded-xl bg-slate-200 dark:bg-slate-900 border border-border hover:bg-slate-250 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white transition cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  Create First Subject
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // DETAILED VIEW OF SPECIFIC SUBJECT
        <div>
          <button 
            onClick={() => setSelectedSubId(null)}
            className="mb-6 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            style={{ minHeight: '44px' }}
          >
            ← Back to Subjects
          </button>

          {loadingDetail || !detail ? (
            <div className="flex h-60 items-center justify-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Document upload / management */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Drag Drop Upload */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-base">Brain Sync Center (Document Upload)</h3>
                  
                  {uploadError && (
                    <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold">
                      {uploadError}
                    </div>
                  )}

                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-border/80 rounded-xl p-8 text-center bg-slate-100/40 dark:bg-slate-950/20 relative group hover:border-primary/50 transition">
                      <input 
                        type="file" 
                        id="subject-file-upload"
                        required
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setUploadFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept=".pdf,.docx,.txt,.pptx,.png,.jpg,.jpeg,.webp"
                      />
                      <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-3 group-hover:text-primary transition" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                        {uploadFile ? uploadFile.name : 'Select or drop a study document'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                        Supports PDF, DOCX, TXT, PPT, Images (max 25MB). Auto OCR & vector indexing.
                      </p>
                    </div>
                    
                    {uploadFile && (
                      <div className="flex justify-end gap-3">
                        <button 
                          type="button" 
                          onClick={() => setUploadFile(null)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-border text-xs text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800"
                          style={{ minHeight: '44px' }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={uploading}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-xs text-white font-bold hover:from-primary/95 flex items-center gap-1.5"
                          style={{ minHeight: '44px' }}
                        >
                          {uploading ? (
                            <>
                              <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <span>Sync Document</span>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                {/* Uploaded Documents List */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-base">Synced Learning Materials</h3>
                  
                  <div className="space-y-4">
                    {detail.documents.map((doc) => (
                      <div key={doc.id} className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-border/80">
                        <div className="flex justify-between items-start gap-4 mb-2.5">
                          <div className="flex gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{doc.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">{doc.file_type}</span>
                                <span className="text-[9px] bg-slate-200/60 dark:bg-slate-900 px-2 py-0.5 rounded border border-border text-secondary font-semibold">
                                  {doc.topic_category || 'Categorizing...'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                              doc.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                              doc.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400' :
                              'bg-primary/10 border-primary/20 text-primary animate-pulse'
                            }`}>
                              {doc.status}
                            </span>
                            <button 
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-slate-500 hover:text-red-500 p-2.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-border transition flex items-center justify-center"
                              style={{ minWidth: '44px', minHeight: '44px' }}
                              aria-label="Delete document"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>

                        {doc.summary && (
                          <details className="mt-2 text-xs border-t border-border/40 pt-2 text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                            <summary className="text-[10px] text-primary hover:underline font-bold">
                              View Auto Summary
                            </summary>
                            <p className="mt-2 pl-2.5 border-l-2 border-primary/30 py-1.5 bg-slate-200/30 dark:bg-slate-950/20 rounded">
                              {doc.summary}
                            </p>
                          </details>
                        )}
                      </div>
                    ))}

                    {detail.documents.length === 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-10">
                        No synced learning materials. Upload your textbooks, notes, or slides above to train your clone.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Subject metrics, weak topics, actions */}
              <div className="space-y-6">
                
                {/* Subject stats summary */}
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-15"
                    style={{ backgroundColor: detail.color_code }}
                  ></div>

                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-base">Subject Statistics</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Total Study Files</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{detail.total_documents}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Quizzes Completed</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{detail.total_quizzes}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Knowledge Index</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {detail.average_score > 0 ? `${Math.round(detail.average_score)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteSubject(detail.id)}
                    className="w-full mt-6 py-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold transition cursor-pointer"
                    style={{ minHeight: '44px' }}
                  >
                    Delete Subject Space
                  </button>
                </div>

                {/* Weak topics tracker */}
                <div className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Weak Areas Detected</h3>
                  </div>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {detail.weak_topics.map((wt) => (
                      <div key={wt.id} className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/10 text-xs relative overflow-hidden shadow-sm">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{wt.topic_name}</span>
                          <span className="text-[10px] text-red-500 dark:text-red-400 font-bold bg-red-500/10 px-2.5 py-0.5 rounded-full">
                            {Math.round(wt.weakness_score * 100)}% weakness
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-555 dark:text-slate-400 leading-relaxed mb-2">
                          Tested wrong {wt.times_failed} times.
                        </p>
                        {wt.recommended_action && (
                          <div className="p-2.5 rounded bg-slate-200/50 dark:bg-slate-950/40 border border-border/40 text-[10px] leading-relaxed text-slate-700 dark:text-slate-350">
                            <strong>AI Advice:</strong> {wt.recommended_action}
                          </div>
                        )}
                      </div>
                    ))}

                    {detail.weak_topics.length === 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8 leading-relaxed">
                        Perfect! No weak topics detected yet. Make sure to take practice quizzes to test yourself.
                      </p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* CREATE SUBJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Create Subject Space</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border text-slate-500 hover:text-slate-800 dark:hover:text-white"
                style={{ minWidth: '32px', minHeight: '32px' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1.5">Subject Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Mathematics, Compiler Design"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1.5">Description</label>
                <textarea 
                  placeholder="Enter details about this class or curriculum (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl glass-input text-xs h-24 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-2.5">Subject Color Accent</label>
                <div className="flex flex-wrap gap-3.5 justify-start">
                  {['#6366f1', '#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={`h-11 w-11 rounded-full transition flex items-center justify-center cursor-pointer ${
                        newColor === color ? 'ring-3 ring-primary dark:ring-white ring-offset-2 ring-offset-background scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select subject color accent ${color}`}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-border text-xs text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800"
                  style={{ minHeight: '44px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-xs text-white font-bold hover:from-primary/95 shadow-md shadow-primary/10"
                  style={{ minHeight: '44px' }}
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
