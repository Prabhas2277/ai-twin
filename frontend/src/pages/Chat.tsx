import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Brain, FileText, 
  Sparkles, Layers, Terminal, Filter, X 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

type Message = {
  role: 'user' | 'model';
  content: string;
  sources?: Array<{
    document_id: number;
    name: string;
    subject_id: number;
  }>;
};

type DocumentItem = {
  id: number;
  name: string;
  subject_id: number;
  status: string;
};

export const Chat: React.FC = () => {
  const { token, apiUrl, subjects } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<'beginner' | 'exam' | 'expert' | 'teacher'>('beginner');
  const [loading, setLoading] = useState(false);

  // Layout toggles
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Subject and Document filtering for RAG
  const [selectedSubIds, setSelectedSubIds] = useState<number[]>([]);
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  // Note generation utility states
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [notesType, setNotesType] = useState<'revision' | 'mindmap' | 'flashcards' | 'formula'>('revision');
  const [notesResult, setNotesResult] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all completed documents for checked subjects
  useEffect(() => {
    const fetchDocs = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${apiUrl}/documents/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const completedDocs = data.filter((d: any) => d.status === 'completed');
          setAvailableDocs(completedDocs);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchDocs();
  }, [token, subjects]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !token) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiHistory = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${apiUrl}/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: input,
          subject_ids: selectedSubIds.length > 0 ? selectedSubIds : null,
          document_ids: selectedDocIds.length > 0 ? selectedDocIds : null,
          response_mode: selectedMode,
          history: apiHistory
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMessage: Message = {
          role: 'model',
          content: data.answer,
          sources: data.sources
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: 'Could not contact Study Twin. Try adjusting API key.' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', content: 'Connection timed out. Check FastAPI server logs.' }]);
    } finally {
      setLoading(false);
    }
  };

  const triggerNotesGeneration = async () => {
    if (!token) return;
    if (selectedSubIds.length === 0 && selectedDocIds.length === 0) {
      alert('Please select at least one Subject or Document in the sidebar to generate notes from.');
      return;
    }
    setGeneratingNotes(true);
    setNotesResult(null);
    try {
      const body: any = { note_type: notesType };
      if (selectedDocIds.length > 0) {
        body.document_id = selectedDocIds[0];
      } else {
        body.subject_id = selectedSubIds[0];
      }

      const res = await fetch(`${apiUrl}/chat/generate-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setNotesResult(data.content);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to generate study materials.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleToggleSubject = (subId: number) => {
    setSelectedSubIds(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
    setSelectedDocIds([]);
  };

  const handleToggleDoc = (docId: number) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  // Custom text formatter parsing code blocks, math formulas, headers, lists, and bold text
  const formatText = (text: string) => {
    if (!text) return '';
    
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Triple-Backtick Code Blocks
    escaped = escaped.replace(/```(\w*)\n([\s\S]*?)\n```/g, (_, _lang, code) => {
      return `<pre class="bg-slate-950 p-4 rounded-xl border border-border/85 text-xs overflow-x-auto my-3 text-emerald-450 dark:text-emerald-400 font-mono"><code class="block font-mono">${code.trim()}</code></pre>`;
    });

    // 2. Inline Code
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-900 border px-1.5 py-0.5 rounded font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">$1</code>');

    // 3. LaTeX Block Formulas
    escaped = escaped.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="text-center font-serif text-sm bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg border my-3 text-primary font-bold">$1</div>');

    // 4. LaTeX Inline Formulas
    escaped = escaped.replace(/\$([^\$]+)\$/g, '<span class="font-serif text-primary italic font-bold">$1</span>');

    // 5. Headers (e.g. ### Header) - FIXED contrast (slate-850 / text-white)
    escaped = escaped.replace(/^### (.*?)$/gm, '<h5 class="text-slate-800 dark:text-white font-bold mt-4 mb-2 text-sm">$1</h5>');
    escaped = escaped.replace(/^## (.*?)$/gm, '<h4 class="text-slate-800 dark:text-white font-bold mt-5 mb-2.5 text-base border-b border-border/40 pb-1">$1</h4>');
    escaped = escaped.replace(/^# (.*?)$/gm, '<h3 class="text-slate-800 dark:text-white font-extrabold mt-6 mb-3 text-lg">$1</h3>');

    // 6. Bullet lists
    escaped = escaped.replace(/^\* (.*?)$/gm, '<li class="ml-4 list-disc pl-1 mb-1">$1</li>');
    escaped = escaped.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc pl-1 mb-1">$1</li>');

    // 7. Bold Text - FIXED contrast (slate-800 / text-white)
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-800 dark:text-white font-bold">$1</strong>');
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // 8. Paragraph spacing
    const lines = escaped.split('\n');
    const processedLines = lines.map(line => {
      if (line.trim() === '') return '<div class="h-2"></div>';
      if (line.startsWith('<pre') || line.startsWith('<h') || line.startsWith('<li') || line.startsWith('<div')) return line;
      return `<p class="mb-1.5 leading-relaxed">${line}</p>`;
    });

    return processedLines.join('\n');
  };

  const activeDocsList = availableDocs.filter(d => selectedSubIds.includes(d.subject_id) || selectedSubIds.length === 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-1rem)] bg-background text-foreground transition-all overflow-hidden">
      <Header title="AI Study Twin Tutoring" />

      {/* Mobile Toggle Filters Button */}
      <button 
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        className="lg:hidden flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-card border border-border/80 text-xs text-slate-600 dark:text-slate-400 font-bold mb-3 cursor-pointer shadow-sm active:bg-slate-100 dark:active:bg-slate-900"
        style={{ minHeight: '44px' }}
      >
        <Filter className="h-4 w-4" />
        <span>{showMobileFilters ? 'Hide Brain Filters' : 'Show Brain Filters'}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden h-full">
        {/* RAG Context Sidebar & Filters */}
        <div className={`lg:col-span-1 glass-panel p-5 rounded-2xl flex flex-col justify-between overflow-y-auto h-full space-y-5 ${
          showMobileFilters ? 'block absolute inset-x-4 top-24 bottom-20 z-20 bg-background/95 backdrop-blur-2xl' : 'hidden lg:flex'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Clone Brain Filters</h3>
              </div>
              {showMobileFilters && (
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-900 border text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Subject selector */}
            <div className="space-y-2 mb-4">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Select Subjects</label>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {subjects.map(s => (
                  <label key={s.id} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none py-1 min-h-[36px]">
                    <input 
                      type="checkbox" 
                      checked={selectedSubIds.includes(s.id)}
                      onChange={() => handleToggleSubject(s.id)}
                      className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-900 border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="truncate">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Document Selector */}
            {activeDocsList.length > 0 && (
              <div className="space-y-2 mb-4">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Select Specific Files</label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {activeDocsList.map(d => (
                    <label key={d.id} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none py-1 min-h-[36px]">
                      <input 
                        type="checkbox" 
                        checked={selectedDocIds.includes(d.id)}
                        onChange={() => handleToggleDoc(d.id)}
                        className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-900 border-border text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="truncate text-slate-500 dark:text-slate-400">{d.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Response modes */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Tutoring Mode</label>
              <div className="grid grid-cols-2 gap-2">
                 {[
                  { id: 'beginner', name: 'Beginner' },
                  { id: 'exam', name: 'Exam prep' },
                  { id: 'expert', name: 'Expert' },
                  { id: 'teacher', name: 'Socratic' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id as any)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      selectedMode === mode.id 
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/15' 
                        : 'bg-slate-900 border-slate-750 text-slate-400 hover:text-white'
                    }`}
                    style={{ minHeight: '40px' }}
                  >
                    {mode.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick study tools generator */}
          <div className="pt-4 border-t border-border/60">
            <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2.5">Generate Study Kit</h4>
            <div className="flex gap-2 mb-3">
              <select 
                value={notesType} 
                onChange={(e) => setNotesType(e.target.value as any)}
                className="flex-1 px-2.5 py-2.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-white outline-none focus:border-primary transition"
                style={{ minHeight: '40px' }}
              >
                <option value="revision" className="bg-slate-950">Summary Notes</option>
                <option value="mindmap" className="bg-slate-950">Mermaid Mind Map</option>
                <option value="flashcards" className="bg-slate-950">Flashcard Deck</option>
                <option value="formula" className="bg-slate-950">Formula Sheet</option>
              </select>
            </div>
            <button 
              onClick={() => {
                triggerNotesGeneration();
                setShowMobileFilters(false);
              }}
              disabled={generatingNotes}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 transition-all"
              style={{ minHeight: '44px' }}
            >
              {generatingNotes ? (
                <>
                  <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Synthesize Kit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chat Conversation Loop */}
        <div className="lg:col-span-3 flex flex-col justify-between glass-panel rounded-2xl overflow-hidden h-full relative border-border/80">
          
          {/* Notes display layer (Modal overlay inside chat) */}
          {notesResult && (
            <div className="absolute inset-0 bg-white dark:bg-slate-950/95 backdrop-blur-md p-6 z-40 overflow-y-auto flex flex-col justify-between border border-primary/20">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-border/80 mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span>Synthesized Study Kit</span>
                  </h3>
                  <button 
                    onClick={() => setNotesResult(null)}
                    className="text-xs px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-red-500/30"
                    style={{ minHeight: '40px' }}
                  >
                    Close Viewer
                  </button>
                </div>
                <div 
                  className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed space-y-3 prose-pre:font-mono font-normal"
                  dangerouslySetInnerHTML={{ __html: formatText(notesResult) }}
                ></div>
              </div>
            </div>
          )}

          {/* Chat bubble list */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                <Brain className="h-16 w-16 text-slate-600 mb-4" />
                <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">AI Study Twin Session</h3>
                <p className="text-slate-500 dark:text-slate-500 text-xs mt-1.5 max-w-sm leading-relaxed">
                  I represent your cognitive double. Ask questions about your uploaded documents, ask for conceptual explanations, or generate summaries.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Brain className="h-5 w-5" />
                  </div>
                )}
                
                <div className="max-w-[85%] sm:max-w-[80%] flex flex-col">
                  <div className={`p-3.5 rounded-2xl text-[11px] sm:text-xs leading-relaxed border relative shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary/10 border-primary/25 text-slate-800 dark:text-white rounded-tr-none' 
                      : 'bg-slate-50/60 dark:bg-slate-950/40 border-border/80 text-slate-700 dark:text-slate-350 rounded-tl-none font-normal'
                  }`}>
                    <div 
                      className="space-y-1.5"
                      dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                    ></div>
                  </div>

                  {/* Sources citation */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold self-center mr-1">Sources:</span>
                      {msg.sources.map((src, sIdx) => (
                        <div 
                          key={sIdx}
                          className="inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-border text-slate-500 dark:text-slate-450"
                        >
                          <FileText className="h-2.5 w-2.5 text-primary" />
                          <span className="truncate max-w-[120px]">{src.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-border/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <Terminal className="h-4.5 w-4.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-white shrink-0">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-border text-slate-500 rounded-tl-none flex gap-1 items-center h-10">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 typing-dot"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 typing-dot"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 typing-dot"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef}></div>
          </div>

          {/* Input control block */}
          <div className="p-4 border-t border-border/80 bg-slate-100/40 dark:bg-slate-950/30">
            <form onSubmit={handleSendMessage} className="flex gap-3 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your clone about formulas, concepts, or uploaded notes..."
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                className="flex-1 max-h-24 min-h-[44px] pl-4 pr-12 py-3 rounded-xl glass-input text-xs resize-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-2 p-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
