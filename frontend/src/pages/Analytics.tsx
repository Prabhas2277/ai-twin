import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, LineChart, Line, CartesianGrid 
} from 'recharts';
import { BarChart2, TrendingUp, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

type SubjectPerformance = {
  subject_id: number;
  name: string;
  color: string;
  document_count: number;
  quiz_count: number;
  average_score: number;
  total_study_minutes: number;
};

type StudyConsistency = {
  day: string;
  date: string;
  minutes: number;
};

type KnowledgeGrowth = {
  quiz_title: string;
  score: number;
  date: string;
};

type PerformanceData = {
  subject_performance: SubjectPerformance[];
  study_consistency: StudyConsistency[];
  knowledge_growth: KnowledgeGrowth[];
};

export const Analytics: React.FC = () => {
  const { token, apiUrl, theme } = useApp();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/analytics/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <p className="text-red-500 p-8">Failed to load analytics charts.</p>;

  // Custom tooltips styling for dark/light mode compatibility
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white dark:bg-slate-950/95 border border-border/80 rounded-lg text-[10px] text-left shadow-2xl">
          <p className="font-extrabold text-slate-800 dark:text-white mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color || '#a78bfa' }} className="font-semibold">
              {p.name}: {p.value} {p.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const gridStroke = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const labelColor = theme === 'dark' ? '#94a3b8' : '#475569';

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col min-h-screen">
      <Header title="Analytics & Cognitive Mapping" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Study Consistency Chart */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4.5 w-4.5 text-secondary" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Study Consistency (Last 7 Days)</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.study_consistency}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="day" stroke={labelColor} fontSize={10} tickLine={false} />
                  <YAxis stroke={labelColor} fontSize={10} tickLine={false} unit="m" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    name="Minutes Studied" 
                    unit="m"
                    dataKey="minutes" 
                    stroke="#14b8a6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorMinutes)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Knowledge Growth Line */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Cognitive Growth Index (Quiz History)</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.knowledge_growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" stroke={labelColor} fontSize={10} tickLine={false} />
                  <YAxis stroke={labelColor} fontSize={10} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    name="Quiz Score"
                    unit="%"
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5}
                    dot={{ fill: '#ec4899', r: 4, strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subject wise average scores */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4.5 w-4.5 text-accent" />
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Subject Comparison Metrics</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subject_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" stroke={labelColor} fontSize={10} tickLine={false} />
                <YAxis stroke={labelColor} fontSize={10} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="average_score" 
                  name="Average Score" 
                  unit="%"
                  fill="#6366f1" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={45} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Performance List */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">Classroom Breakdown</h3>
          <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
            {data.subject_performance.map((sub, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-border/80 text-xs shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: sub.color }}
                    ></div>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">{sub.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    {sub.average_score > 0 ? `${sub.average_score}%` : 'No data'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-border/40">
                  <div>Files synced: <strong className="text-slate-700 dark:text-slate-200">{sub.document_count}</strong></div>
                  <div>Studied: <strong className="text-slate-700 dark:text-slate-200">{Math.round(sub.total_study_minutes / 60 * 10) / 10}h</strong></div>
                </div>
              </div>
            ))}

            {data.subject_performance.length === 0 && (
              <p className="text-xs text-slate-500 py-12 text-center">
                No subjects registered. Create subjects to populate breakdown.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
