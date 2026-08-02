import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle2, 
  Sparkles, RefreshCw, X 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

type Block = {
  time: string;
  subject: string;
  focus: string;
  duration_minutes: number;
};

type ScheduleDay = {
  day: string;
  blocks: Block[];
};

type StudyPlan = {
  id: number;
  title: string;
  schedule_json: string;
  exam_date: string | null;
  plan_type: string;
  active: boolean;
};

type StudyLog = {
  id: number;
  subject_id: number;
  duration_minutes: number;
  study_date: string;
};

export const Planner: React.FC = () => {
  const { token, apiUrl, subjects, user, updateUserLocal } = useApp();

  // Active plan states
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Layout states
  const [showMobileConfig, setShowMobileConfig] = useState(false);

  // Form states for plan creation
  const [selectedSubNames, setSelectedSubNames] = useState<string[]>([]);
  const [availableHours, setAvailableHours] = useState(2.0);
  const [examDate, setExamDate] = useState('');
  const [generating, setGenerating] = useState(false);

  // Manual study logger state
  const [logSubId, setLogSubId] = useState<number | null>(null);
  const [logMinutes, setLogMinutes] = useState(30);
  const [logging, setLogging] = useState(false);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);

  // Local storage completion checklists for calendar blocks
  const [completedBlocks, setCompletedBlocks] = useState<Record<string, boolean>>({});

  const fetchActivePlan = async () => {
    if (!token) return;
    setLoadingPlan(true);
    try {
      const res = await fetch(`${apiUrl}/planner/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivePlan(data);
        setSchedule(JSON.parse(data.schedule_json));
      } else {
        setActivePlan(null);
        setSchedule([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlan(false);
    }
  };

  const fetchLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/planner/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudyLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchActivePlan();
      fetchLogs();
    }
  }, [token]);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (selectedSubNames.length === 0) {
      alert('Please select at least one Subject.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${apiUrl}/planner/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subjects: selectedSubNames,
          available_hours: availableHours,
          exam_date: examDate || null
        })
      });

      if (res.ok) {
        fetchActivePlan();
        setSelectedSubNames([]);
        setExamDate('');
        setShowMobileConfig(false);
      } else {
        alert('Failed to generate planner. Ensure subjects have uploaded materials.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogStudyTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !logSubId) return;
    setLogging(true);
    try {
      const res = await fetch(`${apiUrl}/planner/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: logSubId,
          duration_minutes: logMinutes
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (user) {
          updateUserLocal({
            ...user,
            xp: user.xp + Math.floor(data.duration_minutes / 10) * 5
          });
        }
        setLogMinutes(30);
        setLogSubId(null);
        fetchLogs();
        fetchActivePlan();
        setShowMobileConfig(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogging(false);
    }
  };

  const handleCheckBlock = async (day: string, idx: number, subName: string, duration: number) => {
    const key = `${day}_${idx}`;
    const alreadyDone = completedBlocks[key];
    
    setCompletedBlocks(prev => ({ ...prev, [key]: !alreadyDone }));

    if (!alreadyDone) {
      const matchingSub = subjects.find(s => s.name.toLowerCase() === subName.toLowerCase());
      if (matchingSub && token) {
        try {
          await fetch(`${apiUrl}/planner/log`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              subject_id: matchingSub.id,
              duration_minutes: duration
            })
          });
          fetchLogs();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleToggleSubCheckbox = (name: string) => {
    setSelectedSubNames(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-1rem)] bg-background text-foreground transition-all overflow-hidden">
      <Header title={activePlan ? `Planner: ${activePlan.title}` : "Study Planner"} />

      {/* Mobile Configuration Toggle */}
      <button 
        onClick={() => setShowMobileConfig(!showMobileConfig)}
        className="lg:hidden flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-card border border-border/80 text-xs text-slate-650 dark:text-slate-400 font-bold mb-3 cursor-pointer shadow-sm active:bg-slate-100 dark:active:bg-slate-900"
        style={{ minHeight: '44px' }}
      >
        <Calendar className="h-4 w-4" />
        <span>{showMobileConfig ? 'Hide Config & Logger' : 'Show Config & Logger'}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden h-full">
        
        {/* Creation Controls & Manual Logging sidebar */}
        <div className={`lg:col-span-1 glass-panel p-5 rounded-2xl flex flex-col justify-between overflow-y-auto space-y-6 ${
          showMobileConfig ? 'block absolute inset-x-4 top-24 bottom-20 z-20 bg-background/95 backdrop-blur-2xl' : 'hidden lg:flex'
        }`}>
          
          {/* AI planner form */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-display font-semibold text-white text-base">AI Weekly Scheduler</h3>
              </div>
              {showMobileConfig && (
                <button 
                  onClick={() => setShowMobileConfig(false)}
                  className="p-1 rounded bg-slate-900 border border-slate-750 text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Select Subjects</label>
                <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                  {subjects.map(s => (
                    <label key={s.id} className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-white cursor-pointer select-none py-1 min-h-[36px]">
                      <input 
                        type="checkbox" 
                        checked={selectedSubNames.includes(s.name)}
                        onChange={() => handleToggleSubCheckbox(s.name)}
                        className="h-5 w-5 rounded bg-slate-900 border border-slate-700 text-primary cursor-pointer focus:ring-1 focus:ring-primary"
                      />
                      <span className="truncate">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Daily Study Hours</label>
                <input 
                  type="range" 
                  min={1}
                  max={6}
                  step={0.5}
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary border border-slate-700"
                  style={{ minHeight: '44px' }} // Touch guidelines
                />
                <span className="text-xs text-slate-300 mt-1 block font-bold font-mono-data">{availableHours} hours / day</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Exam Preparation Date</label>
                <input 
                  type="date" 
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-white outline-none focus:border-primary transition"
                  style={{ minHeight: '40px' }}
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    <span>Structuring Plan...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-4.5 w-4.5" />
                    <span>Generate Schedule</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Manual logger */}
          <div className="pt-5 border-t border-border/60">
            <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-display font-semibold text-white text-base">Log Study Hours</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono-data">Logged: {studyLogs.length}</span>
            </div>
            
            <form onSubmit={handleLogStudyTime} className="space-y-4 text-left">
              <div>
                <select
                  value={logSubId || ''}
                  required
                  onChange={(e) => setLogSubId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-white outline-none focus:border-primary transition"
                  style={{ minHeight: '40px' }}
                >
                  <option value="" disabled className="bg-slate-950">Choose Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-950 text-white">{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Study Duration</label>
                <select
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-white outline-none focus:border-primary transition"
                  style={{ minHeight: '40px' }}
                >
                  <option value={15} className="bg-slate-950">15 Minutes (+5 XP)</option>
                  <option value={30} className="bg-slate-950">30 Minutes (+15 XP)</option>
                  <option value={45} className="bg-slate-950">45 Minutes (+20 XP)</option>
                  <option value={60} className="bg-slate-950">60 Minutes (+30 XP)</option>
                  <option value={90} className="bg-slate-950">90 Minutes (+45 XP)</option>
                  <option value={120} className="bg-slate-950">120 Minutes (+60 XP)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={logging}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-white transition cursor-pointer shadow-md shadow-primary/10"
                style={{ minHeight: '44px' }}
              >
                Log Session
              </button>
            </form>
          </div>

        </div>

        {/* Schedule Display */}
        <div className="lg:col-span-3 glass-panel border rounded-2xl flex flex-col overflow-hidden h-full border-border/80">
          {loadingPlan ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activePlan && schedule.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-border/80">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg">{activePlan.title}</h3>
                  {activePlan.exam_date && (
                    <p className="text-xs text-accent mt-0.5 font-bold">
                      Countdown to Exam: {new Date(activePlan.exam_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="text-[10px] bg-primary/20 text-primary font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>

              <div className="space-y-5">
                {schedule.map((dayData, dayIdx) => (
                  <div key={dayIdx} className="rounded-xl border border-border/60 bg-slate-50/40 dark:bg-slate-950/20 overflow-hidden shadow-sm">
                    <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-950/60 font-extrabold text-xs text-slate-800 dark:text-white border-b border-border/40 uppercase tracking-wide">
                      {dayData.day}
                    </div>
                    
                    <div className="p-3.5 space-y-3">
                      {dayData.blocks.map((block, bIdx) => {
                        const blockKey = `${dayData.day}_${bIdx}`;
                        const isCompleted = completedBlocks[blockKey];
                        return (
                          <div 
                            key={bIdx}
                            className={`p-3.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                              isCompleted 
                                ? 'bg-emerald-500/5 border-emerald-500/25 opacity-70' 
                                : 'bg-white dark:bg-slate-900/50 border-border/80 hover:border-primary/25 shadow-sm'
                            }`}
                          >
                            <div className="flex gap-3 items-center">
                              <button 
                                onClick={() => handleCheckBlock(dayData.day, bIdx, block.subject, block.duration_minutes)}
                                className={`h-6.5 w-6.5 rounded-md border flex items-center justify-center transition shrink-0 cursor-pointer ${
                                  isCompleted 
                                    ? 'bg-emerald-500 border-emerald-400 text-white' 
                                    : 'border-slate-400 dark:border-slate-600 hover:border-primary'
                                }`}
                                aria-label="Mark task as complete"
                              >
                                {isCompleted && <CheckCircle2 className="h-4.5 w-4.5" />}
                              </button>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{block.subject}</span>
                                  <span className="text-[9px] bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-border/60 text-slate-500">
                                    {block.time} ({block.duration_minutes}m)
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{block.focus}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {dayData.blocks.length === 0 && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-2.5">
                          Rest day. Take time to revise weak topics!
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
              <Calendar className="h-14 w-14 text-slate-450 dark:text-slate-600 mb-3" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">No active study plan</h4>
              <p className="text-slate-500 text-xs mt-1 mb-5 max-w-sm leading-relaxed">
                Your AI Study Twin hasn't structured a weekly planner for you yet. Choose your subject checklist and click generate above!
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
