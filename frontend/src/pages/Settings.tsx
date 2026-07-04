import React, { useState } from 'react';
import { User, Settings as SettingsIcon, Brain, Clock, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const Settings: React.FC = () => {
  const { user, token, apiUrl, updateUserLocal } = useApp();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [learningStyle, setLearningStyle] = useState(user?.preferred_learning_style || 'textual');
  const [dailyGoal, setDailyGoal] = useState(user?.daily_study_goal_hours || 2.0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`${apiUrl}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          preferred_learning_style: learningStyle,
          daily_study_goal_hours: dailyGoal
        })
      });

      if (res.ok) {
        const data = await res.json();
        updateUserLocal(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full text-left bg-background text-foreground transition-all">
      <Header title="Twin Settings" />

      <div className="glass-panel p-6 rounded-2xl border-border/80 shadow-md">
        <div className="flex items-center gap-2 mb-6 border-b border-border/60 pb-3">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Clone Adaptation Preferences</h3>
        </div>

        {success && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-505/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold leading-relaxed">
            Preferences synced successfully! Your AI Study Twin has recalibrated.
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1.5 flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>Student Full Name</span>
              </label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1.5 flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>Preferred Learning Style</span>
              </label>
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl glass-input text-xs outline-none"
              >
                <option value="textual" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">Textual (Detail reads, structured guides)</option>
                <option value="visual" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">Visual (Analogies, mind maps, flow diagrams)</option>
                <option value="auditory" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">Auditory (Socratic scaffolded dialogue)</option>
                <option value="kinesthetic" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">Kinesthetic (Quizzes, coding blocks, math formulas)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1.5 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>Daily Study Goal Hours</span>
              </label>
              <input 
                type="number" 
                min={0.5}
                max={12}
                step={0.5}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full px-4 py-3.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/80 text-xs text-slate-650 dark:text-slate-400 space-y-2">
            <h4 className="font-extrabold text-slate-850 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              <span>Session Details</span>
            </h4>
            <p>Registered Email: <strong className="text-slate-700 dark:text-slate-200">{user.email}</strong></p>
            <p>Account Type: <strong className="capitalize text-slate-700 dark:text-slate-200">{user.role}</strong></p>
            <p>Joined Date: <strong className="text-slate-700 dark:text-slate-200">{new Date(user.created_at).toLocaleDateString()}</strong></p>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/60">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-background shadow-lg shadow-primary/10 cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              {saving ? 'Syncing...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
