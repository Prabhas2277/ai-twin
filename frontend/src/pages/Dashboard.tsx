import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FileText, CheckSquare, Clock, 
  Brain, AlertCircle, Calendar, Sparkles 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { PixelTransition } from '../components/PixelTransition';

type DashboardData = {
  total_subjects: number;
  documents_uploaded: number;
  quizzes_completed: number;
  study_hours: number;
  knowledge_score: number;
  weak_topics_count: number;
  level: number;
  xp: number;
  streak: number;
  recent_activity: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
  recommendations: string[];
};

export const Dashboard: React.FC = () => {
  const { token, apiUrl, user } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/analytics/overview`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <p className="text-red-500 p-8">Failed to load dashboard.</p>;

  const cards = [
    { title: 'Total Subjects', value: data.total_subjects, icon: BookOpen, color: 'text-primary border-primary/20 bg-primary/5' },
    { title: 'Notes Synced', value: data.documents_uploaded, icon: FileText, color: 'text-primary border-primary/20 bg-primary/5' },
    { title: 'Quizzes Taken', value: data.quizzes_completed, icon: CheckSquare, color: 'text-primary border-primary/20 bg-primary/5' },
    { title: 'Hours Studied', value: `${data.study_hours}h`, icon: Clock, color: 'text-primary border-primary/20 bg-primary/5' },
    { title: 'Knowledge Level', value: `${data.knowledge_score}%`, icon: Brain, color: 'text-primary border-primary/20 bg-primary/5' },
    { title: 'Weak Topics', value: data.weak_topics_count, icon: AlertCircle, color: 'text-red-500 border-red-500/20 bg-red-500/5' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <Header title="My Study Twin Dashboard" />

      <PixelTransition gridSize={10}>
        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    {card.title}
                  </span>
                  <div className={`p-1.5 rounded-lg border ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-semibold text-white font-mono-data tracking-tight">
                  {card.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Widgets row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Clone Status */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-white text-base">Twin Status</h3>
              </div>

              <div className="mb-6 pb-6 border-b border-border">
                <div className="text-slate-500 text-xs mb-1">Memory depth</div>
                <div className="font-mono-data text-4xl font-semibold text-white">
                  {Math.round(data.documents_uploaded * 7.5 + data.quizzes_completed * 4.2)}%
                </div>
                <p className="text-[11px] text-primary mt-1">
                  {data.documents_uploaded === 0 ? 'Needs files to sync' : 'Synced and calibrating'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Level</span>
                  <span className="text-white font-mono-data">{data.level}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Streak</span>
                  <span className="text-white font-mono-data">{data.streak}d</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Learning style</span>
                  <span className="text-white capitalize">{user?.preferred_learning_style || 'General'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-display font-semibold text-white text-base">Twin Suggestions</h3>
              </div>
              
              <div className="space-y-3">
                {data.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-border text-xs text-slate-350 leading-relaxed shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
                
                {data.recommendations.length === 0 && (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Your twin has no immediate tips. Try taking quizzes to test your knowledge!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-secondary" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Recent Brain Syncs</h3>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {data.recent_activity.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    act.type === 'upload' ? 'bg-secondary/10 text-secondary' :
                    act.type === 'quiz' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {act.type === 'upload' ? <FileText className="h-3.5 w-3.5" /> :
                     act.type === 'quiz' ? <CheckSquare className="h-3.5 w-3.5" /> :
                     <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{act.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{act.description}</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                      {new Date(act.timestamp).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {data.recent_activity.length === 0 && (
                <p className="text-xs text-slate-500 py-12 text-center">
                  No recent study activity logged. Get started by uploading a file!
                </p>
              )}
            </div>
          </div>
        </div>
      </PixelTransition>
    </div>
  );
};

